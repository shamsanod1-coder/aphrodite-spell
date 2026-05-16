import { constructWebhookEvent } from "@/services/billing";
import {
  upsertSubscription,
  getSubscriptionByStripeSubscriptionId,
} from "@/db/queries/subscriptions";
import type Stripe from "stripe";

function mapStripeStatus(
  status: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" {
  const mapping: Record<string, "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid"> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    incomplete: "incomplete",
    trialing: "trialing",
    unpaid: "unpaid",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  return mapping[status] ?? "active";
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription || !session.customer) return;

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer.id;

  await upsertSubscription({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    tier: "premium",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const existing = await getSubscriptionByStripeSubscriptionId(subscription.id);
  if (!existing) return;

  const status = mapStripeStatus(subscription.status);
  const tier = status === "active" || status === "trialing" ? "premium" : "free";

  await upsertSubscription({
    userId: existing.userId,
    stripeCustomerId: existing.stripeCustomerId!,
    stripeSubscriptionId: subscription.id,
    tier,
    status,
    currentPeriodEnd: new Date(subscription.cancel_at_period_end
      ? (subscription.canceled_at ?? Date.now() / 1000) * 1000
      : subscription.items.data[0]?.current_period_end
        ? subscription.items.data[0].current_period_end * 1000
        : Date.now()),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const existing = await getSubscriptionByStripeSubscriptionId(subscription.id);
  if (!existing) return;

  await upsertSubscription({
    userId: existing.userId,
    stripeCustomerId: existing.stripeCustomerId!,
    stripeSubscriptionId: subscription.id,
    tier: "free",
    status: "canceled",
    currentPeriodEnd: existing.currentPeriodEnd,
    cancelAtPeriodEnd: true,
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        event.data.object as Stripe.Subscription
      );
      break;
  }

  return new Response("ok", { status: 200 });
}
