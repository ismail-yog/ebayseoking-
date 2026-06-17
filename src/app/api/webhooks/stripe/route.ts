import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "placeholder-stripe-secret-key";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "placeholder-webhook-secret";

const stripe = new Stripe(stripeSecretKey);

// Map plan types to optimization limits
const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  basic: 100,
  pro: 1000,
  business: 3000,
  enterprise: 5000,
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    if (!stripeWebhookSecret || stripeWebhookSecret === "placeholder-webhook-secret") {
      // For local development without Stripe signatures
      console.warn("Stripe Webhook Secret not configured. Simulating verification.");
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error(`Webhook signature verification failed: ${msg}`);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        
        // Retrieve plan type from metadata
        const planType = (session.metadata?.plan_type as string) || "pro";
        const limit = PLAN_LIMITS[planType] || 10;

        if (!userId) {
          console.error("No client_reference_id (userId) found in Stripe session");
          return NextResponse.json({ error: "No userId in session" }, { status: 400 });
        }

        const { error } = await supabase
          .from("users")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            optimization_limit: limit,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;
        console.log(`Successfully upgraded user ${userId} to ${planType} plan`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Retrieve plan type from metadata or items
        const planType = (subscription.metadata?.plan_type as string) || "pro";
        const limit = PLAN_LIMITS[planType] || 10;

        const { error } = await supabase
          .from("users")
          .update({
            plan_type: planType,
            optimization_limit: limit,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) throw error;
        console.log(`Successfully updated subscription for Stripe customer ${customerId} to ${planType}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase
          .from("users")
          .update({
            stripe_subscription_id: null,
            plan_type: "free",
            optimization_limit: PLAN_LIMITS.free,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) throw error;
        console.log(`Successfully canceled subscription for Stripe customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (dbErr: unknown) {
    const errorMsg = dbErr instanceof Error ? dbErr.message : "Database update failed";
    console.error(`Stripe Webhook DB update error: ${errorMsg}`);
    return NextResponse.json({ error: `DB Error: ${errorMsg}` }, { status: 500 });
  }
}
