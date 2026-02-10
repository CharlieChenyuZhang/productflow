import Stripe from "stripe";
import { ENV } from "./_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-04-30.basil" as any });
  }
  return _stripe;
}

export async function createCheckoutSession(opts: {
  userId: number;
  userEmail: string | null;
  userName: string | null;
  priceId: string;
  origin: string;
  planId: string;
}) {
  const stripe = getStripe();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: `${opts.origin}/projects?upgraded=true`,
    cancel_url: `${opts.origin}/projects?cancelled=true`,
    allow_promotion_codes: true,
    client_reference_id: opts.userId.toString(),
    metadata: {
      user_id: opts.userId.toString(),
      plan_id: opts.planId,
      customer_email: opts.userEmail || "",
      customer_name: opts.userName || "",
    },
  };

  if (opts.userEmail) {
    sessionParams.customer_email = opts.userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

export async function createBillingPortalSession(opts: {
  stripeCustomerId: string;
  origin: string;
}) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: opts.stripeCustomerId,
    return_url: `${opts.origin}/projects`,
  });
  return session;
}

export async function getSubscription(subscriptionId: string) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function createStripeProducts() {
  const stripe = getStripe();

  // Check if products already exist
  const existingProducts = await stripe.products.list({ limit: 10 });
  const proProduct = existingProducts.data.find(p => p.metadata?.plan_id === "pro");
  const teamProduct = existingProducts.data.find(p => p.metadata?.plan_id === "team");

  const results: { proMonthly?: string; proYearly?: string; teamMonthly?: string; teamYearly?: string } = {};

  if (!proProduct) {
    const pro = await stripe.products.create({
      name: "ProductFlow Pro",
      description: "Full-power AI product discovery — unlimited projects, 50 analyses/mo, 20 live researches/mo",
      metadata: { plan_id: "pro" },
    });
    const proMonthly = await stripe.prices.create({
      product: pro.id,
      unit_amount: 4900,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan_id: "pro", interval: "monthly" },
    });
    const proYearly = await stripe.prices.create({
      product: pro.id,
      unit_amount: 46800, // $39/mo * 12
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan_id: "pro", interval: "yearly" },
    });
    results.proMonthly = proMonthly.id;
    results.proYearly = proYearly.id;
  } else {
    const prices = await stripe.prices.list({ product: proProduct.id, active: true });
    results.proMonthly = prices.data.find(p => p.recurring?.interval === "month")?.id;
    results.proYearly = prices.data.find(p => p.recurring?.interval === "year")?.id;
  }

  if (!teamProduct) {
    const team = await stripe.products.create({
      name: "ProductFlow Team",
      description: "Scale AI product discovery across your org — unlimited everything, team collaboration",
      metadata: { plan_id: "team" },
    });
    const teamMonthly = await stripe.prices.create({
      product: team.id,
      unit_amount: 12900,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan_id: "team", interval: "monthly" },
    });
    const teamYearly = await stripe.prices.create({
      product: team.id,
      unit_amount: 118800, // $99/mo * 12
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan_id: "team", interval: "yearly" },
    });
    results.teamMonthly = teamMonthly.id;
    results.teamYearly = teamYearly.id;
  } else {
    const prices = await stripe.prices.list({ product: teamProduct.id, active: true });
    results.teamMonthly = prices.data.find(p => p.recurring?.interval === "month")?.id;
    results.teamYearly = prices.data.find(p => p.recurring?.interval === "year")?.id;
  }

  return results;
}
