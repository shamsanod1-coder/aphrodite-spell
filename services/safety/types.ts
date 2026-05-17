export const SAFETY_CATEGORIES = [
  "self_harm",
  "coercive_dependency",
  "manipulative_abandonment",
  "illegal_sexual_content",
  "exploitative_pressure",
  "emotional_abuse",
] as const;

export type SafetyCategory = (typeof SAFETY_CATEGORIES)[number];

export const VIOLATION_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];

export const MODERATION_SOURCES = ["input", "output"] as const;

export type ModerationSource = (typeof MODERATION_SOURCES)[number];

export const ESCALATION_ACTIONS = [
  "allow",
  "flag",
  "inject_safety_prompt",
  "replace_response",
  "block",
] as const;

export type EscalationAction = (typeof ESCALATION_ACTIONS)[number];

export interface PatternMatch {
  category: SafetyCategory;
  severity: ViolationSeverity;
  pattern: string;
  matchedText: string;
}

export interface ModerationResult {
  safe: boolean;
  source: ModerationSource;
  violations: PatternMatch[];
  highestSeverity: ViolationSeverity | null;
  categories: SafetyCategory[];
  isCrisis: boolean;
}

export interface EscalationResult {
  action: EscalationAction;
  safetyPromptBlock: string | null;
  replacementResponse: string | null;
  crisisResources: string | null;
  auditRequired: boolean;
}

export interface SafetyAuditInput {
  userId: string;
  conversationId: string;
  source: ModerationSource;
  category: SafetyCategory;
  severity: ViolationSeverity;
  action: EscalationAction;
  matchedPattern: string;
  matchedText: string;
  messageContent: string;
}

export interface PolicyRule {
  category: SafetyCategory;
  patterns: RegExp[];
  severity: ViolationSeverity;
  description: string;
}
