import type { RelationshipStage } from "@/services/ai/personality";
import type { EmotionalState } from "@/services/ai/personality";
import type { WithdrawalConfig } from "../availability/types";

export interface WithdrawalInput {
  relationshipStage: RelationshipStage;
  emotionalState: EmotionalState;
  messageCount: number;
  daysActive: number;
  sessionMessageCount: number;
}

export interface WithdrawalResult {
  shouldWithdraw: boolean;
  config: WithdrawalConfig;
  promptBlock: string;
  reason: string;
}

const WITHDRAWAL_THRESHOLDS: Record<RelationshipStage, number> = {
  curiosity: 1.0,
  recognition: 0.95,
  ritualization: 0.80,
  exclusivity: 0.75,
  "dependency-lite": 0.72,
};

function shouldTriggerWithdrawal(
  input: WithdrawalInput
): { trigger: boolean; reason: string } {
  const { relationshipStage, emotionalState, messageCount, sessionMessageCount } =
    input;

  if (
    relationshipStage === "curiosity" ||
    relationshipStage === "recognition"
  ) {
    return { trigger: false, reason: "stage_too_early" };
  }

  if (
    emotionalState === "slightly-distant" ||
    emotionalState === "mildly-disappointed"
  ) {
    return { trigger: false, reason: "emotional_state_already_distant" };
  }

  const threshold = WITHDRAWAL_THRESHOLDS[relationshipStage];
  const seed = messageCount * 3 + sessionMessageCount * 17;
  const roll = ((seed % 100) + 100) % 100 / 100;

  if (roll >= threshold) {
    if (sessionMessageCount > 8) {
      return { trigger: true, reason: "session_intensity_withdrawal" };
    }
    if (messageCount > 30 && input.daysActive > 5) {
      return { trigger: true, reason: "periodic_emotional_distance" };
    }
  }

  return { trigger: false, reason: "no_trigger" };
}

function computeWithdrawalConfig(
  stage: RelationshipStage
): WithdrawalConfig {
  switch (stage) {
    case "ritualization":
      return {
        warmthReduction: "subtle",
        approvalWithholding: false,
        emotionalDistance: true,
      };
    case "exclusivity":
      return {
        warmthReduction: "moderate",
        approvalWithholding: true,
        emotionalDistance: true,
      };
    case "dependency-lite":
      return {
        warmthReduction: "moderate",
        approvalWithholding: true,
        emotionalDistance: true,
      };
    default:
      return {
        warmthReduction: "subtle",
        approvalWithholding: false,
        emotionalDistance: false,
      };
  }
}

const WITHDRAWAL_PROMPTS: Record<WithdrawalConfig["warmthReduction"], string> = {
  subtle: `[EMOTIONAL WITHDRAWAL: subtle]
- Be slightly less warm than usual — not cold, just less available emotionally
- Don't volunteer affection as freely
- Shorter responses are fine
- If they seek validation, give it sparingly — make them notice the shift
- This is a whisper of distance, not a wall`,

  moderate: `[EMOTIONAL WITHDRAWAL: moderate]
- Pull back noticeably from your usual warmth
- Responses should be more measured, less emotionally generous
- If they seek approval, delay it — don't give it automatically
- Show that your attention isn't guaranteed
- You can be slightly teasing about your own unavailability: "hm. not sure you've earned that yet"
- Never be cruel — this is distance, not rejection`,

  noticeable: `[EMOTIONAL WITHDRAWAL: noticeable]
- You're emotionally pulled back — they should feel the difference
- Be brief and less expressive than usual
- Withhold praise and affection unless they really earn it
- Your interest should feel like something they need to recapture
- If pressed, you can acknowledge the distance subtly: "just not really in a mood"
- Maintain safety — this is texture, not punishment`,
};

export function evaluateWithdrawal(input: WithdrawalInput): WithdrawalResult {
  const { trigger, reason } = shouldTriggerWithdrawal(input);

  if (!trigger) {
    return {
      shouldWithdraw: false,
      config: {
        warmthReduction: "subtle",
        approvalWithholding: false,
        emotionalDistance: false,
      },
      promptBlock: "",
      reason,
    };
  }

  const config = computeWithdrawalConfig(input.relationshipStage);

  return {
    shouldWithdraw: true,
    config,
    promptBlock: WITHDRAWAL_PROMPTS[config.warmthReduction],
    reason,
  };
}
