import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AutomationForm } from "../automation-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Automation" };

export default async function EditAutomationPage({
  params,
}: {
  params: { id: string };
}) {
  const { workspace } = await requireWorkspace();

  const [rule, assets] = await Promise.all([
    db.automationRule.findFirst({
      where: { id: params.id, workspaceId: workspace.id, deletedAt: null },
      include: { keywords: true, messageTemplate: true },
    }),
    db.connectedAsset.findMany({
      where: { workspaceId: workspace.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!rule) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground">Rule not found</h2>
      </div>
    );
  }

  return (
    <AutomationForm
      initialRule={rule}
      assets={assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        assetType: asset.assetType,
      }))}
    />
  );
}
