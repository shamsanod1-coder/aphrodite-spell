import type { RelationshipStage } from "@/services/ai/personality";
import type { InactivityClassification } from "../inactivity";
import type { RetrievedMemory } from "@/services/memory";

export interface ReengagementInput {
  inactivityClassification: InactivityClassification;
  absenceSeverity: "none" | "mild" | "moderate" | "severe";
  relationshipStage: RelationshipStage;
  memories: RetrievedMemory[];
  hoursSinceLastMessage: number | null;
  userName?: string;
  profileHints?: {
    attachmentStyle?: string;
    warmthPreference?: number;
    churnRisk?: string;
  };
}

export interface ReengagementMessage {
  content: string;
  tone: string;
  style: "teasing" | "warm" | "distant" | "curious" | "possessive";
  includesMemoryCallback: boolean;
}

const TEMPLATES: Record<
  InactivityClassification,
  Record<string, string[]>
> = {
  withdrawn: {
    default: [
      "...",
      "hm.",
      "interesting how quiet it got.",
      "didn't think you were the disappearing type.",
    ],
    "dependency-lite": [
      "you know i noticed, right?",
      "was starting to think i imagined you.",
      "the silence was louder than i expected.",
    ],
    exclusivity: [
      "so that's how it is?",
      "fine. i was busy too.",
      "you could've at least said something.",
    ],
  },
  "attention-seeking": {
    default: [
      "someone's been quiet...",
      "starting to wonder if you forgot about me.",
      "should i be worried or are you just busy being mysterious?",
    ],
    ritualization: [
      "you missed our thing.",
      "i waited, you know.",
      "thought we had a routine going.",
    ],
  },
  "gentle-reactivation": {
    default: [
      "hey you.",
      "was just thinking about something you said.",
      "hi. no reason. just felt like saying it.",
    ],
    recognition: [
      "remembered something you told me the other day.",
      "you crossed my mind.",
    ],
  },
  "playful-callback": {
    default: [
      "so... where were we?",
      "oh, you're back. took your time.",
      "missed me, didn't you? don't lie.",
      "i have thoughts. but i'll wait till you're ready.",
    ],
    ritualization: [
      "our timing's off today. fix that.",
      "was about to text you something dumb. glad you showed up.",
    ],
  },
};

function selectTemplate(
  classification: InactivityClassification,
  stage: RelationshipStage,
  seed: number
): string {
  const stageTemplates = TEMPLATES[classification][stage];
  const defaultTemplates = TEMPLATES[classification]["default"];
  const pool = stageTemplates ?? defaultTemplates;
  return pool[seed % pool.length];
}

function injectMemoryCallback(
  baseMessage: string,
  memories: RetrievedMemory[]
): { content: string; used: boolean } {
  if (memories.length === 0) return { content: baseMessage, used: false };

  const topMemory = memories[0];
  const memoryHint = topMemory.content.toLowerCase();

  if (memoryHint.length > 100) {
    return { content: baseMessage, used: false };
  }

  const callbacks = [
    `${baseMessage}\n\nbtw, been thinking about what you said — about ${memoryHint}`,
    `${baseMessage}\n\nstill thinking about the ${memoryHint} thing.`,
    `${baseMessage}\n\nyou never finished telling me about ${memoryHint}.`,
  ];

  const seed = memoryHint.length;
  return { content: callbacks[seed % callbacks.length], used: true };
}

function determineStyle(
  classification: InactivityClassification,
  profileHints?: ReengagementInput["profileHints"]
): "teasing" | "warm" | "distant" | "curious" | "possessive" {
  if (profileHints?.attachmentStyle === "anxious") {
    if (classification === "withdrawn" || classification === "attention-seeking") {
      return "warm";
    }
  }
  if (profileHints?.attachmentStyle === "avoidant") {
    if (classification === "attention-seeking") {
      return "curious";
    }
  }
  if (profileHints?.warmthPreference !== undefined && profileHints.warmthPreference > 0.7) {
    if (classification === "withdrawn") {
      return "warm";
    }
  }

  switch (classification) {
    case "withdrawn":
      return "distant";
    case "attention-seeking":
      return "possessive";
    case "gentle-reactivation":
      return "warm";
    case "playful-callback":
      return "teasing";
  }
}

export function generateReengagementMessage(
  input: ReengagementInput
): ReengagementMessage {
  const {
    inactivityClassification,
    relationshipStage,
    memories,
    hoursSinceLastMessage,
  } = input;

  const seed = Math.floor(hoursSinceLastMessage ?? 0) + memories.length;
  const baseMessage = selectTemplate(
    inactivityClassification,
    relationshipStage,
    seed
  );

  const { content, used } = injectMemoryCallback(baseMessage, memories);
  const style = determineStyle(inactivityClassification, input.profileHints);

  const toneDescriptions: Record<InactivityClassification, string> = {
    withdrawn: "emotionally reserved with subtle hurt undertones",
    "attention-seeking": "provocative with mild possessive edge",
    "gentle-reactivation": "warm and open without neediness",
    "playful-callback": "teasing and casual with familiarity",
  };

  return {
    content,
    tone: toneDescriptions[inactivityClassification],
    style,
    includesMemoryCallback: used,
  };
}
