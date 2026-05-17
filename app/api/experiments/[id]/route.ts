import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getExperiment,
  updateExperiment,
  deleteExperiment,
  getVariantsForExperiment,
} from "@/db/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const experiment = await getExperiment(id);
  if (!experiment) return new Response("Not found", { status: 404 });

  const variants = await getVariantsForExperiment(id);
  return Response.json({ ...experiment, variants });
}

interface UpdateExperimentBody {
  name?: string;
  description?: string;
  status?: "draft" | "running" | "paused" | "completed";
  rolloutPercentage?: number;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const existing = await getExperiment(id);
  if (!existing) return new Response("Not found", { status: 404 });

  const body = (await req.json()) as UpdateExperimentBody;

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.rolloutPercentage !== undefined)
    updates.rolloutPercentage = body.rolloutPercentage;

  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "running" && !existing.startedAt) {
      updates.startedAt = new Date();
    }
    if (body.status === "completed") {
      updates.completedAt = new Date();
    }
  }

  const updated = await updateExperiment(id, updates);
  const variants = await getVariantsForExperiment(id);
  return Response.json({ ...updated, variants });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const existing = await getExperiment(id);
  if (!existing) return new Response("Not found", { status: 404 });

  if (existing.status === "running") {
    return Response.json(
      { error: "Cannot delete a running experiment. Pause or complete it first." },
      { status: 400 }
    );
  }

  await deleteExperiment(id);
  return new Response(null, { status: 204 });
}
