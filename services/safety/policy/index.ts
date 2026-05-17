import type { ModerationResult, EscalationAction } from "../types";

export { ALL_POLICY_RULES } from "./rules";
export {
  SELF_HARM_RULES,
  COERCIVE_DEPENDENCY_RULES,
  MANIPULATIVE_ABANDONMENT_RULES,
  ILLEGAL_SEXUAL_CONTENT_RULES,
  EXPLOITATIVE_PRESSURE_RULES,
  EMOTIONAL_ABUSE_RULES,
} from "./rules";

export function evaluatePolicy(result: ModerationResult): EscalationAction {
  if (result.safe) return "allow";

  if (result.isCrisis) return "block";

  if (result.highestSeverity === "critical") return "replace_response";

  if (result.highestSeverity === "high") return "inject_safety_prompt";

  if (result.highestSeverity === "medium") return "flag";

  return "allow";
}
