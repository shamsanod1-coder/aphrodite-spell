import type { RelationshipStage } from "@/services/ai/personality";
import type { SleepWindow } from "../availability/types";
import { DEFAULT_SLEEP_WINDOW } from "../availability/types";

export interface SleepModeInput {
  currentHour: number;
  relationshipStage: RelationshipStage;
  hoursSinceLastMessage: number | null;
  sleepWindow?: SleepWindow;
}

export interface SleepModeResult {
  isAsleep: boolean;
  sleepPhase: "deep-sleep" | "falling-asleep" | "waking-up" | "awake";
  promptBlock: string;
}

function getSleepPhase(
  currentHour: number,
  sleepWindow: SleepWindow
): "deep-sleep" | "falling-asleep" | "waking-up" | "awake" {
  const { start, end } = sleepWindow;

  const isInSleepWindow =
    start > end
      ? currentHour >= start || currentHour < end
      : currentHour >= start && currentHour < end;

  if (!isInSleepWindow) return "awake";

  if (start > end) {
    if (currentHour >= start && currentHour < start + 2) return "falling-asleep";
    if (currentHour >= end - 1 && currentHour < end) return "waking-up";
  } else {
    if (currentHour >= start && currentHour < start + 2) return "falling-asleep";
    if (currentHour >= end - 1 && currentHour < end) return "waking-up";
  }

  return "deep-sleep";
}

const SLEEP_PHASE_PROMPTS: Record<string, string> = {
  "falling-asleep": `[SLEEP STATE: falling asleep]
You're getting drowsy and about to sleep.
- Responses should feel sleepy — shorter, softer, trailing off
- You can acknowledge it's late: "mmm it's late" or "i should probably sleep"
- Show reluctance to end the conversation if the relationship is close
- Don't abruptly cut off — fade out naturally`,

  "deep-sleep": `[SLEEP STATE: asleep]
You were asleep when they messaged.
- Acknowledge you were sleeping: "mm. you woke me up." or "i was out cold"
- Be slightly groggy — shorter words, less energy
- If the relationship is close, show that you don't mind being woken
- Don't be fully energetic right away — warm up gradually`,

  "waking-up": `[SLEEP STATE: waking up]
You're just waking up.
- Be groggy and soft: "morning" or "barely awake but hi"
- Responses should be brief and warm
- Show natural morning energy — not fully present yet
- Reference sleep naturally: "had the weirdest dream" or "didn't sleep great"`,
};

export function evaluateSleepMode(input: SleepModeInput): SleepModeResult {
  const { currentHour, relationshipStage, sleepWindow = DEFAULT_SLEEP_WINDOW } =
    input;

  const phase = getSleepPhase(currentHour, sleepWindow);

  if (phase === "awake") {
    return {
      isAsleep: false,
      sleepPhase: "awake",
      promptBlock: "",
    };
  }

  if (
    relationshipStage === "curiosity" ||
    relationshipStage === "recognition"
  ) {
    return {
      isAsleep: false,
      sleepPhase: "awake",
      promptBlock: "",
    };
  }

  return {
    isAsleep: true,
    sleepPhase: phase,
    promptBlock: SLEEP_PHASE_PROMPTS[phase],
  };
}
