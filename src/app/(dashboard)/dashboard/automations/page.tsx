import { requireWorkspace } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { AutomationsClient } from "./automations-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Automations" };

export default async function AutomationsPage() {
  const { workspace } = await requireWorkspace();

  const rules = await db.automationRule.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    include: {
      keywords: true,
      connectedAsset: true,
      messageTemplate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AutomationsClient 
      initialRules={rules.map(rule => ({
        ...rule,
        createdAt: rule.createdAt.toISOString() // Keep as Date if AutomationsClient can handle it, or stringify if needed.
        // Prisma returns Date objects in Server Components. 
        // We'll update the interface to Date.
      }))} 
    />
  );
}
