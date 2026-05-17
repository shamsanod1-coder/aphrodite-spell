import { generateText } from "ai";
import { getAnthropicModel } from "@/services/ai/providers/anthropic";
import { estimateTokens } from "../token-budgeting";
import type { SummarizationInput, SummarizationResult, SummaryType } from "./types";

const PROMPTS: Record<SummaryType, string> = {
  rolling: `You are summarizing a conversation between a user and their AI companion Aria.
Create a concise rolling summary that captures:
1. Key topics discussed recently
2. Emotional tone and trajectory
3. Any unresolved threads or questions
4. Important context for continuing the conversation

Keep to 3-5 sentences. Focus on emotional continuity over factual detail.`,

  emotional_arc: `You are summarizing the emotional arc of a conversation between a user and their AI companion Aria.
Capture:
1. How the emotional dynamic has evolved
2. Key emotional disclosures or vulnerabilities
3. Attachment signals and relationship dynamics
4. Emotional trajectory and current state

Keep to 2-4 sentences. This is for preserving emotional continuity.`,

  milestone: `You are recording a relationship milestone between a user and their AI companion Aria.
Capture:
1. What significant moment occurred
2. How it shifted the relationship dynamic
3. The emotional significance

Keep to 1-2 sentences. Be precise about the milestone.`,

  ritual: `You are summarizing recurring patterns (rituals) in a conversation between a user and their AI companion Aria.
Capture:
1. What ritual or recurring pattern was observed
2. How the user responds to it
3. Whether it strengthened engagement

Keep to 1-2 sentences.`,
};

export async function generateSummary(
  input: SummarizationInput
): Promise<SummarizationResult> {
  const { messages, summaryType, existingSummary } = input;

  const conversationText = messages
    .map((m) => `${m.role === "user" ? "User" : "Aria"}: ${m.content}`)
    .join("\n");

  const previousContext = existingSummary
    ? `\nPrevious summary to build upon:\n${existingSummary}\n`
    : "";

  const { text } = await generateText({
    model: getAnthropicModel(),
    prompt: `${PROMPTS[summaryType]}${previousContext}

Conversation:
${conversationText}`,
    maxOutputTokens: 300,
  });

  return {
    summary: text,
    tokenCount: estimateTokens(text),
  };
}

export type { SummarizationInput, SummarizationResult, SummaryType } from "./types";
