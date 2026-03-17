import { NextResponse } from "next/server";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
import { env } from "@/lib/env";
import { getStripe, getPriceIdForTier } from "@/lib/stripe";

export async function POST(req: Request) {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const tier = (form.get("tier") as string | null)?.toUpperCase() ?? "STARTER";
  const priceId = getPriceIdForTier(tier);
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: ctx.user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`,
    metadata: {
      workspaceId: ctx.workspace.id,
      tier,
    },
  });

  return NextResponse.redirect(session.url ?? `${appUrl}/dashboard/billing`, {
    status: 303,
  });
}
