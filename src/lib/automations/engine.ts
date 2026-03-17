import { db } from "@/lib/db";
import { MatchMode, Platform } from "@prisma/client";

interface CommentContext {
  workspaceId: string;
  platform: Platform;
  assetId: string;
  commentText: string;
  commenterId: string;
  postId: string;
}

export async function findMatchingRules(ctx: CommentContext) {
  const { workspaceId, platform, assetId, commentText } = ctx;
  const normalizedComment = commentText.trim();

  // 1. Find all active rules for this workspace/platform
  const rules = await db.automationRule.findMany({
    where: {
      workspaceId,
      platform: { in: [platform, Platform.BOTH] },
      status: "ACTIVE",
      deletedAt: null,
      OR: [
        { connectedAssetId: assetId },
        { connectedAssetId: null } // Applies to all assets
      ]
    },
    include: {
      keywords: true,
      messageTemplate: true
    },
    orderBy: { priority: "desc" }
  });

  const matchingRules = [];

  for (const rule of rules) {
    const isMatched = rule.keywords.some(kw => {
      const keyword = kw.keyword.trim();
      const comment = rule.caseSensitive
        ? normalizedComment
        : normalizedComment.toLowerCase();
      const compareKeyword = rule.caseSensitive
        ? keyword
        : keyword.toLowerCase();
      
      switch (rule.matchMode) {
        case MatchMode.EXACT:
          return comment === compareKeyword;
        case MatchMode.CONTAINS:
          return comment.includes(compareKeyword);
        case MatchMode.STARTS_WITH:
          return comment.startsWith(compareKeyword);
        default:
          return false;
      }
    });

    if (isMatched) {
      // 2. Check Cooldown / Deduplication
      const isDuplicate = await checkDeduplication(ctx, rule.id, rule.cooldownHours);
      if (!isDuplicate) {
        matchingRules.push(rule);
      }
    }
  }

  return matchingRules;
}

async function checkDeduplication(ctx: CommentContext, ruleId: string, cooldownHours: number) {
  if (cooldownHours < 0) return false;

  const cooldown = cooldownHours ?? 24;
  const since = new Date(Date.now() - cooldown * 60 * 60 * 1000);

  const existing = await db.triggerEventLog.findFirst({
    where: {
      workspaceId: ctx.workspaceId,
      ruleId,
      commenterId: ctx.commenterId,
      postId: ctx.postId,
      ...(cooldown === 0 ? {} : { processedAt: { gte: since } })
    }
  });

  return !!existing;
}
