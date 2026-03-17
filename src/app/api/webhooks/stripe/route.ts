import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const normalizeStatus = (status: Stripe.Subscription.Status) => {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "canceled":
        return "CANCELED";
      case "past_due":
        return "PAST_DUE";
      case "trialing":
        return "TRIALING";
      default:
        return "INCOMPLETE";
    }
  };

  type SubscriptionWithPeriod = Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  const handleSubscription = async (subscription: Stripe.Subscription) => {
    const workspaceId = subscription.metadata.workspaceId;
    if (!workspaceId) return;

    const priceId = subscription.items.data[0]?.price?.id ?? null;
    const tier =
      priceId === env.STRIPE_STARTER_PRICE_ID
        ? "STARTER"
        : priceId === env.STRIPE_PRO_PRICE_ID
          ? "PRO"
          : "FREE";

    const periodStart = (subscription as SubscriptionWithPeriod).current_period_start;
    const periodEnd = (subscription as SubscriptionWithPeriod).current_period_end;

    await db.subscription.upsert({
      where: { workspaceId },
      update: {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: normalizeStatus(subscription.status),
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      create: {
        workspaceId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: normalizeStatus(subscription.status),
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await handleSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscription(subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
