import { db } from "@/db";
import { conversationSummaries } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type ConversationSummary = typeof conversationSummaries.$inferSelect;
export type SummaryType = "rolling" | "emotional_arc" | "milestone" | "ritual";

export interface UpsertSummaryInput {
  conversationId: string;
  summaryType: SummaryType;
  content: string;
  messageRange?: { startIndex: number; endIndex: number };
  tokenCount?: number;
}

export async function getConversationSummary(
  conversationId: string,
  summaryType: SummaryType
): Promise<ConversationSummary | null> {
  const [row] = await db
    .select()
    .from(conversationSummaries)
    .where(
      and(
        eq(conversationSummaries.conversationId, conversationId),
        eq(conversationSummaries.summaryType, summaryType)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function upsertConversationSummary(
  input: UpsertSummaryInput
): Promise<ConversationSummary> {
  const existing = await getConversationSummary(
    input.conversationId,
    input.summaryType
  );

  if (existing) {
    const [updated] = await db
      .update(conversationSummaries)
      .set({
        content: input.content,
        messageRange: input.messageRange ?? null,
        tokenCount: input.tokenCount ?? null,
        updatedAt: new Date(),
      })
      .where(eq(conversationSummaries.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(conversationSummaries)
    .values({
      conversationId: input.conversationId,
      summaryType: input.summaryType,
      content: input.content,
      messageRange: input.messageRange ?? null,
      tokenCount: input.tokenCount ?? null,
    })
    .returning();
  return created;
}

export async function getAllConversationSummaries(
  conversationId: string
): Promise<ConversationSummary[]> {
  return db
    .select()
    .from(conversationSummaries)
    .where(eq(conversationSummaries.conversationId, conversationId));
}
