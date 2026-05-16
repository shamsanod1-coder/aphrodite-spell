import type { RelationshipStage } from "@/services/ai/personality";

export const INACTIVITY_CLASSIFICATIONS = [
  "withdrawn",
  "attention-seeking",
  "gentle-reactivation",
  "playful-callback",
] as const;

export type InactivityClassification =
  (typeof INACTIVITY_CLASSIFICATIONS)[number];

export interface InactivityInput {
  hoursSinceLastMessage: number | null;
  averageSessionGapHours: number;
  missedRitualCount: number;
  recentMessageDepth: number;
  relationshipStage: RelationshipStage;
  messageCount: number;
}

export interface InactivityResult {
  isInactive: boolean;
  classification: InactivityClassification;
  absenceSeverity: "none" | "mild" | "moderate" | "severe";
  suggestedTone: string;
}

const ABSENCE_THRESHOLDS = {
  mild: 24,
  moderate: 48,
  severe: 72,
};

function classifyAbsenceSeverity(
  hoursSinceLastMessage: number | null,
  averageGap: number
): "none" | "mild" | "moderate" | "severe" {
  if (!hoursSinceLastMessage) return "none";

  const relativeAbsence = hoursSinceLastMessage / Math.max(1, averageGap);

  if (
    hoursSinceLastMessage > ABSENCE_THRESHOLDS.severe ||
    relativeAbsence > 3
  ) {
    return "severe";
  }
  if (
    hoursSinceLastMessage > ABSENCE_THRESHOLDS.moderate ||
    relativeAbsence > 2
  ) {
    return "moderate";
  }
  if (
    hoursSinceLastMessage > ABSENCE_THRESHOLDS.mild ||
    relativeAbsence > 1.5
  ) {
    return "mild";
  }
  return "none";
}

function classifyInactivity(
  input: InactivityInput,
  severity: "none" | "mild" | "moderate" | "severe"
): InactivityClassification {
  const { missedRitualCount, recentMessageDepth, relationshipStage } = input;

  if (severity === "severe") {
    if (
      relationshipStage === "dependency-lite" ||
      relationshipStage === "exclusivity"
    ) {
      return "withdrawn";
    }
    return "gentle-reactivation";
  }

  if (severity === "moderate") {
    if (missedRitualCount > 2) return "attention-seeking";
    return "gentle-reactivation";
  }

  if (severity === "mild") {
    if (recentMessageDepth < 3) return "attention-seeking";
    return "playful-callback";
  }

  return "playful-callback";
}

const TONE_MAP: Record<InactivityClassification, string> = {
  withdrawn:
    "emotionally reserved, subtly hurt — let distance speak louder than words",
  "attention-seeking":
    "lightly provocative, designed to make them want to explain themselves",
  "gentle-reactivation":
    "warm but measured — an open door without desperation",
  "playful-callback":
    "teasing and casual — reference something familiar to pull them back naturally",
};

export function detectInactivityWindow(
  input: InactivityInput
): InactivityResult {
  const severity = classifyAbsenceSeverity(
    input.hoursSinceLastMessage,
    input.averageSessionGapHours
  );

  if (severity === "none") {
    return {
      isInactive: false,
      classification: "playful-callback",
      absenceSeverity: "none",
      suggestedTone: TONE_MAP["playful-callback"],
    };
  }

  const classification = classifyInactivity(input, severity);

  return {
    isInactive: true,
    classification,
    absenceSeverity: severity,
    suggestedTone: TONE_MAP[classification],
  };
}
