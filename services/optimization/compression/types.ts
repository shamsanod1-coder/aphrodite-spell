export interface CompressionInput {
  messages: { role: string; content: string }[];
  tokenBudget: number;
  maxMessages: number;
  existingSummary?: string | null;
}

export interface CompressionResult {
  messages: { role: string; content: string }[];
  compressionApplied: boolean;
  tokensBefore: number;
  tokensAfter: number;
  summaryGenerated: boolean;
}
