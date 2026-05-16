import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

function getEmbeddingModel() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for memory embeddings");
  }
  const openai = createOpenAI({ apiKey });
  return openai.embeddingModel("text-embedding-3-small");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
  });
  return embedding;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) {
    const single = await generateEmbedding(texts[0]);
    return [single];
  }
  const { embeddings } = await embedMany({
    model: getEmbeddingModel(),
    values: texts,
  });
  return embeddings;
}
