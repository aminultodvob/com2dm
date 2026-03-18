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
    // IMPORTANT: For Instagram, the Send API targets the Instagram account ID on /messages.
    // The stored token is still page-scoped, but the target object remains the IG account ID.
    const senderId = asset.externalAssetId;
    const senderToken = asset.accessToken;

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
