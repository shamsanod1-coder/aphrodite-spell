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
import {
  retrieveRelevantMemories,
  formatMemoriesForPrompt,
  extractMemories,
  storeMemories,
} from "@/services/memory";

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

  // Retrieve emotionally relevant memories for prompt injection
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .pop();
  const lastUserText = lastUserMessage?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";

  let memoriesBlock = "";
  if (lastUserText && process.env.OPENAI_API_KEY) {
    try {
      const relevantMemories = await retrieveRelevantMemories(
        session.user.id,
        lastUserText
      );
      memoriesBlock = formatMemoriesForPrompt(relevantMemories);
    } catch {
      // Memory retrieval failure is non-fatal
    }
  }

  const systemPrompt = buildSystemPrompt({
    relationshipStage: stageResult.stage,
    emotionalState: emotionalResult.state,
    emotionalIntensity: emotionalResult.intensity,
    memoriesBlock: memoriesBlock || undefined,
  });

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async () => {
      // Fire-and-forget: extract emotional memories from conversation
      if (!process.env.OPENAI_API_KEY) return;
      try {
        const recentMessages = messages.slice(-10).map((m) => ({
          role: m.role,
          content:
            m.parts
              ?.filter(
                (p): p is { type: "text"; text: string } => p.type === "text"
              )
              .map((p) => p.text)
              .join("") ?? "",
        }));

        const { memories: extracted } = await extractMemories(
          recentMessages,
          stageResult.stage
        );

        if (extracted.length > 0) {
          await storeMemories(session.user.id, conversationId, extracted);
        }
      } catch {
        // Extraction failure is non-fatal
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-emotional-state": emotionalResult.state,
      "x-relationship-stage": stageResult.stage,
      "x-stage-advanced": stageResult.advanced ? "true" : "false",
    },
  });
}
