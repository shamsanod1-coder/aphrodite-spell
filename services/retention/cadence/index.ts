import {
  createNotification,
  getPendingNotifications,
  getRecentDeliveredCount,
  isInCooldown,
  cancelPendingNotifications,
  markNotificationDelivered,
} from "@/db/queries";
import type { Notification } from "@/db/queries";

const MAX_DAILY_NOTIFICATIONS = 3;
const MIN_COOLDOWN_HOURS = 4;
const QUIET_HOURS_START = 23;
const QUIET_HOURS_END = 7;

export interface ScheduleInput {
  userId: string;
  type: "ritual" | "reengagement";
  payload: Record<string, unknown>;
  delaySeconds?: number;
  timezone?: string;
}

export interface CadenceCheck {
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: Date;
}

function isQuietHours(timezone?: string): boolean {
  const now = new Date();
  let hour: number;

  if (timezone) {
    try {
      const formatted = now.toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      });
      hour = parseInt(formatted, 10);
    } catch {
      hour = now.getUTCHours();
    }
  } else {
    hour = now.getUTCHours();
  }

  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

export async function checkCadence(
  userId: string,
  timezone?: string
): Promise<CadenceCheck> {
  if (isQuietHours(timezone)) {
    const nextMorning = new Date();
    nextMorning.setUTCHours(QUIET_HOURS_END, 0, 0, 0);
    if (nextMorning <= new Date()) {
      nextMorning.setUTCDate(nextMorning.getUTCDate() + 1);
    }
    return {
      allowed: false,
      reason: "quiet_hours",
      nextAllowedAt: nextMorning,
    };
  }

  const inCooldown = await isInCooldown(userId);
  if (inCooldown) {
    return {
      allowed: false,
      reason: "cooldown_active",
    };
  }

  const recentCount = await getRecentDeliveredCount(userId, 24);
  if (recentCount >= MAX_DAILY_NOTIFICATIONS) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
    };
  }

  return { allowed: true };
}

export async function scheduleNotification(
  input: ScheduleInput
): Promise<Notification | null> {
  const cadence = await checkCadence(input.userId, input.timezone);

  if (!cadence.allowed) {
    return null;
  }

  const scheduledAt = new Date();
  if (input.delaySeconds) {
    scheduledAt.setSeconds(scheduledAt.getSeconds() + input.delaySeconds);
  }

  const cooldownUntil = new Date(
    scheduledAt.getTime() + MIN_COOLDOWN_HOURS * 60 * 60 * 1000
  );

  return createNotification({
    userId: input.userId,
    type: input.type,
    payload: input.payload,
    scheduledAt,
    cooldownUntil,
  });
}

export async function deliverPendingNotifications(
  userId: string
): Promise<Notification[]> {
  const pending = await getPendingNotifications(userId);
  const delivered: Notification[] = [];

  for (const notification of pending) {
    if (notification.cooldownUntil && notification.cooldownUntil > new Date()) {
      continue;
    }

    await markNotificationDelivered(notification.id);
    delivered.push(notification);
  }

  return delivered;
}

export async function cancelUserNotifications(
  userId: string,
  type?: "ritual" | "reengagement"
): Promise<number> {
  return cancelPendingNotifications(userId, type);
}
