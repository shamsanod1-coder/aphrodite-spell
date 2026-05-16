export { generateAvailabilityState } from "./availability";
export {
  AVAILABILITY_STATES,
  STAGE_SCARCITY_ELIGIBILITY,
  STAGE_SCARCITY_INTENSITY,
  DEFAULT_SLEEP_WINDOW,
  type AvailabilityState,
  type AvailabilityInput,
  type AvailabilityResult,
  type SleepWindow,
  type PacingConfig,
  type WithdrawalConfig,
} from "./availability/types";

export { evaluateSleepMode, type SleepModeInput, type SleepModeResult } from "./cooldowns";
export { computePacing, type PacingInput, type PacingResult } from "./pacing";
export {
  evaluateWithdrawal,
  type WithdrawalInput,
  type WithdrawalResult,
} from "./interruptions";
export { validateScarcity, type SafetyInput, type SafetyResult } from "./safety";

export {
  buildDelayedResponseEvent,
  buildAvailabilityStateChangedEvent,
  buildWithdrawalEvent,
  buildUserReturnAfterDelayEvent,
  buildCooldownInterruptedEvent,
  type ScarcityAnalyticsEvent,
} from "./analytics";
