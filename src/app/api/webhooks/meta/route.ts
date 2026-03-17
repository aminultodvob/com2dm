import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getInboundQueue } from "@/lib/queue/client";

/**
 * GET - Webhook Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    console.log("Webhook Verified");
    return new NextResponse(challenge);
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST - Event Ingestion
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const entryId = Array.isArray(payload?.entry) ? payload.entry[0]?.id : null;
    const asset = entryId
      ? await db.connectedAsset.findFirst({
          where: { externalAssetId: entryId, isActive: true },
        })
      : null;
    
    // 1. Store raw event for auditing
    const rawEvent = await db.webhookEventRaw.create({
      data: {
        platform: payload.object === "instagram" ? "INSTAGRAM" : "FACEBOOK",
        eventType: "raw",
        workspaceId: asset?.workspaceId ?? null,
        payload,
      }
    });

    // 2. Offload to BullMQ for async processing (non-blocking)
    try {
      const queue = getInboundQueue();
      await queue.add("process-meta-webhook", {
        eventId: rawEvent.id,
        payload
      }, {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 }
      });
    } catch (queueError) {
      console.warn("Queue not available, event stored but not queued:", queueError);
      // We don't fail the request here, as we have the raw event in DB
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}


