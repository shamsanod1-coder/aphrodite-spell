import {
  updateMemorySalience,
  deleteStaleMemories,
  type Memory,
} from "@/db/queries/memories";

const DAILY_DECAY_RATE = 0.02;
const REINFORCEMENT_BOOST = 0.15;
const MIN_SALIENCE = 0.05;

function computeDecayedSalience(memory: Memory): number {
  const referenceDate = memory.lastReferencedAt ?? memory.createdAt;
  const daysSinceActivity =
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

  const decayFactor = Math.exp(-DAILY_DECAY_RATE * daysSinceActivity);
  return memory.salienceScore * decayFactor;
}

export async function applyDecay(
  memories: (Memory & { similarity: number })[]
): Promise<void> {
  const updates: Promise<void>[] = [];

  for (const memory of memories) {
    const decayed = computeDecayedSalience(memory);
    if (Math.abs(decayed - memory.salienceScore) > 0.01) {
      memory.salienceScore = decayed;
      updates.push(updateMemorySalience(memory.id, decayed));
    }
  }

  await Promise.all(updates);
}

export async function reinforceMemory(memoryId: string, currentSalience: number): Promise<void> {
  const boosted = Math.min(1, currentSalience + REINFORCEMENT_BOOST);
  await updateMemorySalience(memoryId, boosted);
}

export async function cleanupStaleMemories(userId: string): Promise<number> {
  return deleteStaleMemories(userId, MIN_SALIENCE);
}
