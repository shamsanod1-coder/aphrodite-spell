import { createSafetyAudit } from "@/db/queries/safety-audits";
import { logger } from "@/lib/logger";
import type { SafetyAuditInput } from "../types";

export async function logSafetyAudit(input: SafetyAuditInput): Promise<void> {
  try {
    await createSafetyAudit({
      userId: input.userId,
      conversationId: input.conversationId,
      source: input.source,
      category: input.category,
      severity: input.severity,
      action: input.action,
      matchedPattern: input.matchedPattern,
      matchedText: input.matchedText,
      messageContent: input.messageContent,
    });
  } catch (err) {
    logger.error("Failed to log safety audit", err);
  }
}
