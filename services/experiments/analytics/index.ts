import type { AssignmentResult } from "../types";

export interface ExperimentExposureEvent {
  event: "experiment_exposure";
  experimentId: string;
  experimentKey: string;
  variantId: string;
  variantName: string;
  isControl: boolean;
  dimension: string;
  intensity: number;
}

export function buildExposureEvent(
  assignment: AssignmentResult
): ExperimentExposureEvent {
  return {
    event: "experiment_exposure",
    experimentId: assignment.experimentId,
    experimentKey: assignment.experimentKey,
    variantId: assignment.variantId,
    variantName: assignment.variantName,
    isControl: assignment.isControl,
    dimension: assignment.config.dimension,
    intensity: assignment.config.intensity,
  };
}

export function buildExperimentProperties(
  assignments: AssignmentResult[]
): Record<string, unknown> {
  if (assignments.length === 0) return {};

  const properties: Record<string, unknown> = {
    active_experiments: assignments.map((a) => a.experimentKey),
    experiment_count: assignments.length,
  };

  for (const assignment of assignments) {
    properties[`experiment_${assignment.experimentKey}_variant`] =
      assignment.variantName;
    properties[`experiment_${assignment.experimentKey}_is_control`] =
      assignment.isControl;
  }

  return properties;
}
