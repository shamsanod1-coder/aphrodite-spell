import type { CompressionInput, CompressionResult } from "./types";
import { estimateTokens } from "../token-budgeting";

const SUMMARY_ROLLING_THRESHOLD = 20;

export function compressContext(input: CompressionInput): CompressionResult {
  const { messages, tokenBudget, maxMessages, existingSummary } = input;

  const totalTokensBefore = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );

  // If within budget and message limit, no compression needed
  const sliced = messages.slice(-maxMessages);
  const slicedTokens = sliced.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );

  if (slicedTokens <= tokenBudget) {
    return {
      messages: sliced,
      compressionApplied: false,
      tokensBefore: totalTokensBefore,
      tokensAfter: slicedTokens,
      summaryGenerated: false,
    };
  }

  // Build compressed context: summary prefix + recent messages within budget
  const result: { role: string; content: string }[] = [];
  let usedTokens = 0;

  // Reserve tokens for summary prefix if available
  if (existingSummary) {
    const summaryTokens = estimateTokens(existingSummary);
    const summaryMessage = {
      role: "system" as const,
      content: `[Previous conversation summary]\n${existingSummary}`,
    };
    result.push(summaryMessage);
    usedTokens += summaryTokens + estimateTokens("[Previous conversation summary]\n");
  }

  // Fill remaining budget with most recent messages (newest first)
  const recentMessages: { role: string; content: string }[] = [];
  for (let i = sliced.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(sliced[i].content);
    if (usedTokens + msgTokens > tokenBudget) break;
    recentMessages.unshift(sliced[i]);
    usedTokens += msgTokens;
  }

  result.push(...recentMessages);

  return {
    messages: result,
    compressionApplied: true,
    tokensBefore: totalTokensBefore,
    tokensAfter: usedTokens,
    summaryGenerated: false,
  };
}

export function shouldGenerateRollingSummary(messageCount: number): boolean {
  return messageCount > 0 && messageCount % SUMMARY_ROLLING_THRESHOLD === 0;
}

export type { CompressionInput, CompressionResult } from "./types";
