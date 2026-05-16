import {
  streamText,
  type UIMessage,
  convertToModelMessages,
} from "ai";
import { getModel } from "@/services/ai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getConversation,
  countConversationMessages,
  getLastMessageTime,
  updateRelationshipStage,
} from "@/db/queries";
import {
  evaluateRelationshipStage,
  generateEmotionalState,
  buildSystemPrompt,
  type RelationshipStage,
} from "@/services/ai/personality";

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

  const messageCount = await countConversationMessages(conversationId);

  const daysActive = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(conversation.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const currentStage = (conversation.relationshipStage ??
    "curiosity") as RelationshipStage;

  const stageResult = evaluateRelationshipStage({
    messageCount,
    daysActive,
    currentStage,
  });

  if (stageResult.advanced) {
    await updateRelationshipStage(conversationId, stageResult.stage);
  }

  const lastMessageDate = await getLastMessageTime(conversationId);
  const hoursSinceLastMessage = lastMessageDate
    ? (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60)
    : null;

  const emotionalResult = generateEmotionalState({
    relationshipStage: stageResult.stage,
    messageCount,
    hoursSinceLastMessage,
    daysActive,
  });

  const systemPrompt = buildSystemPrompt({
    relationshipStage: stageResult.stage,
    emotionalState: emotionalResult.state,
    emotionalIntensity: emotionalResult.intensity,
  });

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-emotional-state": emotionalResult.state,
      "x-relationship-stage": stageResult.stage,
      "x-stage-advanced": stageResult.advanced ? "true" : "false",
    },
  });
}
