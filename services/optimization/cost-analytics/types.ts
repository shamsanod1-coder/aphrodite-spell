export interface CostTrackingInput {
  userId: string;
  conversationId: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  routingDecision: "premium" | "lite";
  contextTokensBefore?: number;
  contextTokensAfter?: number;
  compressionApplied?: boolean;
}

export interface ModelCostRates {
  inputPer1k: number;
  outputPer1k: number;
}
