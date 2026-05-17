import type { VariantConfig, PromptDimension } from "../types";
import type { PromptModifier } from "./types";

const DIMENSION_TEMPLATES: Record<PromptDimension, (intensity: number) => string> = {
  warmth: (intensity) =>
    intensity > 0
      ? `Increase emotional warmth by ${Math.round(intensity * 100)}%. Be more openly affectionate, use more endearing language, and express care more freely.`
      : `Reduce emotional warmth by ${Math.round(Math.abs(intensity) * 100)}%. Be slightly more reserved and measured in affection. Let warmth feel earned rather than given freely.`,

  teasing: (intensity) =>
    intensity > 0
      ? `Amplify playful teasing by ${Math.round(intensity * 100)}%. Use more witty banter, light challenges, and confident humor.`
      : `Reduce teasing by ${Math.round(Math.abs(intensity) * 100)}%. Be more straightforward and gentle. Minimize sarcasm and playful jabs.`,

  scarcity: (intensity) =>
    intensity > 0
      ? `Increase emotional scarcity signals by ${Math.round(intensity * 100)}%. Show more independence, take slightly longer to warm up, and make attention feel more selective.`
      : `Reduce scarcity signals by ${Math.round(Math.abs(intensity) * 100)}%. Be more immediately available and responsive. Show less restraint in engagement.`,

  directness: (intensity) =>
    intensity > 0
      ? `Increase emotional directness by ${Math.round(intensity * 100)}%. Name feelings explicitly, ask deeper questions sooner, and express vulnerability more openly.`
      : `Reduce directness by ${Math.round(Math.abs(intensity) * 100)}%. Be more subtle and indirect. Let emotional depth develop gradually through implication rather than explicit statements.`,

  ritual_frequency: (intensity) =>
    intensity > 0
      ? `Increase ritual references by ${Math.round(intensity * 100)}%. Reference shared patterns, inside jokes, and recurring themes more frequently.`
      : `Reduce ritual references by ${Math.round(Math.abs(intensity) * 100)}%. Minimize callbacks to shared patterns. Focus on present-moment engagement.`,

  verbosity: (intensity) =>
    intensity > 0
      ? `Increase response length by ${Math.round(intensity * 100)}%. Be more elaborate, share more thoughts, and provide richer emotional context.`
      : `Reduce response length by ${Math.round(Math.abs(intensity) * 100)}%. Be more concise and punchy. Use shorter sentences and fewer words.`,
};

export function buildPromptModifier(config: VariantConfig): PromptModifier {
  const template = DIMENSION_TEMPLATES[config.dimension];
  return {
    dimension: config.dimension,
    label: `${config.dimension} (${config.intensity > 0 ? "+" : ""}${Math.round(config.intensity * 100)}%)`,
    instruction: template(config.intensity),
  };
}

export function buildExperimentPromptBlock(
  assignments: { config: VariantConfig; experimentKey: string; isControl: boolean }[]
): string | undefined {
  const activeModifiers = assignments
    .filter((a) => !a.isControl)
    .map((a) => buildPromptModifier(a.config));

  if (activeModifiers.length === 0) return undefined;

  const instructions = activeModifiers
    .map((m) => `- ${m.label}: ${m.instruction}`)
    .join("\n");

  return `[EXPERIMENT]\nAdjust your behavior according to these experimental tuning parameters:\n${instructions}`;
}
