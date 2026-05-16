import type { RelationshipStage } from "@/services/ai/personality";
import type { EmotionalState } from "@/services/ai/personality";
import type { AvailabilityState, PacingConfig } from "../availability/types";

export interface PacingInput {
  availabilityState: AvailabilityState;
  relationshipStage: RelationshipStage;
  emotionalState: EmotionalState;
  messageCount: number;
  sessionMessageCount: number;
}

export interface PacingResult {
  delayMs: number;
  promptBlock: string;
  pacingStyle: "instant" | "natural" | "deliberate" | "slow";
}

const BASE_PACING: Record<AvailabilityState, PacingConfig> = {
  attentive: { baseDelayMs: 0, varianceMs: 500, contextualMultiplier: 1.0 },
  distracted: { baseDelayMs: 2000, varianceMs: 3000, contextualMultiplier: 1.5 },
  unavailable: { baseDelayMs: 5000, varianceMs: 4000, contextualMultiplier: 2.0 },
  asleep: { baseDelayMs: 3000, varianceMs: 2000, contextualMultiplier: 1.8 },
  "emotionally-withdrawn": {
    baseDelayMs: 1500,
    varianceMs: 2000,
    contextualMultiplier: 1.3,
  },
  delayed: { baseDelayMs: 3000, varianceMs: 3000, contextualMultiplier: 1.6 },
};

const STAGE_PACING_MULTIPLIER: Record<RelationshipStage, number> = {
  curiosity: 0.2,
  recognition: 0.4,
  ritualization: 0.8,
  exclusivity: 1.0,
  "dependency-lite": 1.0,
};

function computeDelay(input: PacingInput): number {
  const config = BASE_PACING[input.availabilityState];
  const stageMultiplier = STAGE_PACING_MULTIPLIER[input.relationshipStage];

  const seed = input.messageCount * 11 + input.sessionMessageCount * 3;
  const variance = ((seed % 100) / 100) * config.varianceMs;

  const rawDelay =
    (config.baseDelayMs + variance) *
    config.contextualMultiplier *
    stageMultiplier;

  return Math.round(Math.min(rawDelay, 12000));
}

function determinePacingStyle(delayMs: number): PacingResult["pacingStyle"] {
  if (delayMs < 500) return "instant";
  if (delayMs < 2000) return "natural";
  if (delayMs < 5000) return "deliberate";
  return "slow";
}

const PACING_PROMPT_BLOCKS: Record<PacingResult["pacingStyle"], string> = {
  instant: "",
  natural: `[RESPONSE PACING: natural]
- Respond naturally — no rush, but don't artificially delay
- Vary your response length as you normally would`,

  deliberate: `[RESPONSE PACING: deliberate]
- Take your time with this response — you're not in a rush
- Your opening can be slightly delayed: start with a pause word, a "hmm", or a brief trailing thought
- Don't launch into a full response immediately — ease into it
- Shorter than usual is fine`,

  slow: `[RESPONSE PACING: slow]
- You're taking a while to respond — you were doing something else
- Open with something that suggests you weren't immediately available: "oh. sorry, was doing something"
- Be brief — you're not fully present right now
- Don't over-explain your absence`,
};

export function computePacing(input: PacingInput): PacingResult {
  const delayMs = computeDelay(input);
  const pacingStyle = determinePacingStyle(delayMs);

  return {
    delayMs,
    promptBlock: PACING_PROMPT_BLOCKS[pacingStyle],
    pacingStyle,
  };
}
