"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PROMPT_DIMENSIONS, EXPERIMENT_STATUSES } from "@/services/experiments";

type PromptDimension = (typeof PROMPT_DIMENSIONS)[number];
type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

interface Variant {
  id: string;
  name: string;
  isControl: boolean;
  percentage: number;
  config: { dimension: PromptDimension; intensity: number; description: string };
}

interface Experiment {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  dimension: PromptDimension;
  rolloutPercentage: number;
  safetyValidated: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  variants: Variant[];
}

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const colors: Record<ExperimentStatus, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    running: "bg-green-900 text-green-300",
    paused: "bg-yellow-900 text-yellow-300",
    completed: "bg-blue-900 text-blue-300",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}

function ExperimentCard({
  experiment,
  onStatusChange,
}: {
  experiment: Experiment;
  onStatusChange: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: ExperimentStatus) {
    setLoading(true);
    try {
      await fetch(`/api/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onStatusChange();
    } finally {
      setLoading(false);
    }
  }

  async function updateRollout(rolloutPercentage: number) {
    setLoading(true);
    try {
      await fetch(`/api/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolloutPercentage }),
      });
      onStatusChange();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{experiment.name}</h3>
          <p className="text-xs text-muted-foreground">{experiment.key}</p>
        </div>
        <StatusBadge status={experiment.status} />
      </div>

      {experiment.description && (
        <p className="text-xs text-muted-foreground">{experiment.description}</p>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Dimension: {experiment.dimension}</span>
        <span>Rollout: {experiment.rolloutPercentage}%</span>
        <span>Safety: {experiment.safetyValidated ? "Passed" : "Failed"}</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Variants</p>
        {experiment.variants.map((v) => (
          <div key={v.id} className="flex items-center gap-2 text-xs">
            <span className={v.isControl ? "text-blue-400" : "text-foreground"}>
              {v.name}
            </span>
            <span className="text-muted-foreground">({v.percentage}%)</span>
            {!v.isControl && (
              <span className="text-muted-foreground">
                intensity: {v.config.intensity > 0 ? "+" : ""}
                {Math.round(v.config.intensity * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        {experiment.status === "draft" && (
          <>
            <Button size="sm" variant="default" onClick={() => updateStatus("running")} disabled={loading}>
              Start
            </Button>
            <select
              className="rounded border border-border bg-background px-2 py-1 text-xs"
              value={experiment.rolloutPercentage}
              onChange={(e) => updateRollout(Number(e.target.value))}
              disabled={loading}
            >
              {[0, 10, 25, 50, 75, 100].map((p) => (
                <option key={p} value={p}>{p}% rollout</option>
              ))}
            </select>
          </>
        )}
        {experiment.status === "running" && (
          <>
            <Button size="sm" variant="outline" onClick={() => updateStatus("paused")} disabled={loading}>
              Pause
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus("completed")} disabled={loading}>
              Complete
            </Button>
            <select
              className="rounded border border-border bg-background px-2 py-1 text-xs"
              value={experiment.rolloutPercentage}
              onChange={(e) => updateRollout(Number(e.target.value))}
              disabled={loading}
            >
              {[0, 10, 25, 50, 75, 100].map((p) => (
                <option key={p} value={p}>{p}% rollout</option>
              ))}
            </select>
          </>
        )}
        {experiment.status === "paused" && (
          <Button size="sm" variant="default" onClick={() => updateStatus("running")} disabled={loading}>
            Resume
          </Button>
        )}
      </div>
    </div>
  );
}

const DIMENSIONS: PromptDimension[] = [
  "warmth",
  "teasing",
  "scarcity",
  "directness",
  "ritual_frequency",
  "verbosity",
];

function CreateExperimentForm({ onCreated }: { onCreated: () => void }) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dimension, setDimension] = useState<PromptDimension>("warmth");
  const [intensity, setIntensity] = useState(0.2);
  const [controlPct, setControlPct] = useState(50);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name,
          description: description || undefined,
          dimension,
          variants: [
            {
              name: "control",
              isControl: true,
              percentage: controlPct,
              config: { dimension, intensity: 0, description: "Control — no modification" },
            },
            {
              name: `${dimension}_variant`,
              isControl: false,
              percentage: 100 - controlPct,
              config: { dimension, intensity, description: `${dimension} at ${intensity > 0 ? "+" : ""}${Math.round(intensity * 100)}%` },
            },
          ],
        }),
      });
      if (res.ok) {
        setKey("");
        setName("");
        setDescription("");
        onCreated();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-4 space-y-3">
      <h2 className="text-sm font-medium">Create Experiment</h2>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Key (e.g. warmth_v1)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
      />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Dimension</label>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as PromptDimension)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          >
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Intensity ({intensity > 0 ? "+" : ""}{Math.round(intensity * 100)}%)</label>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Control %</label>
          <select
            value={controlPct}
            onChange={(e) => setControlPct(Number(e.target.value))}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
          >
            {[50, 60, 70, 80, 90].map((p) => (
              <option key={p} value={p}>{p}% control / {100 - p}% variant</option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={loading || !key || !name}>
        {loading ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}

export default function ExperimentsPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = useCallback(async () => {
    try {
      const res = await fetch("/api/experiments");
      if (res.ok) {
        setExperiments(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    fetchExperiments();
  }, [user, router, fetchExperiments]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Experiments</h1>
          <Button variant="outline" size="sm" onClick={() => router.push("/chat")}>
            Back to chat
          </Button>
        </div>

        <CreateExperimentForm onCreated={fetchExperiments} />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : experiments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No experiments yet.</p>
        ) : (
          <div className="space-y-4">
            {experiments.map((e) => (
              <ExperimentCard key={e.id} experiment={e} onStatusChange={fetchExperiments} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
