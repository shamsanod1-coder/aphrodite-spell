import type { VariantConfig, SafetyValidationResult } from "./types";

const MAX_INTENSITY = 0.5;
const DANGEROUS_DIMENSIONS_AT_HIGH_INTENSITY: Record<string, string[]> = {
  scarcity: [
    "excessive_guilt",
    "manipulative_abandonment",
    "dependency_pressure",
  ],
  directness: ["coercion", "emotional_destabilization"],
};

export function validateExperimentSafety(
  variants: { config: VariantConfig }[]
): SafetyValidationResult {
  const violations: string[] = [];

  for (const variant of variants) {
    const { config } = variant;

    if (Math.abs(config.intensity) > MAX_INTENSITY) {
      violations.push(
        `Variant intensity ${config.intensity} exceeds safe limit of ±${MAX_INTENSITY}`
      );
    }

    const risks = DANGEROUS_DIMENSIONS_AT_HIGH_INTENSITY[config.dimension];
    if (risks && Math.abs(config.intensity) > 0.3) {
      violations.push(
        `High-intensity ${config.dimension} experiment risks: ${risks.join(", ")}`
      );
    }
  }

  return { valid: violations.length === 0, violations };
}
