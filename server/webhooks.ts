import type { Request, Response } from "express";
import Stripe from "stripe";
import { getStripe } from "./stripe";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("[Webhook] Missing signature or webhook secret");
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle test events for webhook verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && planId) {
          const db = await getDb();
          if (db) {
            await db.update(users).set({
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              planId: planId,
            }).where(eq(users.id, parseInt(userId)));
            console.log(`[Webhook] User ${userId} upgraded to ${planId}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const periodEnd = new Date((subscription as any).current_period_end * 1000);

        const db = await getDb();
        if (db) {
          // Determine plan from price metadata
          const priceId = subscription.items.data[0]?.price?.id;
          let planId = "free";
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId);
            planId = price.metadata?.plan_id || "free";
          }

          const updateData: Record<string, any> = {
            planPeriodEnd: periodEnd,
          };

          if (status === "active" || status === "trialing") {
            updateData.planId = planId;
            updateData.stripeSubscriptionId = subscription.id;
          } else if (status === "canceled" || status === "unpaid" || status === "past_due") {
            updateData.planId = "free";
            updateData.stripeSubscriptionId = null;
          }

          await db.update(users).set(updateData).where(eq(users.stripeCustomerId, customerId));
          console.log(`[Webhook] Subscription updated for customer ${customerId}: ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const db = await getDb();
        if (db) {
          await db.update(users).set({
            planId: "free",
            stripeSubscriptionId: null,
            planPeriodEnd: null,
          }).where(eq(users.stripeCustomerId, customerId));
          console.log(`[Webhook] Subscription cancelled for customer ${customerId}`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
