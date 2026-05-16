import { getSubscriptionForUser } from "@/db/queries/subscriptions";
import { getEntitlements } from "../entitlements";
import { getUsageStatus } from "../usage";
import type { Entitlements, UsageStatus, SubscriptionTier } from "../types";

export interface GatingResult {
  allowed: boolean;
  tier: SubscriptionTier;
  entitlements: Entitlements;
  usage: UsageStatus;
  reason?: string;
}

export async function checkMessageGating(
  userId: string
): Promise<GatingResult> {
  const subscription = await getSubscriptionForUser(userId);
  const tier = subscription?.tier ?? "free";
  const entitlements = getEntitlements(tier);
  const usage = await getUsageStatus(userId, entitlements.maxDailyMessages);

  if (usage.isLimited) {
    return {
      allowed: false,
      tier,
      entitlements,
      usage,
      reason: "daily_limit_reached",
    };
  }

  return {
    allowed: true,
    tier,
    entitlements,
    usage,
  };
}

export function shouldShowPaywall(
  usage: UsageStatus,
  tier: SubscriptionTier
): boolean {
  if (tier === "premium") return false;
  if (usage.isLimited) return true;
  if (usage.limit !== Infinity && usage.remaining <= 5) return true;
  return false;
}
