import { recordInferenceCost } from "@/db/queries";
import type { CostTrackingInput, ModelCostRates } from "./types";

const MODEL_COST_RATES: Record<string, ModelCostRates> = {
  "claude-sonnet-4-20250514": { inputPer1k: 0.003, outputPer1k: 0.015 },
  "claude-haiku-3-5-20241022": { inputPer1k: 0.0008, outputPer1k: 0.004 },
  "gpt-4o-mini": { inputPer1k: 0.00015, outputPer1k: 0.0006 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = MODEL_COST_RATES[model] ?? MODEL_COST_RATES["gpt-4o-mini"];
  return (
    (inputTokens / 1000) * rates.inputPer1k +
    (outputTokens / 1000) * rates.outputPer1k
  );
}

export async function trackInferenceCost(
  input: CostTrackingInput
): Promise<void> {
  const cost = estimateCost(input.model, input.inputTokens, input.outputTokens);

  await recordInferenceCost({
    userId: input.userId,
    conversationId: input.conversationId,
    model: input.model,
    provider: input.provider,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCost: cost,
    routingDecision: input.routingDecision,
    contextTokensBefore: input.contextTokensBefore,
    contextTokensAfter: input.contextTokensAfter,
    compressionApplied: input.compressionApplied,
  });
}

export type { CostTrackingInput, ModelCostRates } from "./types";
