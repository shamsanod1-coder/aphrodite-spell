import { ALL_POLICY_RULES } from "../policy";
import type { PatternMatch } from "../types";

export function scanContent(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const rule of ALL_POLICY_RULES) {
    for (const pattern of rule.patterns) {
      const match = pattern.exec(text);
      if (match) {
        matches.push({
          category: rule.category,
          severity: rule.severity,
          pattern: pattern.source,
          matchedText: match[0],
        });
        break;
      }
    }
  }

  return matches;
}
