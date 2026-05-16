import { db } from "@/db";
import { userEmotionalProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type EmotionalProfile = typeof userEmotionalProfiles.$inferSelect;

export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "disorganized";
export type ChurnRisk = "healthy" | "drifting" | "disengaging" | "high-risk";

export interface ProfileScoreUpdates {
  warmthPreference?: number;
  teasingPreference?: number;
  ritualEngagementScore?: number;
  dominancePreference?: number;
  emotionalOpennessScore?: number;
  verbosityPreference?: number;
  reassuranceSeekingScore?: number;
}

const SMOOTHING_ALPHA = 0.08;

function smoothValue(current: number, target: number): number {
  return current * (1 - SMOOTHING_ALPHA) + target * SMOOTHING_ALPHA;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export async function getEmotionalProfile(
  userId: string
): Promise<EmotionalProfile | null> {
  const [row] = await db
    .select()
    .from(userEmotionalProfiles)
    .where(eq(userEmotionalProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getOrCreateEmotionalProfile(
  userId: string
): Promise<EmotionalProfile> {
  const existing = await getEmotionalProfile(userId);
  if (existing) return existing;

  const [created] = await db
    .insert(userEmotionalProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [fallback] = await db
    .select()
    .from(userEmotionalProfiles)
    .where(eq(userEmotionalProfiles.userId, userId))
    .limit(1);
  return fallback;
}

export async function updateProfileScores(
  userId: string,
  updates: ProfileScoreUpdates
): Promise<EmotionalProfile> {
  const current = await getOrCreateEmotionalProfile(userId);

  const newValues: Record<string, number | Date> = {
    lastUpdatedAt: new Date(),
  };

  if (updates.warmthPreference !== undefined) {
    newValues.warmthPreference = clamp(
      smoothValue(current.warmthPreference, updates.warmthPreference)
    );
  }
  if (updates.teasingPreference !== undefined) {
    newValues.teasingPreference = clamp(
      smoothValue(current.teasingPreference, updates.teasingPreference)
    );
  }
  if (updates.ritualEngagementScore !== undefined) {
    newValues.ritualEngagementScore = clamp(
      smoothValue(current.ritualEngagementScore, updates.ritualEngagementScore)
    );
  }
  if (updates.dominancePreference !== undefined) {
    newValues.dominancePreference = clamp(
      smoothValue(current.dominancePreference, updates.dominancePreference)
    );
  }
  if (updates.emotionalOpennessScore !== undefined) {
    newValues.emotionalOpennessScore = clamp(
      smoothValue(current.emotionalOpennessScore, updates.emotionalOpennessScore)
    );
  }
  if (updates.verbosityPreference !== undefined) {
    newValues.verbosityPreference = clamp(
      smoothValue(current.verbosityPreference, updates.verbosityPreference)
    );
  }
  if (updates.reassuranceSeekingScore !== undefined) {
    newValues.reassuranceSeekingScore = clamp(
      smoothValue(
        current.reassuranceSeekingScore,
        updates.reassuranceSeekingScore
      )
    );
  }

  const [updated] = await db
    .update(userEmotionalProfiles)
    .set(newValues)
    .where(eq(userEmotionalProfiles.userId, userId))
    .returning();
  return updated;
}

export async function updateAttachmentStyle(
  userId: string,
  style: AttachmentStyle
): Promise<void> {
  await db
    .update(userEmotionalProfiles)
    .set({ attachmentStyle: style, lastUpdatedAt: new Date() })
    .where(eq(userEmotionalProfiles.userId, userId));
}

export async function updateChurnRisk(
  userId: string,
  risk: ChurnRisk
): Promise<void> {
  await db
    .update(userEmotionalProfiles)
    .set({ churnRisk: risk, lastUpdatedAt: new Date() })
    .where(eq(userEmotionalProfiles.userId, userId));
}
