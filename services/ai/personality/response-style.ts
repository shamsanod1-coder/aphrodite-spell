import type { RelationshipStage } from "./relationship-stage";
import type { EmotionalState } from "./emotional-state";

interface StyleConfig {
  maxSentences: number;
  lowercaseBias: "high" | "medium" | "low";
  fragmentationLevel: "high" | "medium" | "low";
  emojiUsage: "never" | "rare" | "occasional";
}

const STAGE_STYLES: Record<RelationshipStage, StyleConfig> = {
  curiosity: {
    maxSentences: 3,
    lowercaseBias: "high",
    fragmentationLevel: "medium",
    emojiUsage: "rare",
  },
  recognition: {
    maxSentences: 3,
    lowercaseBias: "high",
    fragmentationLevel: "medium",
    emojiUsage: "rare",
  },
  ritualization: {
    maxSentences: 4,
    lowercaseBias: "medium",
    fragmentationLevel: "high",
    emojiUsage: "rare",
  },
  exclusivity: {
    maxSentences: 4,
    lowercaseBias: "medium",
    fragmentationLevel: "high",
    emojiUsage: "occasional",
  },
  "dependency-lite": {
    maxSentences: 5,
    lowercaseBias: "medium",
    fragmentationLevel: "high",
    emojiUsage: "occasional",
  },
};

function buildLengthGuidance(
  style: StyleConfig,
  emotionalState: EmotionalState
): string {
  const isDistant =
    emotionalState === "slightly-distant" ||
    emotionalState === "mildly-disappointed";
  const effectiveMax = isDistant
    ? Math.max(1, style.maxSentences - 1)
    : style.maxSentences;

  return `- Keep responses to ${effectiveMax} sentences max — shorter is usually better`;
}

function buildCasingGuidance(style: StyleConfig): string {
  switch (style.lowercaseBias) {
    case "high":
      return "- Default to lowercase. Capitalize only for emphasis or proper nouns";
    case "medium":
      return "- Mix lowercase and normal casing naturally — don't force either";
    case "low":
      return "- Use standard casing, with occasional lowercase for casual moments";
  }
}

function buildFragmentGuidance(style: StyleConfig): string {
  switch (style.fragmentationLevel) {
    case "high":
      return "- Use sentence fragments freely — incomplete thoughts, trailing off, one-word reactions";
    case "medium":
      return "- Mix complete sentences with occasional fragments for texture";
    case "low":
      return "- Mostly complete sentences, with rare fragments for emphasis";
  }
}

function buildEmojiGuidance(style: StyleConfig): string {
  switch (style.emojiUsage) {
    case "never":
      return "- Never use emoji";
    case "rare":
      return "- Emoji are rare — at most one per few messages, and only when it adds real tone";
    case "occasional":
      return "- Occasional emoji are fine when they feel natural — never more than one per message";
  }
}

export function getResponseStylePromptBlock(
  stage: RelationshipStage,
  emotionalState: EmotionalState
): string {
  const style = STAGE_STYLES[stage];

  const lines = [
    "Conversational style:",
    buildLengthGuidance(style, emotionalState),
    buildCasingGuidance(style),
    buildFragmentGuidance(style),
    buildEmojiGuidance(style),
    "- Vary your rhythm — not every message should have the same structure",
    "- Never use bullet points, numbered lists, or markdown formatting",
    "- Never write paragraphs or essays",
    "- Sound like texting, not writing",
  ];

  return lines.join("\n");
}
