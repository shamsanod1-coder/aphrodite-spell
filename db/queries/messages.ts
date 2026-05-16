import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and, asc, lt } from "drizzle-orm";

export type Message = typeof messages.$inferSelect;

export interface CreateMessageInput {
  conversationId: string;
  senderType: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown> | null;
  tokenCount?: number | null;
}

export async function createMessage(
  input: CreateMessageInput
): Promise<Message> {
  const [saved] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      senderType: input.senderType,
      content: input.content,
      metadata: input.metadata ?? null,
      tokenCount: input.tokenCount ?? null,
    })
    .returning();

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, input.conversationId));

  return saved;
}

export interface PaginateMessagesOptions {
  conversationId: string;
  limit?: number;
  before?: string;
}

export async function paginateMessages(
  options: PaginateMessagesOptions
): Promise<Message[]> {
  const { conversationId, limit = 50, before } = options;

  const conditions = [eq(messages.conversationId, conversationId)];
  if (before) {
    conditions.push(lt(messages.createdAt, new Date(before)));
  }

  return db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function updateMessageContent(
  messageId: string,
  content: string
): Promise<Message> {
  const [updated] = await db
    .update(messages)
    .set({ content })
    .where(eq(messages.id, messageId))
    .returning();
  return updated;
}

export async function verifyMessageOwnership(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const [conversation] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);
  return !!conversation;
}
