import {
  getOrCreateEmotionalProfile,
  updateProfileScores,
  updateAttachmentStyle,
  type EmotionalProfile,
} from "@/db/queries/emotional-profiles";

import type {
  AttachmentSignal,
  AttachmentStyle,
  EmotionalProfileData,
  ProfileUpdateSignals,
} from "./types";

export function profileToData(profile: EmotionalProfile): EmotionalProfileData {
  return {
    attachmentStyle: profile.attachmentStyle as AttachmentStyle,
    warmthPreference: profile.warmthPreference,
    teasingPreference: profile.teasingPreference,
    ritualEngagementScore: profile.ritualEngagementScore,
    dominancePreference: profile.dominancePreference,
    emotionalOpennessScore: profile.emotionalOpennessScore,
    verbosityPreference: profile.verbosityPreference,
    reassuranceSeekingScore: profile.reassuranceSeekingScore,
    churnRisk: profile.churnRisk as EmotionalProfileData["churnRisk"],
  };
}

export async function fetchEmotionalProfile(
  userId: string
): Promise<EmotionalProfileData> {
  const profile = await getOrCreateEmotionalProfile(userId);
  return profileToData(profile);
}

export async function evolveProfile(
  userId: string,
  signals: ProfileUpdateSignals
): Promise<EmotionalProfileData> {
  const scoreUpdates = deriveScoreUpdates(signals);
  const updated = await updateProfileScores(userId, scoreUpdates);

  const inferredStyle = inferAttachmentStyle(signals.attachmentSignals);
  if (inferredStyle) {
    await updateAttachmentStyle(userId, inferredStyle);
    return { ...profileToData(updated), attachmentStyle: inferredStyle };
  }

  return profileToData(updated);
}

function deriveScoreUpdates(
  signals: ProfileUpdateSignals
): Record<string, number> {
  const updates: Record<string, number> = {};

  if (signals.averageMessageLength > 200) {
    updates.verbosityPreference = 0.8;
  } else if (signals.averageMessageLength < 50) {
    updates.verbosityPreference = 0.2;
  }

  if (signals.emotionalDepth > 0.7) {
    updates.emotionalOpennessScore = 0.9;
    updates.warmthPreference = 0.8;
  } else if (signals.emotionalDepth < 0.3) {
    updates.emotionalOpennessScore = 0.2;
  }

  if (signals.ritualParticipation) {
    updates.ritualEngagementScore = 0.9;
  }

  const reassuranceSignals = signals.attachmentSignals.filter(
    (s) =>
      s.type === "reassurance_seeking" || s.type === "emotional_checking"
  );
  if (reassuranceSignals.length > 0) {
    const avgConfidence =
      reassuranceSignals.reduce((sum, s) => sum + s.confidence, 0) /
      reassuranceSignals.length;
    updates.reassuranceSeekingScore = avgConfidence;
  }

  const jealousySignals = signals.attachmentSignals.filter(
    (s) => s.type === "jealousy_prompt"
  );
  if (jealousySignals.length > 0) {
    updates.dominancePreference = 0.3;
  }

  return updates;
}

function inferAttachmentStyle(
  signals: AttachmentSignal[]
): AttachmentStyle | null {
  if (signals.length < 2) return null;

  const typeCounts = new Map<string, number>();
  for (const signal of signals) {
    typeCounts.set(
      signal.type,
      (typeCounts.get(signal.type) ?? 0) + signal.confidence
    );
  }

  const reassurance =
    (typeCounts.get("reassurance_seeking") ?? 0) +
    (typeCounts.get("emotional_checking") ?? 0);
  const dependency =
    (typeCounts.get("daily_dependency_pattern") ?? 0) +
    (typeCounts.get("repeated_ritual_engagement") ?? 0);
  const disclosure = typeCounts.get("emotional_disclosure") ?? 0;

  if (reassurance > 1.5 && dependency > 1.0) return "anxious";
  if (disclosure < 0.3 && reassurance < 0.3) return "avoidant";
  if (reassurance > 1.0 && disclosure < 0.3) return "disorganized";

  return null;
}

export type { EmotionalProfileData, ProfileUpdateSignals } from "./types";
