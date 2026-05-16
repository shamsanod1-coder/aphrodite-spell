import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type Conversation = typeof conversations.$inferSelect;

export async function createConversation(
  userId: string
): Promise<Conversation> {
  const [created] = await db
    .insert(conversations)
    .values({ userId })
    .returning();
  return created;
}

export async function getConversation(
  id: string,
  userId: string
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return row ?? null;
}

export interface ListConversationsOptions {
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export async function listUserConversations(
  userId: string,
  options: ListConversationsOptions = {}
): Promise<Conversation[]> {
  const { includeArchived = false, limit = 50, offset = 0 } = options;

  const conditions = [eq(conversations.userId, userId)];
  if (!includeArchived) {
    conditions.push(eq(conversations.archived, false));
  }

  return db
    .select()
    .from(conversations)
    .where(and(...conditions))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function getOrCreateConversation(
  userId: string
): Promise<Conversation> {
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, userId),
        eq(conversations.archived, false)
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(1);

  if (existing) return existing;

  return createConversation(userId);
}

export async function transferConversations(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await db
    .update(conversations)
    .set({ userId: toUserId })
    .where(eq(conversations.userId, fromUserId));
}

export async function updateRelationshipStage(
  conversationId: string,
  stage: string
): Promise<void> {
  await db
    .update(conversations)
    .set({ relationshipStage: stage, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

export async function countConversationMessages(
  conversationId: string
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  return result.count;
}

export async function getLastMessageTime(
  conversationId: string
): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}
