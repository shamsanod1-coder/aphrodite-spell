export {
  fetchEmotionalProfile,
  evolveProfile,
  profileToData,
} from "./profiling";
export type {
  EmotionalProfileData,
  ProfileUpdateSignals,
} from "./profiling";
export type {
  AttachmentSignal,
  AttachmentSignalType,
  AttachmentStyle,
  ChurnRiskState,
  AdaptiveModifiers,
  ChurnPredictionInput,
} from "./profiling/types";

export {
  detectAttachmentSignals,
  computeEmotionalDepth,
  computeAverageMessageLength,
} from "./behavior-learning";

export {
  computeAdaptiveModifiers,
  getAdaptationPromptBlock,
} from "./preferences";

export {
  predictChurnRisk,
  evaluateAndUpdateChurnRisk,
} from "./engagement-modeling";
