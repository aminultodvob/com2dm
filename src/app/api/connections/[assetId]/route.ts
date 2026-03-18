import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const asset = await db.connectedAsset.findFirst({
    where: { id: assetId, workspaceId: ctx.workspace.id },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const relatedAssetIds = new Set<string>([asset.id]);

  if (asset.assetType === "FACEBOOK_PAGE") {
    if (asset.instagramAccountId) {
      const linkedInstagramAssets = await db.connectedAsset.findMany({
        where: {
          workspaceId: ctx.workspace.id,
          assetType: "INSTAGRAM_ACCOUNT",
          isActive: true,
          OR: [
            { externalAssetId: asset.instagramAccountId },
            { instagramAccountId: asset.instagramAccountId },
          ],
        },
        select: { id: true },
      });

      linkedInstagramAssets.forEach((item) => relatedAssetIds.add(item.id));
    }
  }

  if (asset.assetType === "INSTAGRAM_ACCOUNT") {
    const linkedPageWhere = asset.instagramAccountId
      ? {
          workspaceId: ctx.workspace.id,
          assetType: "FACEBOOK_PAGE" as const,
          isActive: true,
          OR: [
            { instagramAccountId: asset.externalAssetId },
            { externalAssetId: asset.instagramAccountId },
          ],
        }
      : {
          workspaceId: ctx.workspace.id,
          assetType: "FACEBOOK_PAGE" as const,
          isActive: true,
          instagramAccountId: asset.externalAssetId,
        };

    const linkedPageAssets = await db.connectedAsset.findMany({
      where: linkedPageWhere,
      select: { id: true },
    });

    linkedPageAssets.forEach((item) => relatedAssetIds.add(item.id));
  }

  await db.connectedAsset.updateMany({
    where: {
      workspaceId: ctx.workspace.id,
      id: { in: Array.from(relatedAssetIds) },
    },
    data: { isActive: false, webhookSubscribed: false },
  });

  const activeAssetsForConnection = await db.connectedAsset.count({
    where: {
      workspaceId: ctx.workspace.id,
      socialConnectionId: asset.socialConnectionId,
      isActive: true,
    },
  });

  if (activeAssetsForConnection === 0) {
    await db.socialConnection.update({
      where: { id: asset.socialConnectionId },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
