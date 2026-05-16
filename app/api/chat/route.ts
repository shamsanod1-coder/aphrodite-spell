import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { getModel, SYSTEM_PROMPT } from "@/services/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getConversation } from "@/db/queries";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
