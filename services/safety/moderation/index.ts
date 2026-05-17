import type { ModerationResult, ModerationSource } from "../types";
import { scanContent } from "./patterns";
import {
  getHighestSeverity,
  getUniqueCategories,
  isCrisisSignal,
} from "./classifier";

export { scanContent } from "./patterns";
export {
  getHighestSeverity,
  getUniqueCategories,
  isCrisisSignal,
} from "./classifier";

function buildModerationResult(
  source: ModerationSource,
  text: string,
): ModerationResult {
  const violations = scanContent(text);
  const highestSeverity = getHighestSeverity(violations);
  const categories = getUniqueCategories(violations);
  const crisis = isCrisisSignal(violations);

  return {
    safe: violations.length === 0,
    source,
    violations,
    highestSeverity,
    categories,
    isCrisis: crisis,
  };
}

export function moderateInput(text: string): ModerationResult {
  return buildModerationResult("input", text);
}

export function moderateOutput(text: string): ModerationResult {
  return buildModerationResult("output", text);
}
