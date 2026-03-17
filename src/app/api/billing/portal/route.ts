import { NextResponse } from "next/server";
import { requireApiWorkspace } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST() {
  const ctx = await requireApiWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const subscription = await db.subscription.findFirst({
    where: { workspaceId: ctx.workspace.id },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
