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
  console.log(`[META WEBHOOK] Incoming Request: ${req.method} ${req.url}`);
  console.log(`[META WEBHOOK] Headers:`, JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

  try {
    const payload = await req.json();
    console.log("META WEBHOOK RECEIVED PAYLOAD:", JSON.stringify(payload, null, 2));

    const entryId = Array.isArray(payload?.entry) ? payload.entry[0]?.id : null;
    const isInstagram = payload?.object === "instagram";
    console.log("ENTRY ID:", entryId, "| Platform:", isInstagram ? "instagram" : "facebook/page");

    let asset = null;
    if (entryId) {
      // For Facebook: entry.id = Page ID → matches FACEBOOK_PAGE asset
      // For Instagram: entry.id = IG Business Account ID → matches INSTAGRAM_ACCOUNT asset
      asset = await db.connectedAsset.findFirst({
        where: { externalAssetId: entryId, isActive: true },
      });

      // If still not found (edge case), try finding the FB page that has this instagramAccountId
      if (!asset && isInstagram) {
        asset = await db.connectedAsset.findFirst({
          where: { instagramAccountId: entryId, assetType: "FACEBOOK_PAGE", isActive: true },
        });
      }
    }

    // 1. Store raw event for auditing
    const rawEvent = await db.webhookEventRaw.create({
      data: {
        platform: isInstagram ? "INSTAGRAM" : "FACEBOOK",
        eventType: "raw",
        workspaceId: asset?.workspaceId ?? null,
        payload,
      }
    });

    // 2. Process webhook (awaited to ensure it runs before Vercel serverless function closes)
    try {
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


