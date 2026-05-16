import { db } from "@/db";
import { subscriptions, dailyUsage } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type Subscription = typeof subscriptions.$inferSelect;

export async function getSubscriptionForUser(
  userId: string
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return row ?? null;
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return row ?? null;
}

export async function upsertSubscription(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tier: "free" | "premium";
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid";
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<Subscription> {
  const [row] = await db
    .insert(subscriptions)
    .values({
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      tier: input.tier,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: input.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        tier: input.tier,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid",
  tier: "free" | "premium",
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      status,
      tier,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getDailyUsageRecord(
  userId: string,
  date: string
): Promise<typeof dailyUsage.$inferSelect | null> {
  const [row] = await db
    .select()
    .from(dailyUsage)
    .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)))
    .limit(1);
  return row ?? null;
}
