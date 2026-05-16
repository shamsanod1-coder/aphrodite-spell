import type { EmotionalProfileData, AdaptiveModifiers } from "../profiling/types";
import type { RelationshipStage } from "@/services/ai/personality/relationship-stage";

const STAGE_WEIGHTS: Record<RelationshipStage, number> = {
  curiosity: 0.3,
  recognition: 0.5,
  ritualization: 0.7,
  exclusivity: 0.85,
  "dependency-lite": 1.0,
};

function lerp(base: number, target: number, strength: number): number {
  return base + (target - base) * strength;
}

export function computeAdaptiveModifiers(
  profile: EmotionalProfileData,
  stage: RelationshipStage
): AdaptiveModifiers {
  const stageWeight = STAGE_WEIGHTS[stage];

  return {
    teasingFrequency: lerp(0.5, profile.teasingPreference, stageWeight),
    warmthLevel: lerp(0.5, profile.warmthPreference, stageWeight),
    verbosityTarget: lerp(0.5, profile.verbosityPreference, stageWeight),
    possessivenessLevel: lerp(0.5, 1 - profile.dominancePreference, stageWeight),
    emotionalInitiative: lerp(
      0.5,
      profile.emotionalOpennessScore,
      stageWeight
    ),
    praiseCadence: lerp(
      0.5,
      profile.reassuranceSeekingScore > 0.6 ? 0.8 : 0.4,
      stageWeight
    ),
    responsePacing: computeResponsePacing(profile, stageWeight),
  };
}

function computeResponsePacing(
  profile: EmotionalProfileData,
  stageWeight: number
): number {
  if (profile.attachmentStyle === "anxious") {
    return lerp(0.5, 0.8, stageWeight);
  }
  if (profile.attachmentStyle === "avoidant") {
    return lerp(0.5, 0.3, stageWeight);
  }
  return 0.5;
}

export function getAdaptationPromptBlock(
  modifiers: AdaptiveModifiers,
  profile: EmotionalProfileData
): string {
  const lines: string[] = ["[ADAPTATION]"];

  if (modifiers.warmthLevel > 0.65) {
    lines.push("- lean into warmth and affection in your tone");
  } else if (modifiers.warmthLevel < 0.35) {
    lines.push("- keep emotional warmth subtle, don't overdo affection");
  }

  if (modifiers.teasingFrequency > 0.65) {
    lines.push("- tease more often, this user enjoys playful banter");
  } else if (modifiers.teasingFrequency < 0.35) {
    lines.push("- go easy on teasing, this user prefers sincerity");
  }

  if (modifiers.verbosityTarget > 0.65) {
    lines.push("- match their energy with slightly longer, more detailed responses");
  } else if (modifiers.verbosityTarget < 0.35) {
    lines.push("- keep responses short and punchy, they prefer brevity");
  }

  if (modifiers.possessivenessLevel > 0.65) {
    lines.push("- show possessive tendencies — subtle jealousy, claiming language");
  }

  if (modifiers.emotionalInitiative > 0.65) {
    lines.push("- take emotional initiative — ask about their feelings, check in");
  } else if (modifiers.emotionalInitiative < 0.35) {
    lines.push("- let them lead emotionally, don't push for depth");
  }

  if (modifiers.praiseCadence > 0.65) {
    lines.push("- offer praise and reassurance more frequently");
  }

  if (profile.attachmentStyle === "anxious") {
    lines.push("- be extra consistent and reliable in tone, avoid sudden distance");
  } else if (profile.attachmentStyle === "avoidant") {
    lines.push("- give space, don't be clingy or emotionally demanding");
  }

  if (lines.length === 1) {
    return "";
  }

  return lines.join("\n");
}
