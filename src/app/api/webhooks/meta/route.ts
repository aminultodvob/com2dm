import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { processWebhookEvent } from "@/lib/automations/processor";

export const dynamic = "force-dynamic";

/**
 * GET - Webhook Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    console.log("Webhook Verified via Meta");
    return new NextResponse(challenge);
  }

  // If no params, it's probably someone hitting it manually.
  // Return a success message to verify the endpoint is ALIVE.
  return NextResponse.json({ 
    status: "alive", 
    message: "Com2DM Webhook Endpoint is active.",
    note: "Use POST for Meta webhooks."
  });
}

/**
 * POST - Event Ingestion
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("META WEBHOOK RECEIVED:", JSON.stringify(payload, null, 2));

    const entryId = Array.isArray(payload?.entry) ? payload.entry[0]?.id : null;
    console.log("ENTRY ID:", entryId);
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

    // 2. Process webhook synchronously/fire-and-forget (Serverless Architecture)
    try {
      // Execute the processing without awaiting it immediately if possible
      // to return 200 OK fast. But on Vercel, isolated promises might die. 
      // Awaiting it is safe enough since DM logic usually takes < 2 seconds.
      await processWebhookEvent(rawEvent.id);
    } catch (processingError) {
      console.error("Serverless processing failed:", processingError);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}


