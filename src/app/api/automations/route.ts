import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "BOTH"]),
  matchMode: z.enum(["CONTAINS", "EXACT", "STARTS_WITH"]),
  cooldownHours: z.number().int().min(0).max(168),
  connectedAssetId: z.string().nullable().optional(),
  keywords: z.array(z.string().min(1)).min(1),
  messageBody: z.string().min(1),
});

export async function GET() {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await db.automationRule.findMany({
    where: { workspaceId: ctx.workspace.id, deletedAt: null },
    include: { keywords: true, connectedAsset: true, messageTemplate: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.connectedAssetId) {
    const asset = await db.connectedAsset.findFirst({
      where: { id: data.connectedAssetId, workspaceId: ctx.workspace.id },
    });
    if (!asset) {
      return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
    }
  }

  const template = await db.messageTemplate.create({
    data: {
      workspaceId: ctx.workspace.id,
      name: `${data.name} Template`,
      body: data.messageBody,
    },
  });

  const rule = await db.automationRule.create({
    data: {
      workspaceId: ctx.workspace.id,
      connectedAssetId: data.connectedAssetId ?? null,
      name: data.name,
      description: data.description,
      platform: data.platform,
      matchMode: data.matchMode,
      cooldownHours: data.cooldownHours,
      messageTemplateId: template.id,
      keywords: {
        create: data.keywords.map((keyword) => ({ keyword })),
      },
    },
    include: { keywords: true, connectedAsset: true, messageTemplate: true },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
