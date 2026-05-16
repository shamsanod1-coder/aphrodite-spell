import { z } from "zod";

export const MEMORY_TYPES = [
  "insecurity",
  "routine",
  "desire",
  "emotional_disclosure",
  "preference",
  "recurring_theme",
  "emotional_trigger",
  "attachment_signal",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export const extractedMemorySchema = z.object({
  content: z
    .string()
    .describe("A concise 1-2 sentence description of the emotional memory"),
  memoryType: z.enum(MEMORY_TYPES).describe("The category of this memory"),
  emotionalWeight: z
    .number()
    .min(0)
    .max(1)
    .describe("Emotional intensity from 0 (low) to 1 (high)"),
});

export const extractionResultSchema = z.object({
  memories: z
    .array(extractedMemorySchema)
    .describe("Emotionally meaningful memories extracted from the conversation"),
});

export type ExtractedMemory = z.infer<typeof extractedMemorySchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export interface StoredMemory {
  id: string;
  userId: string;
  conversationId: string;
  content: string;
  memoryType: MemoryType;
  emotionalWeight: number;
  salienceScore: number;
  embedding: number[] | null;
  createdAt: Date;
  lastReferencedAt: Date | null;
}
