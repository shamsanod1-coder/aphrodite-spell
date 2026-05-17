export { computeBucket, isUserInRollout } from "./feature-flags";
export { resolveVariant, resolveAllActiveVariants } from "./assignments";
export {
  buildPromptModifier,
  buildExperimentPromptBlock,
} from "./prompt-variants";
export {
  buildExposureEvent,
  buildExperimentProperties,
} from "./analytics";
export { validateExperimentSafety } from "./safety";
export type {
  ExperimentStatus,
  PromptDimension,
  VariantConfig,
  AssignmentResult,
  ExperimentWithVariants,
  SafetyValidationResult,
} from "./types";
export { EXPERIMENT_STATUSES, PROMPT_DIMENSIONS } from "./types";
