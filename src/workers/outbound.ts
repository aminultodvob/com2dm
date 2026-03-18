import { Worker } from "bullmq";
import { db } from "@/lib/db";
import { getQueueConnection } from "@/lib/queue/client";
import { sendMetaMessage } from "@/lib/meta";
import { incrementUsage } from "@/lib/usage";

async function processOutbound(jobId: string, assetId: string) {
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
    // We find the linked Facebook Page asset to get the correct page ID and token.
    let senderId = asset.externalAssetId;
    let senderToken = asset.accessToken;

    if (job.platform === "INSTAGRAM" && asset.instagramAccountId) {
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
        console.log(`[IG DM worker] Using page ${senderId} instead of IG account ${asset.externalAssetId}`);
      }
    }

    const response = await sendMetaMessage({
      platform: job.platform as "FACEBOOK" | "INSTAGRAM",
      pageOrIgId: senderId,
      recipientId: job.recipientId,
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
        apiResponse: response,
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

const worker = new Worker(
  "meta-outbound",
  async (job) => {
    const jobId = job.data?.jobId as string | undefined;
    const assetId = job.data?.assetId as string | undefined;
    if (!jobId || !assetId) return;
    await processOutbound(jobId, assetId);
  },
  { connection: getQueueConnection() }
);

worker.on("failed", (job, err) => {
  console.error("Outbound worker failed", job?.id, err);
});
