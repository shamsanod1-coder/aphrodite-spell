export { generateRitualTrigger, STAGE_RITUAL_ELIGIBILITY, STAGE_MAX_RITUALS } from "./rituals";
export { detectInactivityWindow } from "./inactivity";
export { generateReengagementMessage } from "./reengagement";
export {
  checkCadence,
  scheduleNotification,
  deliverPendingNotifications,
  cancelUserNotifications,
} from "./cadence";
export { evaluateRetention } from "./triggers";

export type {
  RitualTriggerInput,
  RitualTrigger,
  RitualType,
  RitualSubtype,
  RitualContext,
  ActivityTiming,
  InteractionCadence,
} from "./rituals/types";

export type {
  InactivityClassification,
  InactivityInput,
  InactivityResult,
} from "./inactivity";

export type {
  ReengagementInput,
  ReengagementMessage,
} from "./reengagement";

export type { ScheduleInput, CadenceCheck } from "./cadence";

export type {
  RetentionEvaluationInput,
  RetentionEvaluationResult,
} from "./triggers";
