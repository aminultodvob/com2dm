import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { getQueueConnection, getOutboundQueue } from "@/lib/queue/client";
import { findMatchingRules } from "@/lib/automations/engine";
import { generateIdempotencyKey } from "@/lib/utils";
import { incrementUsage, getPlanLimit, getOrCreateUsage } from "@/lib/usage";

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
      const post = valueAny["post"] as { id?: string } | undefined;
      const media = valueAny["media"] as { id?: string } | undefined;
      const commentId = String(valueAny["comment_id"] ?? valueAny["id"] ?? "");
      const postId = String(
        valueAny["post_id"] ??
          valueAny["media_id"] ??
          post?.id ??
          media?.id ??
          ""
      );
      if (object === "page") {
        if (change?.field === "feed" && valueAny?.item === "comment") {
          events.push({
            platform: "FACEBOOK",
            assetExternalId: entryId ?? String(valueAny?.post_id ?? "").split("_")[0],
            commentId,
            postId,
            commenterId: String(from?.id ?? valueAny?.sender_id ?? ""),
            commenterName: from?.name ?? undefined,
            commentText: String(valueAny?.message ?? ""),
          });
        }
      }

      if (object === "instagram") {
        if (
          change?.field === "comments" ||
          change?.field === "instagram_comments"
        ) {
          events.push({
            platform: "INSTAGRAM",
            assetExternalId: entryId ?? String(from?.id ?? ""),
            commentId,
            postId,
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

async function processEvent(rawEventId: string) {
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
        await db.webhookEventRaw.update({
          where: { id: raw.id },
          data: { processed: true, processedAt: new Date() },
        });
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
        const matchedKeyword = resolveMatchedKeyword(rule, event.commentText);

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

        const queue = getOutboundQueue();
        await queue.add(
          "send-meta-message",
          { jobId: job.id, assetId: asset.id },
          { attempts: 3, backoff: { type: "exponential", delay: 1000 } }
        );
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

const worker = new Worker(
  "meta-inbound",
  async (job) => {
    const eventId = job.data?.eventId as string | undefined;
    if (!eventId) return;
    await processEvent(eventId);
  },
  { connection: getQueueConnection() }
);

worker.on("failed", (job, err) => {
  console.error("Inbound worker failed", job?.id, err);
});
