import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiAuth } from "@/lib/auth-helpers";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2),
});

export async function POST(req: Request) {
  const user = await requireApiAuth();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const workspace = await db.workspace.create({
    data: {
      name: parsed.data.name,
      slug: generateSlug(parsed.data.name),
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
      subscription: {
        create: {
          tier: "FREE",
          status: "ACTIVE",
        },
      },
    },
  });

  return NextResponse.json({ workspace }, { status: 201 });
}
