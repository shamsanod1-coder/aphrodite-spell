export const ATTACHMENT_STYLES = [
  "secure",
  "anxious",
  "avoidant",
  "disorganized",
] as const;

export type AttachmentStyle = (typeof ATTACHMENT_STYLES)[number];

export const CHURN_RISK_STATES = [
  "healthy",
  "drifting",
  "disengaging",
  "high-risk",
] as const;

export type ChurnRiskState = (typeof CHURN_RISK_STATES)[number];

export const ATTACHMENT_SIGNAL_TYPES = [
  "reassurance_seeking",
  "jealousy_prompt",
  "emotional_checking",
  "repeated_ritual_engagement",
  "daily_dependency_pattern",
  "emotional_disclosure",
  "apology_behavior",
] as const;

export type AttachmentSignalType = (typeof ATTACHMENT_SIGNAL_TYPES)[number];

export interface EmotionalProfileData {
  attachmentStyle: AttachmentStyle;
  warmthPreference: number;
  teasingPreference: number;
  ritualEngagementScore: number;
  dominancePreference: number;
  emotionalOpennessScore: number;
  verbosityPreference: number;
  reassuranceSeekingScore: number;
  churnRisk: ChurnRiskState;
}

export interface AttachmentSignal {
  type: AttachmentSignalType;
  confidence: number;
}

export interface ProfileUpdateSignals {
  attachmentSignals: AttachmentSignal[];
  averageMessageLength: number;
  emotionalDepth: number;
  ritualParticipation: boolean;
  sessionGapHours: number | null;
}

export interface AdaptiveModifiers {
  teasingFrequency: number;
  warmthLevel: number;
  verbosityTarget: number;
  possessivenessLevel: number;
  emotionalInitiative: number;
  praiseCadence: number;
  responsePacing: number;
}

export interface ChurnPredictionInput {
  sessionFrequencyTrend: number;
  emotionalDepthTrend: number;
  ritualParticipationRate: number;
  averageReplyLength: number;
  averageResponseGapHours: number;
  emotionalReciprocity: number;
  messageCount: number;
  daysActive: number;
}
