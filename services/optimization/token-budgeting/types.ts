export interface TokenBudget {
  totalBudget: number;
  systemPromptBudget: number;
  memoriesBudget: number;
  contextMessagesBudget: number;
  responseReserve: number;
}

export interface TokenBudgetInput {
  tier: "free" | "premium";
  maxContextMessages: number;
}

export interface TokenEstimate {
  text: string;
  tokens: number;
}
