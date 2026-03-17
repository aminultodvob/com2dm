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
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const metaAuthUrl = `/api/meta/auth?workspaceId=${workspace.id}`;

  return (
    <ConnectedAssetsClient
      socialConnections={socialConnections}
      connectedAssets={connectedAssets}
      metaAuthUrl={metaAuthUrl}
      workspaceId={workspace.id}
    />
  );
}
