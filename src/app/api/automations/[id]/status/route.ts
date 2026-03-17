import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiWorkspace } from "@/lib/auth-helpers";

const schema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const rule = await db.automationRule.findFirst({
    where: { id: params.id, workspaceId: ctx.workspace.id, deletedAt: null },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.automationRule.update({
    where: { id: rule.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ rule: updated });
}
