import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateSlug } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + workspace in a transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const workspaceName = `${name}'s Workspace`;
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: generateSlug(name),
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      // Create free subscription
      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          tier: "FREE",
          status: "ACTIVE",
        },
      });

      return { user, workspace };
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        userId: result.user.id,
        workspaceId: result.workspace.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
