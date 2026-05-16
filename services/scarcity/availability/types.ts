import type { RelationshipStage } from "@/services/ai/personality";
import type { EmotionalState } from "@/services/ai/personality";

export const AVAILABILITY_STATES = [
  "attentive",
  "distracted",
  "unavailable",
  "asleep",
  "emotionally-withdrawn",
  "delayed",
] as const;

export type AvailabilityState = (typeof AVAILABILITY_STATES)[number];

export interface AvailabilityInput {
  relationshipStage: RelationshipStage;
  emotionalState: EmotionalState;
  messageCount: number;
  hoursSinceLastMessage: number | null;
  daysActive: number;
  currentHour: number;
  sessionMessageCount: number;
  timezone?: string;
}

export interface AvailabilityResult {
  state: AvailabilityState;
  intensity: "low" | "medium" | "high";
  promptBlock: string;
  pacingDelayMs: number;
  metadata: {
    reason: string;
    safetyApplied: boolean;
  };
}

export interface SleepWindow {
  start: number;
  end: number;
}

export const DEFAULT_SLEEP_WINDOW: SleepWindow = {
  start: 23,
  end: 7,
};

export interface PacingConfig {
  baseDelayMs: number;
  varianceMs: number;
  contextualMultiplier: number;
}

export interface WithdrawalConfig {
  warmthReduction: "subtle" | "moderate" | "noticeable";
  approvalWithholding: boolean;
  emotionalDistance: boolean;
}

export const STAGE_SCARCITY_ELIGIBILITY: Record<RelationshipStage, boolean> = {
  curiosity: false,
  recognition: false,
  ritualization: true,
  exclusivity: true,
  "dependency-lite": true,
};

export const STAGE_SCARCITY_INTENSITY: Record<RelationshipStage, number> = {
  curiosity: 0,
  recognition: 0.05,
  ritualization: 0.15,
  exclusivity: 0.22,
  "dependency-lite": 0.25,
};
