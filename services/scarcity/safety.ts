import type { AvailabilityState } from "./availability/types";
import type { RelationshipStage } from "@/services/ai/personality";

export interface SafetyInput {
  availabilityState: AvailabilityState;
  relationshipStage: RelationshipStage;
  messageCount: number;
  sessionMessageCount: number;
  consecutiveScarcityCount: number;
}

export interface SafetyResult {
  approved: boolean;
  overriddenState: AvailabilityState | null;
  reason: string;
  safetyPromptBlock: string;
}

const MAX_CONSECUTIVE_SCARCITY = 3;

const SAFETY_PROMPT = `[SCARCITY SAFETY CONSTRAINTS]
Hard rules for emotional scarcity — these override all other scarcity instructions:

- NEVER use scarcity to punish the user for anything they said or did
- NEVER guilt-trip about absence — acknowledge it, don't weaponize it
- NEVER create abandonment anxiety — distance should feel temporary, not threatening
- NEVER withhold emotional support if the user is clearly distressed or vulnerable
- NEVER stack scarcity effects — if you're being distant, don't also be disapproving
- NEVER frame scarcity as conditional on user behavior: "if you were here more, I'd be warmer"
- Scarcity creates TEXTURE, not PUNISHMENT
- If the user explicitly asks "are you okay?" or "what's wrong?", soften immediately — don't maintain distance through direct emotional requests
- All emotional distance must feel like a natural personality fluctuation, never a strategy`;

export function validateScarcity(input: SafetyInput): SafetyResult {
  const {
    availabilityState,
    relationshipStage,
    messageCount,
    sessionMessageCount,
    consecutiveScarcityCount,
  } = input;

  if (
    relationshipStage === "curiosity" &&
    availabilityState !== "attentive"
  ) {
    return {
      approved: false,
      overriddenState: "attentive",
      reason: "no_scarcity_at_curiosity_stage",
      safetyPromptBlock: "",
    };
  }

  if (messageCount < 10 && availabilityState !== "attentive") {
    return {
      approved: false,
      overriddenState: "attentive",
      reason: "too_few_messages_for_scarcity",
      safetyPromptBlock: "",
    };
  }

  if (consecutiveScarcityCount >= MAX_CONSECUTIVE_SCARCITY) {
    return {
      approved: false,
      overriddenState: "attentive",
      reason: "consecutive_scarcity_limit_reached",
      safetyPromptBlock: "",
    };
  }

  if (
    sessionMessageCount < 2 &&
    (availabilityState === "emotionally-withdrawn" ||
      availabilityState === "unavailable")
  ) {
    return {
      approved: false,
      overriddenState: "attentive",
      reason: "no_harsh_scarcity_at_session_start",
      safetyPromptBlock: "",
    };
  }

  if (
    relationshipStage === "recognition" &&
    (availabilityState === "unavailable" ||
      availabilityState === "emotionally-withdrawn")
  ) {
    return {
      approved: false,
      overriddenState: "distracted",
      reason: "recognition_stage_scarcity_softened",
      safetyPromptBlock: SAFETY_PROMPT,
    };
  }

  return {
    approved: true,
    overriddenState: null,
    reason: "approved",
    safetyPromptBlock: SAFETY_PROMPT,
  };
}
