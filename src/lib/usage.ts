import { db } from "@/lib/db";
import { SubscriptionTier } from "@prisma/client";

export function getPlanLimit(tier: SubscriptionTier) {
  switch (tier) {
    case "STARTER":
      return 1000;
    case "PRO":
      return 10000;
    default:
      return 100;
  }
}

export function getPeriodBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59));
  return { start, end };
}

export async function getOrCreateUsage(workspaceId: string) {
  const { start, end } = getPeriodBounds();
  const existing = await db.usageRecord.findFirst({
    where: { workspaceId, periodStart: start },
  });
  if (existing) return existing;

  return db.usageRecord.create({
    data: {
      workspaceId,
      periodStart: start,
      periodEnd: end,
    },
  });
}

export async function incrementUsage(params: {
  workspaceId: string;
  messagesSent?: number;
  messagesFailed?: number;
  matchesMade?: number;
  commentsProcessed?: number;
}) {
  const usage = await getOrCreateUsage(params.workspaceId);
  return db.usageRecord.update({
    where: { id: usage.id },
    data: {
      messagesSent: { increment: params.messagesSent ?? 0 },
      messagesFailed: { increment: params.messagesFailed ?? 0 },
      matchesMade: { increment: params.matchesMade ?? 0 },
      commentsProcessed: { increment: params.commentsProcessed ?? 0 },
    },
  });
}
