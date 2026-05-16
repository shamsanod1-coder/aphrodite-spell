import type { Memory } from "@/db/queries/memories";

interface RankedMemory extends Memory {
  similarity: number;
  finalScore: number;
}

const WEIGHTS = {
  similarity: 0.35,
  salience: 0.25,
  emotionalWeight: 0.20,
  recency: 0.10,
  referenceRecency: 0.10,
};

function computeRecencyScore(createdAt: Date): number {
  const daysSinceCreation =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-daysSinceCreation / 30);
}

function computeReferenceRecencyScore(lastReferencedAt: Date | null): number {
  if (!lastReferencedAt) return 0.5;
  const daysSinceRef =
    (Date.now() - lastReferencedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceRef < 1) return 0.2;
  return Math.min(1, daysSinceRef / 7);
}

export function rankMemories(
  memories: (Memory & { similarity: number })[],
  maxResults: number = 5
): RankedMemory[] {
  const scored = memories.map((memory) => {
    const recency = computeRecencyScore(memory.createdAt);
    const refRecency = computeReferenceRecencyScore(memory.lastReferencedAt);

    const finalScore =
      WEIGHTS.similarity * memory.similarity +
      WEIGHTS.salience * memory.salienceScore +
      WEIGHTS.emotionalWeight * memory.emotionalWeight +
      WEIGHTS.recency * recency +
      WEIGHTS.referenceRecency * refRecency;

    return { ...memory, finalScore };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  return scored.slice(0, maxResults);
}
