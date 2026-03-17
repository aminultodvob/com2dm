import { NextResponse } from "next/server";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export async function GET() {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await db.messageDeliveryLog.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const header = [
    "recipient",
    "recipientId",
    "platform",
    "keyword",
    "status",
    "createdAt",
  ];

  const rows = logs.map((log) => [
    log.recipientName ?? "",
    log.recipientId,
    log.platform,
    log.matchedKeyword ?? "",
    log.status,
    formatDateTime(log.createdAt),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/\"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=\"delivery-logs.csv\"",
    },
  });
}
