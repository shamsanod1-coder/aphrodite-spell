import type {
  RitualTriggerInput,
  RitualTrigger,
  RitualType,
  RitualSubtype,
  RitualContext,
} from "./types";
import {
  STAGE_RITUAL_ELIGIBILITY,
  STAGE_MAX_RITUALS,
  DAILY_RITUAL_SUBTYPES,
  RELATIONSHIP_RITUAL_SUBTYPES,
  EMOTIONAL_RITUAL_SUBTYPES,
} from "./types";

const MIN_DAYS_FOR_RITUALS = 7;
const MIN_MESSAGES_FOR_RITUALS = 50;

function selectRitualType(input: RitualTriggerInput): RitualType {
  const { activityTiming, emotionalState } = input;
  const hour = activityTiming.currentHour;

  if (hour >= 6 && hour <= 10) return "daily";
  if (hour >= 21 || hour <= 2) return "emotional";

  const emotionalTypes: string[] = [
    "possessive",
    "slightly-distant",
    "mildly-disappointed",
  ];
  if (emotionalTypes.includes(emotionalState)) return "emotional";

  return "relationship";
}

function selectSubtype(
  ritualType: RitualType,
  input: RitualTriggerInput
): RitualSubtype {
  const { activityTiming, priorInteractionCadence, emotionalState } = input;
  const hour = activityTiming.currentHour;
  const seed =
    priorInteractionCadence.messageCount * 3 +
    priorInteractionCadence.daysActive * 7;

  if (ritualType === "daily") {
    if (hour >= 6 && hour <= 10) return "morning_checkin";
    if (hour >= 21 || hour <= 2) return "bedtime_message";
    if (
      activityTiming.hoursSinceLastMessage &&
      activityTiming.hoursSinceLastMessage > 4
    ) {
      return "disappearance_callback";
    }
    return DAILY_RITUAL_SUBTYPES[seed % DAILY_RITUAL_SUBTYPES.length];
  }

  if (ritualType === "relationship") {
    if (priorInteractionCadence.daysActive % 7 === 0) return "anniversary";
    if (priorInteractionCadence.messageCount % 50 === 0)
      return "callback_behavior";
    return RELATIONSHIP_RITUAL_SUBTYPES[
      seed % RELATIONSHIP_RITUAL_SUBTYPES.length
    ];
  }

  if (emotionalState === "possessive" || emotionalState === "slightly-distant")
    return "unresolved_tension";
  if (hour >= 22 || hour <= 2) return "late_night_conversation";
  return EMOTIONAL_RITUAL_SUBTYPES[seed % EMOTIONAL_RITUAL_SUBTYPES.length];
}

function buildRitualContext(
  ritualType: RitualType,
  subtype: RitualSubtype,
  input: RitualTriggerInput
): RitualContext {
  const descriptions: Record<RitualSubtype, string> = {
    morning_checkin: "a warm morning greeting to start their day",
    bedtime_message: "a soft goodnight that lingers",
    recurring_tease: "a familiar playful jab they expect from you",
    disappearance_callback: "noticing they slipped away earlier",
    recurring_joke: "referencing a shared joke between you two",
    anniversary: "marking a milestone in your connection",
    repeated_phrase: "using a phrase that has become yours",
    callback_behavior: "echoing something familiar between you",
    late_night_conversation: "the kind of talk that only happens late at night",
    affection_cadence: "a rhythm of warmth they've come to expect",
    unresolved_tension:
      "something left unsaid that still hangs in the air",
  };

  return {
    subtype,
    description: descriptions[subtype],
    preferredHour: input.activityTiming.currentHour,
    metadata: {
      relationshipStage: input.relationshipStage,
      emotionalState: input.emotionalState,
      daysActive: input.priorInteractionCadence.daysActive,
    },
  };
}

function computeUrgency(
  input: RitualTriggerInput
): "low" | "medium" | "high" {
  const { hoursSinceLastMessage } = input.activityTiming;
  const { averageSessionGapHours } = input.priorInteractionCadence;

  if (!hoursSinceLastMessage) return "low";
  if (hoursSinceLastMessage > averageSessionGapHours * 2) return "high";
  if (hoursSinceLastMessage > averageSessionGapHours * 1.5) return "medium";
  return "low";
}

function computeSuggestedDelay(
  ritualType: RitualType,
  urgency: "low" | "medium" | "high"
): number {
  const baseDelays: Record<RitualType, number> = {
    daily: 0,
    relationship: 300,
    emotional: 600,
  };

  const urgencyMultipliers: Record<string, number> = {
    high: 0.5,
    medium: 1,
    low: 1.5,
  };

  return Math.round(baseDelays[ritualType] * urgencyMultipliers[urgency]);
}

export function generateRitualTrigger(
  input: RitualTriggerInput
): RitualTrigger {
  const { relationshipStage, priorInteractionCadence } = input;

  if (!STAGE_RITUAL_ELIGIBILITY[relationshipStage]) {
    return {
      shouldTrigger: false,
      ritualType: "daily",
      subtype: "morning_checkin",
      context: {
        subtype: "morning_checkin",
        description: "not eligible for rituals at this stage",
      },
      urgency: "low",
      suggestedDelay: 0,
    };
  }

  if (
    priorInteractionCadence.daysActive < MIN_DAYS_FOR_RITUALS ||
    priorInteractionCadence.messageCount < MIN_MESSAGES_FOR_RITUALS
  ) {
    return {
      shouldTrigger: false,
      ritualType: "daily",
      subtype: "morning_checkin",
      context: {
        subtype: "morning_checkin",
        description: "insufficient interaction history for rituals",
      },
      urgency: "low",
      suggestedDelay: 0,
    };
  }

  const ritualType = selectRitualType(input);
  const subtype = selectSubtype(ritualType, input);
  const context = buildRitualContext(ritualType, subtype, input);
  const urgency = computeUrgency(input);
  const suggestedDelay = computeSuggestedDelay(ritualType, urgency);

  return {
    shouldTrigger: true,
    ritualType,
    subtype,
    context,
    urgency,
    suggestedDelay,
  };
}

export { STAGE_RITUAL_ELIGIBILITY, STAGE_MAX_RITUALS };
