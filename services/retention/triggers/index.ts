import type { RelationshipStage, EmotionalState } from "@/services/ai/personality";
import type { RetrievedMemory } from "@/services/memory";
import { generateRitualTrigger, STAGE_MAX_RITUALS } from "../rituals";
import { detectInactivityWindow } from "../inactivity";
import { generateReengagementMessage } from "../reengagement";
import { scheduleNotification, checkCadence } from "../cadence";
import {
  createRitual,
  getUserRituals,
  updateRitualTriggered,
  countUserRituals,
  getLastDeliveredNotification,
} from "@/db/queries";
import type {
  RitualTriggerInput,
  ActivityTiming,
  InteractionCadence,
} from "../rituals/types";

export interface RetentionEvaluationInput {
  userId: string;
  relationshipStage: RelationshipStage;
  emotionalState: EmotionalState;
  messageCount: number;
  daysActive: number;
  lastMessageAt: Date | null;
  averageSessionGapHours: number;
  memories: RetrievedMemory[];
  timezone?: string;
}

export interface RetentionEvaluationResult {
  ritualTriggered: boolean;
  reengagementTriggered: boolean;
  ritualContext?: {
    type: string;
    subtype: string;
    description: string;
  };
  reengagementMessage?: {
    content: string;
    tone: string;
    style: string;
  };
  notificationScheduled: boolean;
}

function computeHoursSince(date: Date | null): number | null {
  if (!date) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function getCurrentHour(timezone?: string): number {
  if (timezone) {
    try {
      const formatted = new Date().toLocaleString("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
      });
      return parseInt(formatted, 10);
    } catch {
      return new Date().getUTCHours();
    }
  }
  return new Date().getUTCHours();
}

export async function evaluateRetention(
  input: RetentionEvaluationInput
): Promise<RetentionEvaluationResult> {
  const result: RetentionEvaluationResult = {
    ritualTriggered: false,
    reengagementTriggered: false,
    notificationScheduled: false,
  };

  try {
    const hoursSinceLastMessage = computeHoursSince(input.lastMessageAt);
    const currentHour = getCurrentHour(input.timezone);

    const activityTiming: ActivityTiming = {
      lastMessageAt: input.lastMessageAt,
      hoursSinceLastMessage,
      typicalActiveHours: [],
      currentHour,
    };

    const interactionCadence: InteractionCadence = {
      messageCount: input.messageCount,
      daysActive: input.daysActive,
      averageMessagesPerDay:
        input.daysActive > 0 ? input.messageCount / input.daysActive : 0,
      averageSessionGapHours: input.averageSessionGapHours,
    };

    // --- Ritual evaluation ---
    const ritualInput: RitualTriggerInput = {
      relationshipStage: input.relationshipStage,
      activityTiming,
      priorInteractionCadence: interactionCadence,
      emotionalState: input.emotionalState,
      timezone: input.timezone,
    };

    const ritualTrigger = generateRitualTrigger(ritualInput);

    if (ritualTrigger.shouldTrigger) {
      const existingCount = await countUserRituals(input.userId);
      const maxRituals = STAGE_MAX_RITUALS[input.relationshipStage];

      if (existingCount < maxRituals) {
        const ritual = await createRitual({
          userId: input.userId,
          ritualType: ritualTrigger.ritualType,
          ritualContext: ritualTrigger.context as unknown as Record<
            string,
            unknown
          >,
        });

        await updateRitualTriggered(ritual.id);

        result.ritualTriggered = true;
        result.ritualContext = {
          type: ritualTrigger.ritualType,
          subtype: ritualTrigger.subtype,
          description: ritualTrigger.context.description,
        };

        const cadence = await checkCadence(input.userId, input.timezone);
        if (cadence.allowed) {
          const notification = await scheduleNotification({
            userId: input.userId,
            type: "ritual",
            payload: {
              ritualId: ritual.id,
              ritualType: ritualTrigger.ritualType,
              subtype: ritualTrigger.subtype,
              description: ritualTrigger.context.description,
            },
            delaySeconds: ritualTrigger.suggestedDelay,
            timezone: input.timezone,
          });
          result.notificationScheduled = !!notification;
        }
      }
    }

    // --- Inactivity + re-engagement evaluation ---
    const existingRituals = await getUserRituals(input.userId);
    const missedRitualCount = existingRituals.filter((r) => {
      if (!r.lastTriggeredAt) return false;
      const hoursSince =
        (Date.now() - r.lastTriggeredAt.getTime()) / (1000 * 60 * 60);
      return hoursSince > 24;
    }).length;

    const inactivityResult = detectInactivityWindow({
      hoursSinceLastMessage,
      averageSessionGapHours: input.averageSessionGapHours,
      missedRitualCount,
      recentMessageDepth: Math.min(input.messageCount, 10),
      relationshipStage: input.relationshipStage,
      messageCount: input.messageCount,
    });

    if (inactivityResult.isInactive) {
      const lastReengagement = await getLastDeliveredNotification(
        input.userId,
        "reengagement"
      );

      const hoursSinceLastReengagement = lastReengagement?.deliveredAt
        ? computeHoursSince(lastReengagement.deliveredAt)
        : null;

      if (
        !hoursSinceLastReengagement ||
        hoursSinceLastReengagement > 12
      ) {
        const reengagement = generateReengagementMessage({
          inactivityClassification: inactivityResult.classification,
          absenceSeverity: inactivityResult.absenceSeverity,
          relationshipStage: input.relationshipStage,
          memories: input.memories,
          hoursSinceLastMessage,
        });

        result.reengagementTriggered = true;
        result.reengagementMessage = {
          content: reengagement.content,
          tone: reengagement.tone,
          style: reengagement.style,
        };

        const cadence = await checkCadence(input.userId, input.timezone);
        if (cadence.allowed) {
          const notification = await scheduleNotification({
            userId: input.userId,
            type: "reengagement",
            payload: {
              classification: inactivityResult.classification,
              severity: inactivityResult.absenceSeverity,
              content: reengagement.content,
              style: reengagement.style,
            },
            timezone: input.timezone,
          });
          result.notificationScheduled =
            result.notificationScheduled || !!notification;
        }
      }
    }
  } catch (error) {
    console.error("[retention] evaluation failed:", error);
  }

  return result;
}
