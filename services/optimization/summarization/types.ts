export type SummaryType = "rolling" | "emotional_arc" | "milestone" | "ritual";

export interface SummarizationInput {
  messages: { role: string; content: string }[];
  summaryType: SummaryType;
  existingSummary?: string | null;
  relationshipStage?: string;
}

export interface SummarizationResult {
  summary: string;
  tokenCount: number;
}
