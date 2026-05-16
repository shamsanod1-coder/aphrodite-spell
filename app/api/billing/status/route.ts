import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSubscriptionForUser } from "@/db/queries/subscriptions";
import { getEntitlements, getUsageStatus } from "@/services/billing";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(session.user.id);
  const tier = subscription?.tier ?? "free";
  const entitlements = getEntitlements(tier);
  const usage = await getUsageStatus(
    session.user.id,
    entitlements.maxDailyMessages
  );

  return Response.json({
    tier,
    status: subscription?.status ?? "active",
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    usage: {
      messagesUsed: usage.messageCount,
      messagesLimit: usage.limit === Infinity ? null : usage.limit,
      messagesRemaining: usage.limit === Infinity ? null : usage.remaining,
    },
    entitlements: {
      lateNightAccess: entitlements.lateNightAccess,
      nsfwAccess: entitlements.nsfwAccess,
      enhancedEmotionalDepth: entitlements.enhancedEmotionalDepth,
    },
  });
}
