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

  await db.connectedAsset.update({
    where: { id: asset.id },
    data: { isActive: false, webhookSubscribed: false },
  });

  return NextResponse.json({ ok: true });
}
