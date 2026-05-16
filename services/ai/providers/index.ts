import type { LanguageModel } from "ai";
import { getAnthropicModel } from "./anthropic";
import { getOpenAIModel } from "./openai";

export type AIProvider = "anthropic" | "openai";

const DEFAULT_PROVIDER: AIProvider = process.env.ANTHROPIC_API_KEY
  ? "anthropic"
  : "openai";

export function getModel(provider?: AIProvider): LanguageModel {
  const selected = provider ?? DEFAULT_PROVIDER;

  switch (selected) {
    case "anthropic":
      return getAnthropicModel();
    case "openai":
      return getOpenAIModel();
    default:
      throw new Error(`Unknown AI provider: ${selected}`);
  }
}
