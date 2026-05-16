import { createAnthropic } from "@ai-sdk/anthropic";

export function getAnthropicProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return createAnthropic({ apiKey });
}

export function getAnthropicModel() {
  const provider = getAnthropicProvider();
  return provider("claude-sonnet-4-20250514");
}
