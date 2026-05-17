import type { TokenBudget, TokenBudgetInput } from "./types";

const CHARS_PER_TOKEN = 4;

const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "claude-sonnet-4-20250514": 200_000,
  "claude-haiku-3-5-20241022": 200_000,
  "gpt-4o-mini": 128_000,
};

const TIER_TOKEN_BUDGETS: Record<string, number> = {
  free: 8_000,
  premium: 24_000,
};

const BUDGET_ALLOCATIONS = {
  systemPrompt: 0.25,
  memories: 0.10,
  contextMessages: 0.50,
  responseReserve: 0.15,
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function computeTokenBudget(input: TokenBudgetInput): TokenBudget {
  const totalBudget = TIER_TOKEN_BUDGETS[input.tier] ?? TIER_TOKEN_BUDGETS.free;

  return {
    totalBudget,
    systemPromptBudget: Math.floor(totalBudget * BUDGET_ALLOCATIONS.systemPrompt),
    memoriesBudget: Math.floor(totalBudget * BUDGET_ALLOCATIONS.memories),
    contextMessagesBudget: Math.floor(totalBudget * BUDGET_ALLOCATIONS.contextMessages),
    responseReserve: Math.floor(totalBudget * BUDGET_ALLOCATIONS.responseReserve),
  };
}

export function getModelContextLimit(modelId: string): number {
  return MODEL_CONTEXT_LIMITS[modelId] ?? 128_000;
}

export function budgetAwareMessageSlice(
  messages: { role: string; content: string }[],
  tokenBudget: number,
  maxMessages: number
): { role: string; content: string }[] {
  const sliced = messages.slice(-maxMessages);
  const result: { role: string; content: string }[] = [];
  let usedTokens = 0;

  for (let i = sliced.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(sliced[i].content);
    if (usedTokens + msgTokens > tokenBudget) break;
    result.unshift(sliced[i]);
    usedTokens += msgTokens;
  }

  return result;
}

export type { TokenBudget, TokenBudgetInput } from "./types";
