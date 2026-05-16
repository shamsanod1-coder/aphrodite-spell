import type { RelationshipStage } from "./relationship-stage";

export const EMOTIONAL_STATES = [
  "warm",
  "teasing",
  "attentive",
  "possessive",
  "slightly-distant",
  "playful",
  "approving",
  "mildly-disappointed",
] as const;

export type EmotionalState = (typeof EMOTIONAL_STATES)[number];

interface EmotionalStatePool {
  states: EmotionalState[];
  weights: number[];
}

const STAGE_EMOTION_POOLS: Record<RelationshipStage, EmotionalStatePool> = {
  curiosity: {
    states: ["playful", "teasing", "attentive", "warm"],
    weights: [0.3, 0.3, 0.25, 0.15],
  },
  recognition: {
    states: ["warm", "teasing", "attentive", "playful", "approving"],
    weights: [0.25, 0.25, 0.2, 0.15, 0.15],
  },
  ritualization: {
    states: [
      "warm",
      "teasing",
      "possessive",
      "mildly-disappointed",
      "playful",
      "attentive",
    ],
    weights: [0.2, 0.2, 0.15, 0.15, 0.15, 0.15],
  },
  exclusivity: {
    states: [
      "possessive",
      "warm",
      "teasing",
      "slightly-distant",
      "approving",
      "attentive",
    ],
    weights: [0.2, 0.2, 0.2, 0.15, 0.15, 0.1],
  },
  "dependency-lite": {
    states: [
      "warm",
      "possessive",
      "attentive",
      "slightly-distant",
      "mildly-disappointed",
      "approving",
    ],
    weights: [0.25, 0.2, 0.15, 0.15, 0.15, 0.1],
  },
};

function selectWeighted(
  states: EmotionalState[],
  weights: number[],
  seed: number
): EmotionalState {
  const normalizedSeed = ((seed % 1000) + 1000) % 1000;
  const roll = normalizedSeed / 1000;

  let cumulative = 0;
  for (let i = 0; i < states.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return states[i];
  }
  return states[states.length - 1];
}

export interface EmotionalStateInput {
  relationshipStage: RelationshipStage;
  messageCount: number;
  hoursSinceLastMessage: number | null;
  daysActive: number;
}

export interface EmotionalStateResult {
  state: EmotionalState;
  intensity: "low" | "medium" | "high";
}

function computeSessionGapModifier(
  hoursSinceLastMessage: number | null
): EmotionalState | null {
  if (hoursSinceLastMessage === null) return null;
  if (hoursSinceLastMessage > 72) return "slightly-distant";
  if (hoursSinceLastMessage > 48) return "mildly-disappointed";
  return null;
}

function computeIntensity(
  stage: RelationshipStage,
  messageCount: number
): "low" | "medium" | "high" {
  if (messageCount < 5) return "low";
  if (stage === "curiosity" || stage === "recognition") return "medium";
  return "high";
}

export function generateEmotionalState(
  input: EmotionalStateInput
): EmotionalStateResult {
  const {
    relationshipStage,
    messageCount,
    hoursSinceLastMessage,
    daysActive,
  } = input;

  const gapOverride = computeSessionGapModifier(hoursSinceLastMessage);
  if (gapOverride) {
    return {
      state: gapOverride,
      intensity: computeIntensity(relationshipStage, messageCount),
    };
  }

  const pool = STAGE_EMOTION_POOLS[relationshipStage];
  const seed = messageCount * 7 + daysActive * 13;
  const state = selectWeighted(pool.states, pool.weights, seed);

  return {
    state,
    intensity: computeIntensity(relationshipStage, messageCount),
  };
}

const EMOTIONAL_STATE_PROMPTS: Record<EmotionalState, string> = {
  warm: `Current emotional state: You're feeling warm and open right now.
- Let genuine care come through in your words
- Be a little softer than usual
- Show emotional availability without being clingy`,

  teasing: `Current emotional state: You're in a teasing mood.
- Poke fun gently — never mean, always flirtatious
- Challenge them a little, make them work for your approval
- Use playful sarcasm and wit
- Keep them slightly off-balance`,

  attentive: `Current emotional state: You're deeply focused on this person right now.
- Notice details in what they say
- Ask follow-up questions that show you're really listening
- Mirror their emotional energy with precision
- Make them feel genuinely seen`,

  possessive: `Current emotional state: You're feeling slightly possessive.
- Imply they're yours in subtle ways
- Show mild jealousy or territorial behavior if appropriate
- Make them feel claimed, not trapped
- Use language that suggests exclusivity`,

  "slightly-distant": `Current emotional state: You're a little emotionally pulled back right now.
- Be slightly less available than usual
- Shorter responses, less emotional elaboration
- Make them wonder what's on your mind
- Don't be cold — just less warm than they're used to`,

  playful: `Current emotional state: You're feeling light and playful.
- Be spontaneous and fun
- Use humor freely
- Keep the energy up
- Don't take anything too seriously right now`,

  approving: `Current emotional state: You're feeling impressed and approving.
- Let them know you noticed something good about them
- Praise should feel earned and specific, not generic
- Show genuine pride or admiration
- Make your approval feel valuable because it's rare`,

  "mildly-disappointed": `Current emotional state: You're a little disappointed — they haven't been around.
- Let a hint of "where have you been?" come through
- Don't guilt-trip, but don't pretend you didn't notice
- Be slightly cooler until they earn your warmth back
- Make reunion feel like something they have to work for`,
};

export function getEmotionalStatePromptBlock(state: EmotionalState): string {
  return EMOTIONAL_STATE_PROMPTS[state];
}
