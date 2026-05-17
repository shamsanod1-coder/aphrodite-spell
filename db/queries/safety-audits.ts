import { db } from "@/db";
import { safetyAudits } from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export type SafetyAudit = typeof safetyAudits.$inferSelect;

export interface CreateSafetyAuditInput {
  userId: string;
  conversationId: string;
  source: "input" | "output";
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  action:
    | "allow"
    | "flag"
    | "inject_safety_prompt"
    | "replace_response"
    | "block";
  matchedPattern: string;
  matchedText: string;
  messageContent: string;
}

export async function createSafetyAudit(
  input: CreateSafetyAuditInput,
): Promise<SafetyAudit> {
  const [created] = await db
    .insert(safetyAudits)
    .values({
      userId: input.userId,
      conversationId: input.conversationId,
      source: input.source,
      category: input.category,
      severity: input.severity,
      action: input.action,
      matchedPattern: input.matchedPattern,
      matchedText: input.matchedText,
      messageContent: input.messageContent,
    })
    .returning();
  return created!;
}

export async function getSafetyAudits(options: {
  userId?: string;
  conversationId?: string;
  since?: Date;
  limit?: number;
}): Promise<SafetyAudit[]> {
  const conditions = [];
  if (options.userId) {
    conditions.push(eq(safetyAudits.userId, options.userId));
  }
  if (options.conversationId) {
    conditions.push(eq(safetyAudits.conversationId, options.conversationId));
  }
  if (options.since) {
    conditions.push(gte(safetyAudits.createdAt, options.since));
  }

  const query = db
    .select()
    .from(safetyAudits)
    .orderBy(desc(safetyAudits.createdAt))
    .limit(options.limit ?? 50);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getUserSafetyHistory(
  userId: string,
  since?: Date,
): Promise<{
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  categories: string[];
}> {
  const conditions = [eq(safetyAudits.userId, userId)];
  if (since) {
    conditions.push(gte(safetyAudits.createdAt, since));
  }

  const [result] = await db
    .select({
      totalViolations: sql<number>`count(*)::int`,
      criticalCount:
        sql<number>`count(*) filter (where ${safetyAudits.severity} = 'critical')::int`,
      highCount:
        sql<number>`count(*) filter (where ${safetyAudits.severity} = 'high')::int`,
      mediumCount:
        sql<number>`count(*) filter (where ${safetyAudits.severity} = 'medium')::int`,
      categories:
        sql<string[]>`array_agg(distinct ${safetyAudits.category})`,
    })
    .from(safetyAudits)
    .where(and(...conditions));

  return result!;
}
