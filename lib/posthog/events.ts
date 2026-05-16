import posthog from "posthog-js";

export const AnalyticsEvents = {
  APP_OPEN: "app_open",
  AUTH_STARTED: "auth_started",
  AUTH_COMPLETED: "auth_completed",
  GUEST_CREATED: "guest_created",
  SESSION_START: "session_start",
  SESSION_END: "session_end",
  ROUTE_CHANGE: "route_change",
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
