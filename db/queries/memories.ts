import { db } from "@/db";
import { memories } from "@/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";

export type Memory = typeof memories.$inferSelect;

export interface CreateMemoryInput {
  userId: string;
  conversationId: string;
  content: string;
  memoryType: string;
  emotionalWeight: number;
  salienceScore: number;
  embedding: number[] | null;
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const [created] = await db
    .insert(memories)
    .values({
      userId: input.userId,
      conversationId: input.conversationId,
      content: input.content,
      memoryType: input.memoryType as Memory["memoryType"],
      emotionalWeight: input.emotionalWeight,
      salienceScore: input.salienceScore,
      embedding: input.embedding,
    })
    .returning();
  return created;
}

export async function createMemories(
  inputs: CreateMemoryInput[]
): Promise<Memory[]> {
  if (inputs.length === 0) return [];
  const rows = await db
    .insert(memories)
    .values(
      inputs.map((input) => ({
        userId: input.userId,
        conversationId: input.conversationId,
        content: input.content,
        memoryType: input.memoryType as Memory["memoryType"],
        emotionalWeight: input.emotionalWeight,
        salienceScore: input.salienceScore,
        embedding: input.embedding,
      }))
    )
    .returning();
  return rows;
}

export async function findSimilarMemories(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5,
  minSalience: number = 0.1
): Promise<(Memory & { similarity: number })[]> {
  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const rows = await db
    .select({
      id: memories.id,
      userId: memories.userId,
      conversationId: memories.conversationId,
      content: memories.content,
      memoryType: memories.memoryType,
      emotionalWeight: memories.emotionalWeight,
      salienceScore: memories.salienceScore,
      embedding: memories.embedding,
      createdAt: memories.createdAt,
      lastReferencedAt: memories.lastReferencedAt,
      similarity: sql<number>`1 - (${memories.embedding} <=> ${vectorStr}::vector)`,
    })
    .from(memories)
    .where(
      and(
        eq(memories.userId, userId),
        gt(memories.salienceScore, minSalience)
      )
    )
    .orderBy(sql`${memories.embedding} <=> ${vectorStr}::vector`)
    .limit(limit);
  return rows as (Memory & { similarity: number })[];
}

export async function getUserMemories(
  userId: string,
  limit: number = 50
): Promise<Memory[]> {
  return db
    .select()
    .from(memories)
    .where(eq(memories.userId, userId))
    .orderBy(desc(memories.salienceScore))
    .limit(limit);
}

export async function updateMemoryReference(memoryId: string): Promise<void> {
  await db
    .update(memories)
    .set({ lastReferencedAt: new Date() })
    .where(eq(memories.id, memoryId));
}

export async function updateMemorySalience(
  memoryId: string,
  newSalience: number
): Promise<void> {
  await db
    .update(memories)
    .set({ salienceScore: Math.max(0, Math.min(1, newSalience)) })
    .where(eq(memories.id, memoryId));
}

export async function deleteStaleMemories(
  userId: string,
  minSalience: number = 0.05
): Promise<number> {
  const deleted = await db
    .delete(memories)
    .where(
      and(
        eq(memories.userId, userId),
        sql`${memories.salienceScore} <= ${minSalience}`,
        sql`${memories.lastReferencedAt} IS NULL OR ${memories.lastReferencedAt} < NOW() - INTERVAL '30 days'`
      )
    )
    .returning({ id: memories.id });
  return deleted.length;
}
