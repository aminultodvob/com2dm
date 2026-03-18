import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { ConnectedAssetsClient } from "./connections-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connections" };

export default async function ConnectionsPage() {
  const { workspace } = await requireWorkspace();

  const [socialConnections, connectedAssets] = await Promise.all([
    db.socialConnection.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { connectedAt: "desc" },
    }),
    db.connectedAsset.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const metaAuthUrl = `/api/meta/auth?workspaceId=${workspace.id}`;

  return (
    <ConnectedAssetsClient
      socialConnections={socialConnections.map(sc => ({
        ...sc,
        connectedAt: sc.connectedAt.toISOString(),
        lastSyncedAt: sc.lastSyncedAt?.toISOString() ?? null,
      }))}
      connectedAssets={connectedAssets.map(ca => ({
        ...ca,
        createdAt: ca.createdAt.toISOString(),
      }))}
      metaAuthUrl={metaAuthUrl}
      workspaceId={workspace.id}
    />
  );
}
