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
