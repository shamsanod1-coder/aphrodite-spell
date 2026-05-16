import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { getModel, SYSTEM_PROMPT } from "@/services/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

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
