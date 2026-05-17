import { db } from "@/db";
import { cachedEmotionalStates } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export type CachedEmotionalState = typeof cachedEmotionalStates.$inferSelect;

export interface CacheStateInput {
  conversationId: string;
  userId: string;
  emotionalState: string;
  emotionalIntensity: "low" | "medium" | "high";
  relationshipStage: string;
  availabilityState: string;
  adaptationBlock?: string | null;
  scarcityBlock?: string | null;
  ttlMs?: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCachedState(
  conversationId: string
): Promise<CachedEmotionalState | null> {
  const [row] = await db
    .select()
    .from(cachedEmotionalStates)
    .where(
      and(
        eq(cachedEmotionalStates.conversationId, conversationId),
        gt(cachedEmotionalStates.expiresAt, new Date())
      )
    )
    .limit(1);
  return row ?? null;
}

export async function setCachedState(
  input: CacheStateInput
): Promise<CachedEmotionalState> {
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  // Delete existing cached state for this conversation
  await db
    .delete(cachedEmotionalStates)
    .where(eq(cachedEmotionalStates.conversationId, input.conversationId));

  const [created] = await db
    .insert(cachedEmotionalStates)
    .values({
      conversationId: input.conversationId,
      userId: input.userId,
      emotionalState: input.emotionalState,
      emotionalIntensity: input.emotionalIntensity,
      relationshipStage: input.relationshipStage,
      availabilityState: input.availabilityState,
      adaptationBlock: input.adaptationBlock ?? null,
      scarcityBlock: input.scarcityBlock ?? null,
      expiresAt,
    })
    .returning();
  return created;
}

export async function invalidateCachedState(
  conversationId: string
): Promise<void> {
  await db
    .delete(cachedEmotionalStates)
    .where(eq(cachedEmotionalStates.conversationId, conversationId));
}
