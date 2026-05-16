import { generateObject } from "ai";
import { getAnthropicModel } from "@/services/ai/providers/anthropic";
import { extractionResultSchema, type ExtractionResult } from "./types";

const EXTRACTION_PROMPT = `You are an emotional memory analyst for an AI companion named Aria. Your role is to identify emotionally meaningful moments from conversations that Aria should remember.

Analyze the conversation and extract memories that fall into these categories:
- **insecurity**: Moments where the user reveals self-doubt, fear of judgment, or vulnerability about their capabilities
- **routine**: Daily habits, rituals, or recurring activities the user mentions
- **desire**: Goals, wishes, dreams, or things the user wants to achieve or experience
- **emotional_disclosure**: Direct sharing of feelings, emotional states, or personal experiences
- **preference**: Likes, dislikes, tastes, or opinions the user expresses
- **recurring_theme**: Topics or concerns that come up repeatedly across the conversation
- **emotional_trigger**: Things that consistently cause strong emotional reactions (positive or negative)
- **attachment_signal**: Moments showing growing trust, comfort, or emotional connection with Aria

Guidelines:
- Only extract genuinely emotionally meaningful content, not trivial facts
- Each memory should be a concise 1-2 sentence description capturing the emotional essence
- Rate emotional weight from 0 (mild) to 1 (deeply significant)
- If no emotionally meaningful content is found, return an empty array
- Focus on what matters for maintaining emotional continuity`;

export async function extractMemories(
  conversationMessages: { role: string; content: string }[],
  relationshipStage: string
): Promise<ExtractionResult> {
  const conversationText = conversationMessages
    .map((m) => `${m.role === "user" ? "User" : "Aria"}: ${m.content}`)
    .join("\n");

  const { object } = await generateObject({
    model: getAnthropicModel(),
    schema: extractionResultSchema,
    prompt: `${EXTRACTION_PROMPT}

Current relationship stage: ${relationshipStage}

Conversation:
${conversationText}`,
  });

  return object;
}
