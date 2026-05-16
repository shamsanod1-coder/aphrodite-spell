import { updateChurnRisk } from "@/db/queries/emotional-profiles";
import type { ChurnRiskState, ChurnPredictionInput } from "../profiling/types";

interface ChurnPredictionResult {
  risk: ChurnRiskState;
  score: number;
  signals: string[];
}

export function predictChurnRisk(
  input: ChurnPredictionInput
): ChurnPredictionResult {
  if (input.messageCount < 10 || input.daysActive < 3) {
    return { risk: "healthy", score: 0, signals: [] };
  }

  let score = 0;
  const signals: string[] = [];

  if (input.sessionFrequencyTrend < -0.3) {
    score += 0.25;
    signals.push("reduced_session_frequency");
  }

  if (input.emotionalDepthTrend < -0.2) {
    score += 0.2;
    signals.push("reduced_emotional_depth");
  }

  if (input.ritualParticipationRate < 0.3) {
    score += 0.15;
    signals.push("ignored_rituals");
  }

  if (input.averageReplyLength < 30) {
    score += 0.15;
    signals.push("shorter_replies");
  }

  if (input.averageResponseGapHours > 48) {
    score += 0.15;
    signals.push("increased_response_gaps");
  }

  if (input.emotionalReciprocity < 0.3) {
    score += 0.1;
    signals.push("lower_emotional_reciprocity");
  }

  const risk = scoreToRisk(score);
  return { risk, score: Math.min(1, score), signals };
}

function scoreToRisk(score: number): ChurnRiskState {
  if (score >= 0.7) return "high-risk";
  if (score >= 0.45) return "disengaging";
  if (score >= 0.25) return "drifting";
  return "healthy";
}

export async function evaluateAndUpdateChurnRisk(
  userId: string,
  input: ChurnPredictionInput
): Promise<ChurnPredictionResult> {
  const result = predictChurnRisk(input);
  await updateChurnRisk(userId, result.risk);
  return result;
}
