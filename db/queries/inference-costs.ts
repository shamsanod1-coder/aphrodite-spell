import { db } from "@/db";
import { inferenceCosts } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export type InferenceCost = typeof inferenceCosts.$inferSelect;

export interface RecordCostInput {
  userId: string;
  conversationId: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  routingDecision: "premium" | "lite";
  contextTokensBefore?: number;
  contextTokensAfter?: number;
  compressionApplied?: boolean;
}

export async function recordInferenceCost(
  input: RecordCostInput
): Promise<InferenceCost> {
  const [created] = await db
    .insert(inferenceCosts)
    .values({
      userId: input.userId,
      conversationId: input.conversationId,
      model: input.model,
      provider: input.provider,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCost: input.estimatedCost,
      routingDecision: input.routingDecision,
      contextTokensBefore: input.contextTokensBefore ?? null,
      contextTokensAfter: input.contextTokensAfter ?? null,
      compressionApplied: input.compressionApplied ?? false,
    })
    .returning();
  return created;
}

export async function getUserCostSummary(
  userId: string,
  since?: Date
): Promise<{
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  premiumCount: number;
  liteCount: number;
}> {
  const conditions = [eq(inferenceCosts.userId, userId)];
  if (since) {
    conditions.push(gte(inferenceCosts.createdAt, since));
  }

  const [result] = await db
    .select({
      totalCost: sql<number>`coalesce(sum(${inferenceCosts.estimatedCost}), 0)::real`,
      totalInputTokens: sql<number>`coalesce(sum(${inferenceCosts.inputTokens}), 0)::int`,
      totalOutputTokens: sql<number>`coalesce(sum(${inferenceCosts.outputTokens}), 0)::int`,
      requestCount: sql<number>`count(*)::int`,
      premiumCount: sql<number>`count(*) filter (where ${inferenceCosts.routingDecision} = 'premium')::int`,
      liteCount: sql<number>`count(*) filter (where ${inferenceCosts.routingDecision} = 'lite')::int`,
    })
    .from(inferenceCosts)
    .where(and(...conditions));

  return result;
}
