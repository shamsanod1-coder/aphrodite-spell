import posthog from "posthog-js";

export const AnalyticsEvents = {
  APP_OPEN: "app_open",
  AUTH_STARTED: "auth_started",
  AUTH_COMPLETED: "auth_completed",
  GUEST_CREATED: "guest_created",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  ROUTE_CHANGE: "route_change",
  CONVERSATION_STARTED: "conversation_started",
  MESSAGE_SENT: "message_sent",
  MESSAGE_RECEIVED: "message_received",
  MESSAGE_RETRY: "message_retry",
  CHAT_ERROR: "chat_error",
  EMOTIONAL_CALLBACK_USED: "emotional_callback_used",
  RELATIONSHIP_STAGE_ADVANCED: "relationship_stage_advanced",
  EMOTIONAL_STATE_SHIFT: "emotional_state_shift",
  ATTACHMENT_SIGNAL_DETECTED: "attachment_signal_detected",
  MEMORY_EXTRACTED: "memory_extracted",
  MEMORY_RETRIEVED: "memory_retrieved",
  MEMORY_DECAYED: "memory_decayed",
  RITUAL_TRIGGERED: "ritual_triggered",
  RITUAL_PERSISTED: "ritual_persisted",
  INACTIVITY_DETECTED: "inactivity_detected",
  REENGAGEMENT_GENERATED: "reengagement_generated",
  NOTIFICATION_SCHEDULED: "notification_scheduled",
  DELAYED_RESPONSE_TRIGGERED: "delayed_response_triggered",
  AVAILABILITY_STATE_CHANGED: "availability_state_changed",
  WITHDRAWAL_EVENT: "withdrawal_event",
  USER_RETURN_AFTER_DELAY: "user_return_after_delay",
  COOLDOWN_INTERRUPTED: "cooldown_interrupted",
} as const;

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export function trackEvent(event: EventName, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function trackAppOpen() {
  trackEvent(AnalyticsEvents.APP_OPEN);
}

export function trackAuthStarted(method: "magic_link" | "anonymous") {
  trackEvent(AnalyticsEvents.AUTH_STARTED, { method });
}

export function trackAuthCompleted(method: "magic_link" | "anonymous") {
  trackEvent(AnalyticsEvents.AUTH_COMPLETED, { method });
}

export function trackGuestCreated() {
  trackEvent(AnalyticsEvents.GUEST_CREATED);
}

export function trackSessionStart() {
  trackEvent(AnalyticsEvents.SESSION_START);
}

export function trackSessionEnd() {
  trackEvent(AnalyticsEvents.SESSION_END);
}

export function trackEmotionalCallbackUsed(properties?: Record<string, unknown>) {
  trackEvent(AnalyticsEvents.EMOTIONAL_CALLBACK_USED, properties);
}

export function trackRelationshipStageAdvanced(
  previousStage: string,
  newStage: string,
  conversationId: string
) {
  trackEvent(AnalyticsEvents.RELATIONSHIP_STAGE_ADVANCED, {
    previous_stage: previousStage,
    new_stage: newStage,
    conversation_id: conversationId,
  });
}

export function trackEmotionalStateShift(
  emotionalState: string,
  intensity: string,
  conversationId: string
) {
  trackEvent(AnalyticsEvents.EMOTIONAL_STATE_SHIFT, {
    emotional_state: emotionalState,
    intensity,
    conversation_id: conversationId,
  });
}

export function trackAttachmentSignalDetected(properties?: Record<string, unknown>) {
  trackEvent(AnalyticsEvents.ATTACHMENT_SIGNAL_DETECTED, properties);
}

export function trackRitualTriggered(
  ritualType: string,
  subtype: string,
  relationshipStage: string
) {
  trackEvent(AnalyticsEvents.RITUAL_TRIGGERED, {
    ritual_type: ritualType,
    subtype,
    relationship_stage: relationshipStage,
  });
}

export function trackRitualPersisted(ritualId: string, ritualType: string) {
  trackEvent(AnalyticsEvents.RITUAL_PERSISTED, {
    ritual_id: ritualId,
    ritual_type: ritualType,
  });
}

export function trackInactivityDetected(
  classification: string,
  severity: string,
  hoursSinceLastMessage: number | null
) {
  trackEvent(AnalyticsEvents.INACTIVITY_DETECTED, {
    classification,
    severity,
    hours_since_last_message: hoursSinceLastMessage,
  });
}

export function trackReengagementGenerated(
  classification: string,
  style: string,
  includesMemoryCallback: boolean
) {
  trackEvent(AnalyticsEvents.REENGAGEMENT_GENERATED, {
    classification,
    style,
    includes_memory_callback: includesMemoryCallback,
  });
}

export function trackNotificationScheduled(
  type: string,
  delaySeconds: number
) {
  trackEvent(AnalyticsEvents.NOTIFICATION_SCHEDULED, {
    notification_type: type,
    delay_seconds: delaySeconds,
  });
}

export function trackDelayedResponseTriggered(
  availabilityState: string,
  delayMs: number,
  pacingStyle: string
) {
  trackEvent(AnalyticsEvents.DELAYED_RESPONSE_TRIGGERED, {
    availability_state: availabilityState,
    delay_ms: delayMs,
    pacing_style: pacingStyle,
  });
}

export function trackAvailabilityStateChanged(
  previousState: string | null,
  newState: string,
  reason: string,
  relationshipStage: string
) {
  trackEvent(AnalyticsEvents.AVAILABILITY_STATE_CHANGED, {
    previous_state: previousState,
    new_state: newState,
    reason,
    relationship_stage: relationshipStage,
  });
}

export function trackWithdrawalEvent(
  warmthReduction: string,
  reason: string,
  relationshipStage: string
) {
  trackEvent(AnalyticsEvents.WITHDRAWAL_EVENT, {
    warmth_reduction: warmthReduction,
    reason,
    relationship_stage: relationshipStage,
  });
}

export function trackUserReturnAfterDelay(
  delayHours: number,
  availabilityState: string
) {
  trackEvent(AnalyticsEvents.USER_RETURN_AFTER_DELAY, {
    delay_hours: delayHours,
    availability_state_on_return: availabilityState,
  });
}

export function trackCooldownInterrupted(
  reason: string,
  cooldownType: string
) {
  trackEvent(AnalyticsEvents.COOLDOWN_INTERRUPTED, {
    reason,
    cooldown_type: cooldownType,
  });
}
