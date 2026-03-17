import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AutomationForm } from "../automation-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Automation" };

export default async function NewAutomationPage() {
  const { workspace } = await requireWorkspace();

  const assets = await db.connectedAsset.findMany({
    where: { workspaceId: workspace.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AutomationForm
      assets={assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType,
      }))}
    />
  );
}
