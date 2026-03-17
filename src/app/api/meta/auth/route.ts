import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-helpers";
import { env } from "@/lib/env";
import { signPayload } from "@/lib/crypto";
import { buildMetaAuthUrl } from "@/lib/meta";

export async function GET(req: Request) {
  const user = await requireApiAuth();
  if (!user?.id) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  if (!env.META_APP_ID || !env.META_APP_SECRET || !env.META_REDIRECT_URI) {
    return NextResponse.json({ error: "Meta credentials not configured" }, { status: 500 });
  }

  const state = signPayload(
    { workspaceId, userId: user.id, nonce: Date.now().toString() },
    env.AUTH_SECRET
  );
  const url = buildMetaAuthUrl(state);
  return NextResponse.redirect(url);
}
