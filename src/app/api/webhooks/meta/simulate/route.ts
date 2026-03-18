import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processWebhookEvent } from "@/lib/automations/processor";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/meta/simulate
 * Developer-only endpoint to simulate a comment webhook and test the full pipeline.
 * This bypasses Meta and fires a fake comment event directly through the processor.
 *
 * Body:
 * {
 *   assetId: string;           // Your connected asset's internal DB id
 *   commentText: string;       // The comment text to match against rules
 *   commenterId: string;       // The commenter's Meta user ID
 *   commenterName?: string;    // Optional name
 * }
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { assetId, commentText, commenterId, commenterName } = body;

  if (!assetId || !commentText || !commenterId) {
    return NextResponse.json(
      { error: "assetId, commentText, and commenterId are required" },
      { status: 400 }
    );
  }

  const asset = await db.connectedAsset.findFirst({
    where: { id: assetId, workspaceId: ctx.workspace.id, isActive: true },
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // Build a fake Meta webhook payload mimicking the real format
  const platform = asset.assetType === "INSTAGRAM_ACCOUNT" ? "instagram" : "page";
  const fakeCommentId = `sim_comment_${Date.now()}`;
  const fakePostId = `sim_post_${Date.now()}`;

  let fakePayload: Record<string, unknown>;

  if (platform === "page") {
    fakePayload = {
      object: "page",
      entry: [
        {
          id: asset.externalAssetId,
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                comment_id: fakeCommentId,
                post_id: `${asset.externalAssetId}_${fakePostId}`,
                from: { id: commenterId, name: commenterName ?? "Test User" },
                message: commentText,
              },
            },
          ],
        },
      ],
    };
  } else {
    fakePayload = {
      object: "instagram",
      entry: [
        {
          id: asset.externalAssetId,
          changes: [
            {
              field: "comments",
              value: {
                id: fakeCommentId,
                media_id: fakePostId,
                from: { id: commenterId, username: commenterName ?? "testuser" },
                text: commentText,
              },
            },
          ],
        },
      ],
    };
  }

  // Store the raw event
  const rawEvent = await db.webhookEventRaw.create({
    data: {
      platform: asset.assetType === "INSTAGRAM_ACCOUNT" ? "INSTAGRAM" : "FACEBOOK",
      eventType: "simulated_comment",
      workspaceId: asset.workspaceId,
      payload: fakePayload as Parameters<typeof db.webhookEventRaw.create>[0]["data"]["payload"],
    },
  });

  // Process it through the real pipeline
  try {
    await processWebhookEvent(rawEvent.id);
  } catch (err) {
    console.error("[SIMULATE] Processing error:", err);
    return NextResponse.json(
      { rawEventId: rawEvent.id, error: String(err), status: "processing_failed" },
      { status: 500 }
    );
  }

  // Return updated state
  const updatedEvent = await db.webhookEventRaw.findUnique({
    where: { id: rawEvent.id },
  });

  const deliveryLogs = await db.messageDeliveryLog.findMany({
    where: { workspaceId: asset.workspaceId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    status: "simulated",
    rawEventId: rawEvent.id,
    processed: updatedEvent?.processed,
    error: updatedEvent?.error ?? null,
    recentDeliveryLogs: deliveryLogs,
  });
}
