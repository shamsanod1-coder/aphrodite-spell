import {
  createMemory,
  createMemories,
  findSimilarMemories,
  updateMemoryReference,
  type CreateMemoryInput,
  type Memory,
} from "@/db/queries/memories";
import { generateEmbedding, generateEmbeddings } from "./embeddings";
import type { ExtractedMemory } from "../extraction/types";

export async function storeMemory(
  userId: string,
  conversationId: string,
  memory: ExtractedMemory
): Promise<Memory> {
  const embedding = await generateEmbedding(memory.content);

  const isDuplicate = await checkDuplicate(userId, embedding);
  if (isDuplicate) {
    throw new Error("Duplicate memory detected");
  }

  return createMemory({
    userId,
    conversationId,
    content: memory.content,
    memoryType: memory.memoryType,
    emotionalWeight: memory.emotionalWeight,
    salienceScore: memory.emotionalWeight,
    embedding,
  });
}

export async function storeMemories(
  userId: string,
  conversationId: string,
  extractedMemories: ExtractedMemory[]
): Promise<Memory[]> {
  if (extractedMemories.length === 0) return [];

  const embeddings = await generateEmbeddings(
    extractedMemories.map((m) => m.content)
  );

  const inputs: CreateMemoryInput[] = [];
  for (let i = 0; i < extractedMemories.length; i++) {
    const memory = extractedMemories[i];
    const embedding = embeddings[i];

    const isDuplicate = await checkDuplicate(userId, embedding);
    if (!isDuplicate) {
      inputs.push({
        userId,
        conversationId,
        content: memory.content,
        memoryType: memory.memoryType,
        emotionalWeight: memory.emotionalWeight,
        salienceScore: memory.emotionalWeight,
        embedding,
      });
    }
  }

  return createMemories(inputs);
}

export async function searchMemories(
  userId: string,
  queryText: string,
  limit: number = 5
): Promise<(Memory & { similarity: number })[]> {
  const queryEmbedding = await generateEmbedding(queryText);
  const results = await findSimilarMemories(userId, queryEmbedding, limit);

  for (const memory of results) {
    updateMemoryReference(memory.id).catch(() => {});
  }

  return results;
}

const DUPLICATE_THRESHOLD = 0.92;

async function checkDuplicate(
  userId: string,
  embedding: number[]
): Promise<boolean> {
  const similar = await findSimilarMemories(userId, embedding, 1, 0);
  return similar.length > 0 && similar[0].similarity > DUPLICATE_THRESHOLD;
}
