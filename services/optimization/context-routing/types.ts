export type RoutingDecision = "premium" | "lite";

export interface RoutingInput {
  emotionalIntensity: "low" | "medium" | "high";
  relationshipStage: string;
  messageLength: number;
  hasNsfwIndicators: boolean;
  memoryComplexity: number;
  isPremium: boolean;
}

export interface RoutingResult {
  decision: RoutingDecision;
  model: string;
  provider: "anthropic" | "openai";
  reason: string;
}
