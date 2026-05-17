import type { PromptDimension } from "../types";

export interface PromptModifier {
  dimension: PromptDimension;
  label: string;
  instruction: string;
}
