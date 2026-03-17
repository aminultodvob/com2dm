import Stripe from "stripe";
import { env } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
  }
  return stripe;
}

export function getPriceIdForTier(tier: string) {
  if (tier === "STARTER") return env.STRIPE_STARTER_PRICE_ID;
  if (tier === "PRO") return env.STRIPE_PRO_PRICE_ID;
  return undefined;
}
