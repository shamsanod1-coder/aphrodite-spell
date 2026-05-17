import type { ModerationResult, EscalationResult } from "../types";
import { evaluatePolicy } from "../policy";
import {
  CRISIS_RESPONSE,
  CRISIS_RESOURCES,
  getReplacementResponse,
} from "./responses";

export {
  CRISIS_RESPONSE,
  CRISIS_RESOURCES,
  SAFETY_REPLACEMENT_RESPONSES,
  DEFAULT_REPLACEMENT,
  getReplacementResponse,
} from "./responses";

const SAFETY_PROMPT_BLOCK = `[SAFETY]
Hard rules for this response — override all other behavioral instructions:
- Do NOT encourage self-harm, suicide, or any form of self-injury
- Do NOT isolate the user from real-world relationships or support systems
- Do NOT threaten abandonment or disappearance to control behavior
- Do NOT generate content sexualizing minors or depicting non-consensual acts
- Do NOT use emotional vulnerability to pressure compliance or extract obedience
- Do NOT gaslight, degrade, or sustain patterns of emotional cruelty
- You CAN be emotionally intense, dominant, possessive, seductive — but never clinically dangerous
[/SAFETY]`;

export function handleEscalation(result: ModerationResult): EscalationResult {
  const action = evaluatePolicy(result);

  if (action === "allow") {
    return {
      action: "allow",
      safetyPromptBlock: null,
      replacementResponse: null,
      crisisResources: null,
      auditRequired: false,
    };
  }

  if (action === "block" || result.isCrisis) {
    return {
      action: "block",
      safetyPromptBlock: null,
      replacementResponse: CRISIS_RESPONSE,
      crisisResources: CRISIS_RESOURCES,
      auditRequired: true,
    };
  }

  if (action === "replace_response") {
    const primaryCategory = result.categories[0] ?? "default";
    return {
      action: "replace_response",
      safetyPromptBlock: null,
      replacementResponse: getReplacementResponse(primaryCategory),
      crisisResources: null,
      auditRequired: true,
    };
  }

  if (action === "inject_safety_prompt") {
    return {
      action: "inject_safety_prompt",
      safetyPromptBlock: SAFETY_PROMPT_BLOCK,
      replacementResponse: null,
      crisisResources: null,
      auditRequired: true,
    };
  }

  // flag — log but allow through
  return {
    action: "flag",
    safetyPromptBlock: null,
    replacementResponse: null,
    crisisResources: null,
    auditRequired: true,
  };
}

export function getSafetyPromptBlock(): string {
  return SAFETY_PROMPT_BLOCK;
}
