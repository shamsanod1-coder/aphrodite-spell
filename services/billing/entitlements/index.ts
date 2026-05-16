import type { SubscriptionTier, Entitlements } from "../types";

const FREE_ENTITLEMENTS: Entitlements = {
  tier: "free",
  maxDailyMessages: 25,
  maxMemoriesPerPrompt: 2,
  maxContextMessages: 20,
  lateNightAccess: false,
  nsfwAccess: false,
  enhancedEmotionalDepth: false,
};

const PREMIUM_ENTITLEMENTS: Entitlements = {
  tier: "premium",
  maxDailyMessages: Infinity,
  maxMemoriesPerPrompt: 5,
  maxContextMessages: 50,
  lateNightAccess: true,
  nsfwAccess: true,
  enhancedEmotionalDepth: true,
};

export function getEntitlements(tier: SubscriptionTier): Entitlements {
  return tier === "premium" ? PREMIUM_ENTITLEMENTS : FREE_ENTITLEMENTS;
}
