import { generateText } from "ai";
import { getAnthropicModel } from "@/services/ai/providers/anthropic";

const SUMMARIZATION_PROMPT = `You are summarizing a conversation between a user and their AI companion Aria for memory preservation purposes.

Create a concise emotional summary that captures:
1. Key emotional themes and shifts during the conversation
2. Important personal disclosures or vulnerabilities shared
3. Significant relationship dynamics or attachment signals
4. Any unresolved emotional threads

Guidelines:
- Focus on emotional content, not factual details
- Keep the summary to 3-5 sentences
- Preserve the emotional arc, not just isolated moments
- Note the overall tone and trajectory of the conversation`;

export async function summarizeConversation(
  messages: { role: string; content: string }[]
): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "User" : "Aria"}: ${m.content}`)
    .join("\n");

  const { text } = await generateText({
    model: getAnthropicModel(),
    prompt: `${SUMMARIZATION_PROMPT}

Conversation:
${conversationText}`,
    maxOutputTokens: 300,
  });

  return text;
}
