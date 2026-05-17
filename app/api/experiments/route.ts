import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  listExperiments,
  createExperiment,
  createVariants,
  getVariantsForExperiment,
} from "@/db/queries";
import { validateExperimentSafety, PROMPT_DIMENSIONS } from "@/services/experiments";
import type { VariantConfig, PromptDimension } from "@/services/experiments";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const rows = await listExperiments();
  const experimentsWithVariants = await Promise.all(
    rows.map(async (e) => ({
      ...e,
      variants: await getVariantsForExperiment(e.id),
    }))
  );

  return Response.json(experimentsWithVariants);
}

interface CreateExperimentBody {
  key: string;
  name: string;
  description?: string;
  dimension: string;
  rolloutPercentage?: number;
  variants: {
    name: string;
    isControl: boolean;
    percentage: number;
    config: VariantConfig;
  }[];
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as CreateExperimentBody;

  const dimension = body.dimension as PromptDimension;
  if (!PROMPT_DIMENSIONS.includes(dimension)) {
    return Response.json(
      { error: `Invalid dimension. Must be one of: ${PROMPT_DIMENSIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const percentageSum = body.variants.reduce((s, v) => s + v.percentage, 0);
  if (percentageSum !== 100) {
    return Response.json(
      { error: "Variant percentages must sum to 100" },
      { status: 400 }
    );
  }

  const hasControl = body.variants.some((v) => v.isControl);
  if (!hasControl) {
    return Response.json(
      { error: "At least one variant must be a control" },
      { status: 400 }
    );
  }

  const safetyResult = validateExperimentSafety(body.variants);

  const experiment = await createExperiment({
    key: body.key,
    name: body.name,
    description: body.description,
    dimension,
    rolloutPercentage: body.rolloutPercentage ?? 0,
    safetyValidated: safetyResult.valid,
  });

  const variants = await createVariants(
    body.variants.map((v) => ({
      experimentId: experiment.id,
      name: v.name,
      isControl: v.isControl,
      percentage: v.percentage,
      config: v.config,
    }))
  );

  return Response.json(
    { ...experiment, variants, safetyResult },
    { status: 201 }
  );
}
