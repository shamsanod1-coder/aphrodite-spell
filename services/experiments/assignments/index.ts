import {
  getExperimentAssignment,
  createAssignment,
  getRunningExperimentByKey,
  listRunningExperimentKeys,
} from "@/db/queries/experiments";
import { computeBucket } from "../feature-flags";
import type { AssignmentResult, VariantConfig } from "../types";

export async function resolveVariant(
  userId: string,
  experimentKey: string
): Promise<AssignmentResult | null> {
  const experiment = await getRunningExperimentByKey(experimentKey);
  if (!experiment) return null;

  if (experiment.rolloutPercentage <= 0) return null;
  if (
    experiment.rolloutPercentage < 100 &&
    computeBucket(userId, experimentKey) >= experiment.rolloutPercentage
  ) {
    return null;
  }

  const existing = await getExperimentAssignment(userId, experiment.id);
  if (existing) {
    return {
      experimentId: experiment.id,
      experimentKey: experiment.key,
      variantId: existing.variantId,
      variantName: existing.variantName,
      isControl: existing.isControl,
      config: existing.config as VariantConfig,
    };
  }

  const bucket = computeBucket(userId, experimentKey);
  let cumulative = 0;
  let assignedVariant = experiment.variants[0];

  for (const variant of experiment.variants) {
    cumulative += variant.percentage;
    if (bucket < cumulative) {
      assignedVariant = variant;
      break;
    }
  }

  if (!assignedVariant) return null;

  await createAssignment(userId, experiment.id, assignedVariant.id);

  return {
    experimentId: experiment.id,
    experimentKey: experiment.key,
    variantId: assignedVariant.id,
    variantName: assignedVariant.name,
    isControl: assignedVariant.isControl,
    config: assignedVariant.config as VariantConfig,
  };
}

export async function resolveAllActiveVariants(
  userId: string
): Promise<AssignmentResult[]> {
  const runningKeys = await listRunningExperimentKeys();
  const results: AssignmentResult[] = [];
  for (const key of runningKeys) {
    const result = await resolveVariant(userId, key);
    if (result) results.push(result);
  }
  return results;
}
