import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";
import { subscribePage, subscribeInstagram } from "@/lib/meta";

export const dynamic = "force-dynamic";

/**
 * POST /api/meta/resubscribe
 * Re-subscribes all connected Page assets to Meta webhooks with the correct subscribed_fields.
 * Call this after fixing webhook subscription fields or when webhooks stop delivering.
 */
export async function POST() {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await db.connectedAsset.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      isActive: true,
      assetType: "FACEBOOK_PAGE",
    },
  });

  const results: { assetId: string; name: string; fb: boolean; ig: boolean; error?: string }[] = [];

  for (const asset of assets) {
    let fbOk = false;
    let igOk = false;
    let error: string | undefined;

    try {
      const fbResp = await subscribePage(asset.externalAssetId, asset.accessToken);
      fbOk = fbResp.success === true;

      // If this page has a linked IG account, also subscribe for IG webhooks
      if (asset.instagramAccountId) {
        const igResp = await subscribeInstagram(asset.externalAssetId, asset.accessToken);
        igOk = igResp.success === true;
      } else {
        igOk = true; // No IG account linked, nothing to subscribe
      }

      await db.connectedAsset.update({
        where: { id: asset.id },
        data: { webhookSubscribed: fbOk },
      });
    } catch (err) {
      error = String(err);
      console.error(`[Resubscribe] Failed for asset ${asset.id}:`, err);
    }

    results.push({
      assetId: asset.id,
      name: asset.name,
      fb: fbOk,
      ig: igOk,
      error,
    });
  }

  return NextResponse.json({ resubscribed: results });
}
