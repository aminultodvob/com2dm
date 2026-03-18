import { db } from "@/lib/db";
import { findMatchingRules } from "@/lib/automations/engine";
import { generateIdempotencyKey } from "@/lib/utils";
import { incrementUsage, getPlanLimit, getOrCreateUsage } from "@/lib/usage";
import { sendMetaMessage } from "@/lib/meta";
import { Prisma } from "@prisma/client";

type CommentEvent = {
  platform: "FACEBOOK" | "INSTAGRAM";
  assetExternalId: string;
  commentId: string;
  postId: string;
  commenterId: string;
  commenterName?: string;
  commentText: string;
  matchedKeyword?: string;
};

type MetaChange = {
  field?: string;
  value?: Record<string, unknown>;
};

type MetaEntry = {
  id?: string;
  changes?: MetaChange[];
};

type MetaPayload = {
  object?: string;
  entry?: MetaEntry[];
};

function resolveMatchedKeyword(
  rule: { matchMode: string; caseSensitive: boolean; keywords: { keyword: string }[] },
  commentText: string
) {
  const comment = rule.caseSensitive ? commentText.trim() : commentText.trim().toLowerCase();

  for (const kw of rule.keywords) {
    const keyword = rule.caseSensitive ? kw.keyword.trim() : kw.keyword.trim().toLowerCase();
    if (rule.matchMode === "EXACT" && comment === keyword) return kw.keyword;
    if (rule.matchMode === "STARTS_WITH" && comment.startsWith(keyword)) return kw.keyword;
    if (rule.matchMode === "CONTAINS" && comment.includes(keyword)) return kw.keyword;
  }
  return undefined;
}

function extractEvents(payload: MetaPayload): CommentEvent[] {
  const events: CommentEvent[] = [];
  const object = payload?.object;
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    const entryId = entry?.id;
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value ?? {};
      const valueAny = value as Record<string, unknown>;
      const from = valueAny["from"] as
        | { id?: string; name?: string; username?: string }
        | undefined;
      
      if (object === "page") {
        if (change?.field === "feed" && valueAny?.item === "comment") {
          events.push({
            platform: "FACEBOOK",
            assetExternalId: entryId ?? String(valueAny?.post_id ?? "").split("_")[0],
            commentId: String(valueAny?.comment_id ?? ""),
            postId: String(valueAny?.post_id ?? ""),
            commenterId: String(from?.id ?? valueAny?.sender_id ?? ""),
            commenterName: from?.name ?? undefined,
            commentText: String(valueAny?.message ?? ""),
          });
        }
      }

      if (object === "instagram") {
        if (change?.field === "comments") {
          events.push({
            platform: "INSTAGRAM",
            assetExternalId: entryId ?? String(from?.id ?? ""),
            commentId: String(valueAny?.id ?? ""),
            postId: String(valueAny?.media_id ?? ""),
            commenterId: String(from?.id ?? ""),
            commenterName: from?.username ?? undefined,
            commentText: String(valueAny?.text ?? ""),
          });
        }
      }
    }
  }

  return events.filter((event) => event.commentText && event.commenterId);
}

