import { searchMemories } from "../storage";
import { rankMemories } from "../ranking";
import { applyDecay } from "../lifecycle";

export interface RetrievedMemory {
  id: string;
  content: string;
  memoryType: string;
  emotionalWeight: number;
  finalScore: number;
}

export async function retrieveRelevantMemories(
  userId: string,
  currentMessage: string,
  maxMemories: number = 5
): Promise<RetrievedMemory[]> {
  const candidates = await searchMemories(userId, currentMessage, maxMemories * 3);

  if (candidates.length === 0) return [];

  await applyDecay(candidates);

  const ranked = rankMemories(candidates, maxMemories);

  return ranked.map((m) => ({
    id: m.id,
    content: m.content,
    memoryType: m.memoryType,
    emotionalWeight: m.emotionalWeight,
    finalScore: m.finalScore,
  }));
}

export function formatMemoriesForPrompt(memories: RetrievedMemory[]): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const weight =
      m.emotionalWeight > 0.7
        ? "deeply"
        : m.emotionalWeight > 0.4
          ? "meaningfully"
          : "subtly";
    return `- (${weight} significant) ${m.content}`;
  });

  return lines.join("\n");
}
