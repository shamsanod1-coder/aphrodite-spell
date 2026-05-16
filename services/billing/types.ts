export type SubscriptionTier = "free" | "premium";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"
  | "unpaid";

export interface Entitlements {
  tier: SubscriptionTier;
  maxDailyMessages: number;
  maxMemoriesPerPrompt: number;
  maxContextMessages: number;
  lateNightAccess: boolean;
  nsfwAccess: boolean;
  enhancedEmotionalDepth: boolean;
}

export interface UsageStatus {
  messageCount: number;
  limit: number;
  remaining: number;
  isLimited: boolean;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}
