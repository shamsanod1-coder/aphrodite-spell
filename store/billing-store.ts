import { create } from "zustand";
import type { SubscriptionTier } from "@/services/billing/types";

interface BillingState {
  tier: SubscriptionTier;
  status: string;
  messagesUsed: number;
  messagesLimit: number | null;
  messagesRemaining: number | null;
  lateNightAccess: boolean;
  nsfwAccess: boolean;
  enhancedEmotionalDepth: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  setBillingData: (data: Partial<BillingState>) => void;
  reset: () => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  tier: "free",
  status: "active",
  messagesUsed: 0,
  messagesLimit: 25,
  messagesRemaining: 25,
  lateNightAccess: false,
  nsfwAccess: false,
  enhancedEmotionalDepth: false,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
  setBillingData: (data) => set(data),
  reset: () =>
    set({
      tier: "free",
      status: "active",
      messagesUsed: 0,
      messagesLimit: 25,
      messagesRemaining: 25,
      lateNightAccess: false,
      nsfwAccess: false,
      enhancedEmotionalDepth: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      isLoading: false,
    }),
}));
