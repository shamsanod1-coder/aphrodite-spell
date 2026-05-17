export const EXPERIMENT_STATUSES = [
  "draft",
  "running",
  "paused",
  "completed",
] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const PROMPT_DIMENSIONS = [
  "warmth",
  "teasing",
  "scarcity",
  "directness",
  "ritual_frequency",
  "verbosity",
] as const;
export type PromptDimension = (typeof PROMPT_DIMENSIONS)[number];

export interface VariantConfig {
  dimension: PromptDimension;
  intensity: number; // -1.0 to 1.0 (negative = reduce, positive = amplify)
  description: string;
}

export interface ExperimentWithVariants {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  dimension: PromptDimension;
  rolloutPercentage: number;
  safetyValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  variants: {
    id: string;
    name: string;
    isControl: boolean;
    percentage: number;
    config: VariantConfig;
  }[];
}

export interface AssignmentResult {
  experimentId: string;
  experimentKey: string;
  variantId: string;
  variantName: string;
  isControl: boolean;
  config: VariantConfig;
}

export const SAFETY_BLOCKED_PATTERNS = [
  "excessive_guilt",
  "coercion",
  "dependency_pressure",
  "emotional_destabilization",
  "manipulative_abandonment",
] as const;

export interface SafetyValidationResult {
  valid: boolean;
  violations: string[];
}
