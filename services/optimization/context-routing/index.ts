import type { LanguageModel } from "ai";
import type { RoutingInput, RoutingResult } from "./types";
import { getAnthropicProvider } from "@/services/ai/providers/anthropic";
import { getOpenAIProvider } from "@/services/ai/providers/openai";

const ADVANCED_STAGES = new Set([
  "exclusivity",
  "dependency-lite",
  "ritualization",
]);

const NSFW_KEYWORDS = new Set([
  "nsfw",
  "intimate",
  "sexual",
  "explicit",
  "bedroom",
  "naked",
  "undress",
]);

export function classifyRoutingDecision(input: RoutingInput): RoutingResult {
  // Always use premium for emotionally intense exchanges
  if (input.emotionalIntensity === "high") {
    return {
      decision: "premium",
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      reason: "high_emotional_intensity",
    };
  }

  // Premium for NSFW content
  if (input.hasNsfwIndicators && input.isPremium) {
    return {
      decision: "premium",
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      reason: "nsfw_content",
    };
  }

  // Premium for advanced relationship stages with medium intensity
  if (
    ADVANCED_STAGES.has(input.relationshipStage) &&
    input.emotionalIntensity === "medium"
  ) {
    return {
      decision: "premium",
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      reason: "advanced_stage_medium_intensity",
    };
  }

  // Premium for high memory complexity
  if (input.memoryComplexity > 3) {
    return {
      decision: "premium",
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      reason: "high_memory_complexity",
    };
  }

  // Lite for simple exchanges at early stages
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      decision: "lite",
      model: "claude-haiku-3-5-20241022",
      provider: "anthropic",
      reason: "low_complexity_exchange",
    };
  }

  return {
    decision: "lite",
    model: "gpt-4o-mini",
    provider: "openai",
    reason: "low_complexity_fallback",
  };
}

export function getRoutedModel(routing: RoutingResult): LanguageModel {
  if (routing.provider === "anthropic") {
    const provider = getAnthropicProvider();
    return provider(routing.model);
  }
  const provider = getOpenAIProvider();
  return provider(routing.model);
}

export function detectNsfwIndicators(text: string): boolean {
  const lower = text.toLowerCase();
  for (const keyword of NSFW_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }
  return false;
}

export type { RoutingInput, RoutingResult, RoutingDecision } from "./types";
