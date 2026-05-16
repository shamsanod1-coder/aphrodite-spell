import { db } from "@/db";
import { dailyUsage } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { UsageStatus } from "../types";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyUsage(userId: string): Promise<number> {
  const today = getTodayDateString();
  const [row] = await db
    .select({ messageCount: dailyUsage.messageCount })
    .from(dailyUsage)
    .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, today)))
    .limit(1);
  return row?.messageCount ?? 0;
}

export async function incrementDailyUsage(userId: string): Promise<void> {
  const today = getTodayDateString();
  await db
    .insert(dailyUsage)
    .values({ userId, date: today, messageCount: 1 })
    .onConflictDoUpdate({
      target: [dailyUsage.userId, dailyUsage.date],
      set: {
        messageCount: sql`${dailyUsage.messageCount} + 1`,
      },
    });
}

export async function getUsageStatus(
  userId: string,
  limit: number
): Promise<UsageStatus> {
  const messageCount = await getDailyUsage(userId);
  const remaining = Math.max(0, limit - messageCount);
  return {
    messageCount,
    limit,
    remaining,
    isLimited: limit !== Infinity && messageCount >= limit,
  };
}
