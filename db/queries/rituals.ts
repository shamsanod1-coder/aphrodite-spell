import { db } from "@/db";
import { relationshipRituals } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type Ritual = typeof relationshipRituals.$inferSelect;

export interface CreateRitualInput {
  userId: string;
  ritualType: "daily" | "relationship" | "emotional";
  ritualContext: Record<string, unknown>;
  frequencyScore?: number;
}

export async function createRitual(input: CreateRitualInput): Promise<Ritual> {
  const [created] = await db
    .insert(relationshipRituals)
    .values({
      userId: input.userId,
      ritualType: input.ritualType,
      ritualContext: input.ritualContext,
      frequencyScore: input.frequencyScore ?? 0.5,
    })
    .returning();
  return created;
}

export async function getUserRituals(
  userId: string,
  ritualType?: "daily" | "relationship" | "emotional"
): Promise<Ritual[]> {
  const conditions = [eq(relationshipRituals.userId, userId)];
  if (ritualType) {
    conditions.push(eq(relationshipRituals.ritualType, ritualType));
  }

  return db
    .select()
    .from(relationshipRituals)
    .where(and(...conditions))
    .orderBy(desc(relationshipRituals.frequencyScore));
}

export async function getRitual(
  id: string,
  userId: string
): Promise<Ritual | null> {
  const [row] = await db
    .select()
    .from(relationshipRituals)
    .where(
      and(
        eq(relationshipRituals.id, id),
        eq(relationshipRituals.userId, userId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function updateRitualTriggered(ritualId: string): Promise<void> {
  await db
    .update(relationshipRituals)
    .set({ lastTriggeredAt: new Date() })
    .where(eq(relationshipRituals.id, ritualId));
}

export async function updateRitualFrequency(
  ritualId: string,
  newFrequency: number
): Promise<void> {
  await db
    .update(relationshipRituals)
    .set({ frequencyScore: Math.max(0, Math.min(1, newFrequency)) })
    .where(eq(relationshipRituals.id, ritualId));
}

export async function getRecentlyTriggeredRituals(
  userId: string,
  withinHours: number = 24
): Promise<Ritual[]> {
  return db
    .select()
    .from(relationshipRituals)
    .where(
      and(
        eq(relationshipRituals.userId, userId),
        sql`${relationshipRituals.lastTriggeredAt} > NOW() - INTERVAL '${sql.raw(String(withinHours))} hours'`
      )
    )
    .orderBy(desc(relationshipRituals.lastTriggeredAt));
}

export async function countUserRituals(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(relationshipRituals)
    .where(eq(relationshipRituals.userId, userId));
  return result.count;
}
