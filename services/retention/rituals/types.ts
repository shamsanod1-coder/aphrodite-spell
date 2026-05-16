import type { RelationshipStage } from "@/services/ai/personality";
import type { EmotionalState } from "@/services/ai/personality";

export const RITUAL_TYPES = ["daily", "relationship", "emotional"] as const;

export type RitualType = (typeof RITUAL_TYPES)[number];

export const DAILY_RITUAL_SUBTYPES = [
  "morning_checkin",
  "bedtime_message",
  "recurring_tease",
  "disappearance_callback",
] as const;

export type DailyRitualSubtype = (typeof DAILY_RITUAL_SUBTYPES)[number];

export const RELATIONSHIP_RITUAL_SUBTYPES = [
  "recurring_joke",
  "anniversary",
  "repeated_phrase",
  "callback_behavior",
] as const;

export type RelationshipRitualSubtype =
  (typeof RELATIONSHIP_RITUAL_SUBTYPES)[number];

export const EMOTIONAL_RITUAL_SUBTYPES = [
  "late_night_conversation",
  "affection_cadence",
  "unresolved_tension",
] as const;

export type EmotionalRitualSubtype =
  (typeof EMOTIONAL_RITUAL_SUBTYPES)[number];

export type RitualSubtype =
  | DailyRitualSubtype
  | RelationshipRitualSubtype
  | EmotionalRitualSubtype;

export interface RitualContext {
  subtype: RitualSubtype;
  description: string;
  preferredHour?: number;
  dayOfWeek?: number;
  metadata?: Record<string, unknown>;
}

export interface RitualTriggerInput {
  relationshipStage: RelationshipStage;
  activityTiming: ActivityTiming;
  priorInteractionCadence: InteractionCadence;
  emotionalState: EmotionalState;
  timezone?: string;
}

export interface ActivityTiming {
  lastMessageAt: Date | null;
  hoursSinceLastMessage: number | null;
  typicalActiveHours: number[];
  currentHour: number;
}

export interface InteractionCadence {
  messageCount: number;
  daysActive: number;
  averageMessagesPerDay: number;
  averageSessionGapHours: number;
}

export interface RitualTrigger {
  shouldTrigger: boolean;
  ritualType: RitualType;
  subtype: RitualSubtype;
  context: RitualContext;
  urgency: "low" | "medium" | "high";
  suggestedDelay: number;
}

export const STAGE_RITUAL_ELIGIBILITY: Record<RelationshipStage, boolean> = {
  curiosity: false,
  recognition: false,
  ritualization: true,
  exclusivity: true,
  "dependency-lite": true,
};

export const STAGE_MAX_RITUALS: Record<RelationshipStage, number> = {
  curiosity: 0,
  recognition: 0,
  ritualization: 2,
  exclusivity: 4,
  "dependency-lite": 6,
};
