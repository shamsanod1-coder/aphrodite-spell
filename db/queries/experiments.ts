import { db } from "@/db";
import {
  experiments,
  experimentVariants,
  experimentAssignments,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type Experiment = typeof experiments.$inferSelect;
export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;

// ── Experiment CRUD ─────────────────────────────────────────────────────

export async function getExperiment(id: string): Promise<Experiment | null> {
  const [row] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.id, id))
    .limit(1);
  return row ?? null;
}

export async function listExperiments(): Promise<Experiment[]> {
  return db.select().from(experiments).orderBy(experiments.createdAt);
}

export async function createExperiment(
  values: typeof experiments.$inferInsert
): Promise<Experiment> {
  const [row] = await db.insert(experiments).values(values).returning();
  return row;
}

export async function updateExperiment(
  id: string,
  values: Partial<Pick<Experiment, "name" | "description" | "status" | "rolloutPercentage" | "safetyValidated" | "startedAt" | "completedAt">>
): Promise<Experiment> {
  const [row] = await db
    .update(experiments)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(experiments.id, id))
    .returning();
  return row;
}

export async function deleteExperiment(id: string): Promise<void> {
  await db.delete(experiments).where(eq(experiments.id, id));
}

// ── Variant CRUD ────────────────────────────────────────────────────────

export async function getVariantsForExperiment(
  experimentId: string
): Promise<ExperimentVariant[]> {
  return db
    .select()
    .from(experimentVariants)
    .where(eq(experimentVariants.experimentId, experimentId));
}

export async function createVariants(
  values: (typeof experimentVariants.$inferInsert)[]
): Promise<ExperimentVariant[]> {
  return db.insert(experimentVariants).values(values).returning();
}

// ── Assignment queries ──────────────────────────────────────────────────

export async function getExperimentAssignment(
  userId: string,
  experimentId: string
): Promise<{
  variantId: string;
  variantName: string;
  isControl: boolean;
  config: unknown;
} | null> {
  const [row] = await db
    .select({
      variantId: experimentAssignments.variantId,
      variantName: experimentVariants.name,
      isControl: experimentVariants.isControl,
      config: experimentVariants.config,
    })
    .from(experimentAssignments)
    .innerJoin(
      experimentVariants,
      eq(experimentAssignments.variantId, experimentVariants.id)
    )
    .where(
      and(
        eq(experimentAssignments.userId, userId),
        eq(experimentAssignments.experimentId, experimentId)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function createAssignment(
  userId: string,
  experimentId: string,
  variantId: string
): Promise<void> {
  await db
    .insert(experimentAssignments)
    .values({ userId, experimentId, variantId })
    .onConflictDoNothing();
}

export async function getActiveExperimentAssignments(
  userId: string
): Promise<
  {
    experimentId: string;
    experimentKey: string;
    variantId: string;
    variantName: string;
    isControl: boolean;
    config: unknown;
  }[]
> {
  return db
    .select({
      experimentId: experimentAssignments.experimentId,
      experimentKey: experiments.key,
      variantId: experimentAssignments.variantId,
      variantName: experimentVariants.name,
      isControl: experimentVariants.isControl,
      config: experimentVariants.config,
    })
    .from(experimentAssignments)
    .innerJoin(
      experiments,
      eq(experimentAssignments.experimentId, experiments.id)
    )
    .innerJoin(
      experimentVariants,
      eq(experimentAssignments.variantId, experimentVariants.id)
    )
    .where(
      and(
        eq(experimentAssignments.userId, userId),
        eq(experiments.status, "running")
      )
    );
}

export async function listRunningExperimentKeys(): Promise<string[]> {
  const rows = await db
    .select({ key: experiments.key })
    .from(experiments)
    .where(eq(experiments.status, "running"));
  return rows.map((r) => r.key);
}

// ── Composite queries ───────────────────────────────────────────────────

export async function getRunningExperimentByKey(key: string): Promise<{
  id: string;
  key: string;
  rolloutPercentage: number;
  variants: {
    id: string;
    name: string;
    isControl: boolean;
    percentage: number;
    config: unknown;
  }[];
} | null> {
  const [experiment] = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.key, key), eq(experiments.status, "running")))
    .limit(1);

  if (!experiment) return null;

  const variants = await db
    .select()
    .from(experimentVariants)
    .where(eq(experimentVariants.experimentId, experiment.id));

  return {
    id: experiment.id,
    key: experiment.key,
    rolloutPercentage: experiment.rolloutPercentage,
    variants: variants.map((v) => ({
      id: v.id,
      name: v.name,
      isControl: v.isControl,
      percentage: v.percentage,
      config: v.config,
    })),
  };
}
