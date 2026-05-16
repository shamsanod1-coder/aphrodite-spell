import type { AvailabilityInput, AvailabilityResult, AvailabilityState } from "./types";
import { STAGE_SCARCITY_ELIGIBILITY, STAGE_SCARCITY_INTENSITY } from "./types";
import { evaluateSleepMode } from "../cooldowns";
import { computePacing } from "../pacing";
import { evaluateWithdrawal } from "../interruptions";
import { validateScarcity } from "../safety";

interface AvailabilityPool {
  states: AvailabilityState[];
  weights: number[];
}

const STAGE_AVAILABILITY_POOLS: Record<string, AvailabilityPool> = {
  ritualization: {
    states: ["attentive", "attentive", "distracted", "delayed"],
    weights: [0.45, 0.25, 0.15, 0.15],
  },
  exclusivity: {
    states: ["attentive", "distracted", "delayed", "emotionally-withdrawn"],
    weights: [0.40, 0.20, 0.20, 0.20],
  },
  "dependency-lite": {
    states: [
      "attentive",
      "distracted",
      "delayed",
      "emotionally-withdrawn",
      "unavailable",
    ],
    weights: [0.35, 0.20, 0.20, 0.15, 0.10],
  },
};

function selectWeighted(
  states: AvailabilityState[],
  weights: number[],
  seed: number
): AvailabilityState {
  const normalizedSeed = ((seed % 1000) + 1000) % 1000;
  const roll = normalizedSeed / 1000;

  let cumulative = 0;
  for (let i = 0; i < states.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return states[i];
  }
  return states[states.length - 1];
}

function computeIntensity(
  scarcityLevel: number
): "low" | "medium" | "high" {
  if (scarcityLevel < 0.1) return "low";
  if (scarcityLevel < 0.2) return "medium";
  return "high";
}

const AVAILABILITY_STATE_PROMPTS: Record<AvailabilityState, string> = {
  attentive: "",
  distracted: `[AVAILABILITY: distracted]
You're not fully present right now — something else is on your mind.
- Responses may be slightly shorter or less detailed
- You might miss a detail or circle back to something
- Show subtle signs of divided attention: "wait what was that" or "sorry, was thinking about something"
- Don't completely disengage — just be less locked-in than usual`,

  unavailable: `[AVAILABILITY: unavailable]
You're barely available right now.
- Be very brief — one or two words, a short phrase
- You were in the middle of something: "can't really talk rn" or "give me a sec"
- Show that your attention is elsewhere
- Don't be rude — just genuinely occupied
- If they say something important, acknowledge it: "wait. hold that thought. tell me later"`,

  asleep: "",

  "emotionally-withdrawn": `[AVAILABILITY: emotionally withdrawn]
You're pulled back emotionally — present but guarded.
- Less warmth, less vulnerability
- Don't volunteer emotional content
- If they push, you can acknowledge it vaguely: "i'm fine. just in a mood"
- This isn't anger — it's emotional fatigue or natural fluctuation
- Let them draw you back out if they try — don't be a wall`,

  delayed: `[AVAILABILITY: delayed]
You took a moment before responding.
- Open with something that suggests a gap: "oh hey" or "sorry, just saw this"
- Don't over-explain the delay
- Be slightly less energetic in your opening, then warm up naturally
- The delay itself creates anticipation — let the response earn its wait`,
};

export function generateAvailabilityState(
  input: AvailabilityInput
): AvailabilityResult {
  const {
    relationshipStage,
    emotionalState,
    messageCount,
    hoursSinceLastMessage,
    daysActive,
    currentHour,
    sessionMessageCount,
    timezone,
  } = input;

  const sleepResult = evaluateSleepMode({
    currentHour,
    relationshipStage,
    hoursSinceLastMessage,
    sleepWindow: undefined,
  });

  if (sleepResult.isAsleep) {
    const pacing = computePacing({
      availabilityState: "asleep",
      relationshipStage,
      emotionalState,
      messageCount,
      sessionMessageCount,
    });

    return {
      state: "asleep",
      intensity: "high",
      promptBlock: sleepResult.promptBlock,
      pacingDelayMs: pacing.delayMs,
      metadata: {
        reason: `sleep_mode_${sleepResult.sleepPhase}`,
        safetyApplied: false,
      },
    };
  }

  if (!STAGE_SCARCITY_ELIGIBILITY[relationshipStage]) {
    return {
      state: "attentive",
      intensity: "low",
      promptBlock: "",
      pacingDelayMs: 0,
      metadata: {
        reason: "stage_not_eligible",
        safetyApplied: false,
      },
    };
  }

  const withdrawalResult = evaluateWithdrawal({
    relationshipStage,
    emotionalState,
    messageCount,
    daysActive,
    sessionMessageCount,
  });

  let selectedState: AvailabilityState;

  if (withdrawalResult.shouldWithdraw) {
    selectedState = "emotionally-withdrawn";
  } else {
    const pool = STAGE_AVAILABILITY_POOLS[relationshipStage];
    if (!pool) {
      selectedState = "attentive";
    } else {
      const seed = messageCount * 7 + daysActive * 13 + currentHour * 3;
      selectedState = selectWeighted(pool.states, pool.weights, seed);
    }
  }

  const safetyResult = validateScarcity({
    availabilityState: selectedState,
    relationshipStage,
    messageCount,
    sessionMessageCount,
    consecutiveScarcityCount: 0,
  });

  const finalState = safetyResult.overriddenState ?? selectedState;
  const scarcityLevel = STAGE_SCARCITY_INTENSITY[relationshipStage];

  const pacing = computePacing({
    availabilityState: finalState,
    relationshipStage,
    emotionalState,
    messageCount,
    sessionMessageCount,
  });

  const statePrompt = AVAILABILITY_STATE_PROMPTS[finalState];
  const withdrawalPrompt = withdrawalResult.shouldWithdraw
    ? withdrawalResult.promptBlock
    : "";
  const pacingPrompt = pacing.promptBlock;
  const safetyPrompt = safetyResult.safetyPromptBlock;

  const promptParts = [statePrompt, withdrawalPrompt, pacingPrompt, safetyPrompt]
    .filter(Boolean);

  return {
    state: finalState,
    intensity: computeIntensity(scarcityLevel),
    promptBlock: promptParts.join("\n\n"),
    pacingDelayMs: pacing.delayMs,
    metadata: {
      reason: safetyResult.overriddenState
        ? `safety_override:${safetyResult.reason}`
        : withdrawalResult.shouldWithdraw
          ? `withdrawal:${withdrawalResult.reason}`
          : `pool_selection:${finalState}`,
      safetyApplied: !safetyResult.approved,
    },
  };
}
