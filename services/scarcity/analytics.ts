import type { AvailabilityState } from "./availability/types";

export interface ScarcityAnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
}

export function buildDelayedResponseEvent(
  availabilityState: AvailabilityState,
  delayMs: number,
  pacingStyle: string
): ScarcityAnalyticsEvent {
  return {
    event: "delayed_response_triggered",
    properties: {
      availability_state: availabilityState,
      delay_ms: delayMs,
      pacing_style: pacingStyle,
    },
  };
}

export function buildAvailabilityStateChangedEvent(
  previousState: AvailabilityState | null,
  newState: AvailabilityState,
  reason: string,
  relationshipStage: string
): ScarcityAnalyticsEvent {
  return {
    event: "availability_state_changed",
    properties: {
      previous_state: previousState,
      new_state: newState,
      reason,
      relationship_stage: relationshipStage,
    },
  };
}

export function buildWithdrawalEvent(
  warmthReduction: string,
  reason: string,
  relationshipStage: string
): ScarcityAnalyticsEvent {
  return {
    event: "withdrawal_event",
    properties: {
      warmth_reduction: warmthReduction,
      reason,
      relationship_stage: relationshipStage,
    },
  };
}

export function buildUserReturnAfterDelayEvent(
  delayHours: number,
  availabilityStateOnReturn: AvailabilityState
): ScarcityAnalyticsEvent {
  return {
    event: "user_return_after_delay",
    properties: {
      delay_hours: delayHours,
      availability_state_on_return: availabilityStateOnReturn,
    },
  };
}

export function buildCooldownInterruptedEvent(
  reason: string,
  cooldownType: string
): ScarcityAnalyticsEvent {
  return {
    event: "cooldown_interrupted",
    properties: {
      reason,
      cooldown_type: cooldownType,
    },
  };
}
