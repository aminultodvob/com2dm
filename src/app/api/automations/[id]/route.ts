import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";

const updateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "BOTH"]),
  matchMode: z.enum(["CONTAINS", "EXACT", "STARTS_WITH"]),
  cooldownHours: z.number().int().min(0).max(168),
  connectedAssetId: z.string().nullable().optional(),
  keywords: z.array(z.string().min(1)).min(1),
  messageBody: z.string().min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await db.automationRule.findFirst({
    where: { id, workspaceId: ctx.workspace.id, deletedAt: null },
    include: { keywords: true, connectedAsset: true, messageTemplate: true },
  });

  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ rule });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.connectedAssetId) {
    const asset = await db.connectedAsset.findFirst({
      where: { id: parsed.data.connectedAssetId, workspaceId: ctx.workspace.id },
    });
    if (!asset) {
      return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
    }
  }

  const existing = await db.automationRule.findFirst({
    where: { id, workspaceId: ctx.workspace.id, deletedAt: null },
    include: { keywords: true, messageTemplate: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.ruleKeyword.deleteMany({ where: { ruleId: existing.id } });

  const template = existing.messageTemplateId
    ? await db.messageTemplate.update({
        where: { id: existing.messageTemplateId },
        data: { body: parsed.data.messageBody },
      })
    : await db.messageTemplate.create({
        data: {
          workspaceId: ctx.workspace.id,
          name: `${parsed.data.name} Template`,
          body: parsed.data.messageBody,
        },
      });

  const rule = await db.automationRule.update({
    where: { id: existing.id },
    data: {
      connectedAssetId: parsed.data.connectedAssetId ?? null,
      name: parsed.data.name,
      description: parsed.data.description,
      platform: parsed.data.platform,
      matchMode: parsed.data.matchMode,
      cooldownHours: parsed.data.cooldownHours,
      messageTemplateId: template.id,
      keywords: {
        create: parsed.data.keywords.map((keyword) => ({ keyword })),
      },
    },
    include: { keywords: true, connectedAsset: true, messageTemplate: true },
  });

  return NextResponse.json({ rule });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rule = await db.automationRule.findFirst({
    where: { id, workspaceId: ctx.workspace.id, deletedAt: null },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.automationRule.update({
    where: { id: rule.id },
    data: { deletedAt: new Date(), status: "PAUSED" },
  });

  return NextResponse.json({ ok: true });
}