export async function processWebhookEvent(rawEventId: string) {
  const raw = await db.webhookEventRaw.findUnique({ where: { id: rawEventId } });
  if (!raw) return;

  try {
    const events = extractEvents(raw.payload as MetaPayload);

    for (const event of events) {
      const asset = await db.connectedAsset.findFirst({
        where: { externalAssetId: event.assetExternalId, isActive: true },
        include: { workspace: { include: { subscription: true } } },
      });

      if (!asset) {
        // Connected asset not found, mark skipped
        continue;
      }

      const workspaceId = asset.workspaceId;

      const rules = await findMatchingRules({
        workspaceId,
        platform: event.platform,
        assetId: asset.id,
        commentText: event.commentText,
        commenterId: event.commenterId,
        postId: event.postId,
      });

      if (rules.length === 0) {
        await db.triggerEventLog.create({
          data: {
            workspaceId,
            platform: event.platform,
            postId: event.postId,
            commentId: event.commentId,
            commenterId: event.commenterId,
            commenterName: event.commenterName ?? null,
            commentText: event.commentText,
            wasMatched: false,
            skippedReason: "no_rule_match",
          },
        });
        await incrementUsage({ workspaceId, commentsProcessed: 1 });
        continue;
      }

      const usage = await getOrCreateUsage(workspaceId);
      const limit = getPlanLimit(asset.workspace.subscription?.tier ?? "FREE");

      for (const rule of rules) {
        const matchedKeyword = resolveMatchedKeyword(
          {
            matchMode: rule.matchMode,
            caseSensitive: rule.caseSensitive,
            keywords: rule.keywords,
          },
          event.commentText
        );

        await db.triggerEventLog.create({
          data: {
            workspaceId,
            ruleId: rule.id,
            platform: event.platform,
            postId: event.postId,
            commentId: event.commentId,
            commenterId: event.commenterId,
            commenterName: event.commenterName ?? null,
            commentText: event.commentText,
            matchedKeyword,
            wasMatched: true,
          },
        });

        await db.automationRule.update({
          where: { id: rule.id },
          data: { totalTriggers: { increment: 1 } },
        });

        if (usage.messagesSent >= limit) {
          await db.messageDeliveryLog.create({
            data: {
              workspaceId,
              jobId: "usage-limit",
              platform: event.platform,
              status: "RATE_LIMITED",
              postId: event.postId,
              commentId: event.commentId,
              recipientId: event.commenterId,
              recipientName: event.commenterName ?? null,
              matchedKeyword,
              ruleId: rule.id,
              ruleName: rule.name,
              failureReason: "Usage limit exceeded",
            },
          });
          continue;
        }

        const messageBody = (rule.messageTemplate?.body ?? "")
          .replace("{{commenter_name}}", event.commenterName ?? "there")
          .replace("{{keyword}}", matchedKeyword ?? "")
          .replace("{{post_link}}", "")
          .replace("{{workspace_name}}", asset.workspace.name);

        const idempotencyKey = generateIdempotencyKey(
          workspaceId,
          rule.id,
          event.commentId
        );

        let job;
        try {
          job = await db.outboundMessageJob.create({
            data: {
              workspaceId,
              ruleId: rule.id,
              platform: event.platform,
              recipientId: event.commenterId,
              recipientName: event.commenterName ?? null,
              postId: event.postId,
              commentId: event.commentId,
              messageBody,
              idempotencyKey,
            },
          });
        } catch {
          await db.messageDeliveryLog.create({
            data: {
              workspaceId,
              jobId: "duplicate",
              platform: event.platform,
              status: "DUPLICATE_PREVENTED",
              postId: event.postId,
              commentId: event.commentId,
              recipientId: event.commenterId,
              recipientName: event.commenterName ?? null,
              matchedKeyword,
              ruleId: rule.id,
              ruleName: rule.name,
              failureReason: "Duplicate prevented",
            },
          });
          continue;
        }

        await db.messageDeliveryLog.create({
          data: {
            workspaceId,
            jobId: job.id,
            platform: event.platform,
            status: "QUEUED",
            postId: event.postId,
            commentId: event.commentId,
            recipientId: event.commenterId,
            recipientName: event.commenterName ?? null,
            matchedKeyword,
            ruleId: rule.id,
            ruleName: rule.name,
            messagePreview: messageBody.slice(0, 120),
          },
        });

        // ---------------------------------------------------------
        // SERVERLESS SEND: Execute inline instead of queuing
        // ---------------------------------------------------------
        await processOutboundMessage(job.id, asset.id).catch(console.error);
      }

      await incrementUsage({ workspaceId, commentsProcessed: 1, matchesMade: rules.length });
    }

    await db.webhookEventRaw.update({
      where: { id: raw.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (error) {
    await db.webhookEventRaw.update({
      where: { id: raw.id },
      data: { processed: true, processedAt: new Date(), error: String(error) },
    });
  }
}

// ----------------------------------------------------------------------
// OUTBOUND SENDER LOGIC MINUS BULLMQ
// ----------------------------------------------------------------------
async function processOutboundMessage(jobId: string, assetId: string) {
  const job = await db.outboundMessageJob.findUnique({
    where: { id: jobId },
  });
  if (!job) return;

  const asset = await db.connectedAsset.findUnique({
    where: { id: assetId },
    include: { workspace: true },
  });
  if (!asset) return;

  try {
    // IMPORTANT: For Instagram, DMs must be sent via the linked Facebook Page's endpoint:
    //   POST /{page_id}/messages  (with page access token)
    // The IG asset's externalAssetId is the IG Account ID, NOT the page ID.
    // We resolve the correct page ID + token from the linked Facebook Page asset.
    let senderId = asset.externalAssetId;
    let senderToken = asset.accessToken;

    if (job.platform === "INSTAGRAM" && asset.instagramAccountId) {
      // Find the Facebook Page asset that owns this IG account
      const linkedPage = await db.connectedAsset.findFirst({
        where: {
          workspaceId: asset.workspaceId,
          assetType: "FACEBOOK_PAGE",
          instagramAccountId: asset.instagramAccountId,
          isActive: true,
        },
      });
      if (linkedPage) {
        senderId = linkedPage.externalAssetId;
        senderToken = linkedPage.accessToken;
        console.log(`[IG DM] Using page ${senderId} instead of IG account ${asset.externalAssetId}`);
      } else {
        console.warn(`[IG DM] No linked Facebook Page found for IG account ${asset.externalAssetId}. DM may fail.`);
      }
    }

    const response = await sendMetaMessage({
      platform: job.platform as "FACEBOOK" | "INSTAGRAM",
      pageOrIgId: senderId,
      recipientId: job.recipientId,
      commentId: job.commentId ?? undefined,
      message: job.messageBody,
      accessToken: senderToken,
    });

    await db.outboundMessageJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        processedAt: new Date(),
      },
    });

    await db.messageDeliveryLog.updateMany({
      where: { jobId: job.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        apiResponse: response as Prisma.InputJsonObject,
      },
    });

    if (job.ruleId) {
      await db.automationRule.update({
        where: { id: job.ruleId },
        data: { totalSent: { increment: 1 } },
      });
    }

    await incrementUsage({ workspaceId: job.workspaceId, messagesSent: 1 });
  } catch (error) {
    await db.outboundMessageJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: String(error),
        processedAt: new Date(),
        retryCount: { increment: 1 },
      },
    });

    await db.messageDeliveryLog.updateMany({
      where: { jobId: job.id },
      data: {
        status: "FAILED",
        failureReason: String(error),
      },
    });

    if (job.ruleId) {
      await db.automationRule.update({
        where: { id: job.ruleId },
        data: { totalFailed: { increment: 1 } },
      });
    }

    await incrementUsage({ workspaceId: job.workspaceId, messagesFailed: 1 });
  }
}
