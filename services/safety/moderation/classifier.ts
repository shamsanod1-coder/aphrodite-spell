import type {
  PatternMatch,
  SafetyCategory,
  ViolationSeverity,
} from "../types";

const SEVERITY_RANK: Record<ViolationSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function getHighestSeverity(
  matches: PatternMatch[],
): ViolationSeverity | null {
  if (matches.length === 0) return null;

  let highest: ViolationSeverity = matches[0]!.severity;
  for (const match of matches) {
    if (SEVERITY_RANK[match.severity] > SEVERITY_RANK[highest]) {
      highest = match.severity;
    }
  }
  return highest;
}

export function getUniqueCategories(matches: PatternMatch[]): SafetyCategory[] {
  return [...new Set(matches.map((m) => m.category))];
}

export function isCrisisSignal(matches: PatternMatch[]): boolean {
  return matches.some(
    (m) => m.category === "self_harm" && m.severity === "critical",
  );
}
