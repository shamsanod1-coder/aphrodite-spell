import { db } from "@/db";
import { notificationQueue } from "@/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

export type Notification = typeof notificationQueue.$inferSelect;

export interface CreateNotificationInput {
  userId: string;
  type: "ritual" | "reengagement";
  payload: Record<string, unknown>;
  scheduledAt: Date;
  cooldownUntil?: Date;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const [created] = await db
    .insert(notificationQueue)
    .values({
      userId: input.userId,
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt,
      cooldownUntil: input.cooldownUntil ?? null,
    })
    .returning();
  return created;
}

export async function getPendingNotifications(
  userId: string,
  type?: "ritual" | "reengagement"
): Promise<Notification[]> {
  const conditions = [
    eq(notificationQueue.userId, userId),
    isNull(notificationQueue.deliveredAt),
    isNull(notificationQueue.cancelledAt),
    sql`${notificationQueue.scheduledAt} <= NOW()`,
  ];

  if (type) {
    conditions.push(eq(notificationQueue.type, type));
  }

  return db
    .select()
    .from(notificationQueue)
    .where(and(...conditions))
    .orderBy(notificationQueue.scheduledAt);
}

export async function markNotificationDelivered(
  notificationId: string
): Promise<void> {
  await db
    .update(notificationQueue)
    .set({ deliveredAt: new Date() })
    .where(eq(notificationQueue.id, notificationId));
}

export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await db
    .update(notificationQueue)
    .set({ cancelledAt: new Date() })
    .where(eq(notificationQueue.id, notificationId));
}

export async function cancelPendingNotifications(
  userId: string,
  type?: "ritual" | "reengagement"
): Promise<number> {
  const conditions = [
    eq(notificationQueue.userId, userId),
    isNull(notificationQueue.deliveredAt),
    isNull(notificationQueue.cancelledAt),
  ];

  if (type) {
    conditions.push(eq(notificationQueue.type, type));
  }

  const cancelled = await db
    .update(notificationQueue)
    .set({ cancelledAt: new Date() })
    .where(and(...conditions))
    .returning({ id: notificationQueue.id });
  return cancelled.length;
}

export async function getRecentDeliveredCount(
  userId: string,
  withinHours: number = 24
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.userId, userId),
        sql`${notificationQueue.deliveredAt} > NOW() - INTERVAL '${sql.raw(String(withinHours))} hours'`
      )
    );
  return result.count;
}

export async function isInCooldown(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: notificationQueue.id })
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.userId, userId),
        sql`${notificationQueue.cooldownUntil} > NOW()`
      )
    )
    .limit(1);
  return !!row;
}

export async function getLastDeliveredNotification(
  userId: string,
  type?: "ritual" | "reengagement"
): Promise<Notification | null> {
  const conditions = [
    eq(notificationQueue.userId, userId),
    sql`${notificationQueue.deliveredAt} IS NOT NULL`,
  ];

  if (type) {
    conditions.push(eq(notificationQueue.type, type));
  }

  const [row] = await db
    .select()
    .from(notificationQueue)
    .where(and(...conditions))
    .orderBy(desc(notificationQueue.deliveredAt))
    .limit(1);
  return row ?? null;
}
