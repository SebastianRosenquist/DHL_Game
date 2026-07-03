"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ACTIVITY_TYPES } from "@/lib/activity-type";
import {
  METRICS,
  METRIC_KEYS,
  SCOPES,
  STRATEGIES,
} from "@/lib/achievements/types";
import { apiSend, fetcher } from "@/lib/fetcher";

type Def = {
  id: string;
  title: string;
  description: string;
  strategy: string;
  metric: string | null;
  scope: string;
  activityType: string;
  icon: string;
  enabled: boolean;
  sort: number;
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  run: "Run",
  walk: "Walk",
};

const STRATEGY_LABELS: Record<string, string> = {
  min_metric: "Smallest value (record low)",
  max_metric: "Largest value (record high)",
  sum_metric: "Biggest total",
  count_distinct_days: "Most active days",
};

const blank = {
  title: "",
  description: "",
  strategy: "max_metric",
  metric: "distanceM",
  scope: "individual",
  activityType: "run",
  icon: "🏆",
  enabled: true,
  sort: 0,
};

type FormState = typeof blank;

export default function AchievementManager() {
  const { data } = useSWR<{ definitions: Def[] }>("/api/achievements", fetcher);
  const [form, setForm] = useState<FormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const defs = data?.definitions ?? [];

  const needsMetric = form.strategy !== "count_distinct_days";

  function refresh() {
    mutate("/api/achievements");
    mutate("/api/standings");
  }

  async function save() {
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      strategy: form.strategy,
      metric: needsMetric ? form.metric : undefined,
      scope: form.scope,
      activityType: form.activityType,
      icon: form.icon,
      enabled: form.enabled,
      sort: Number(form.sort) || 0,
    };
    try {
      if (editingId) {
        await apiSend(`/api/achievements/${editingId}`, "PATCH", payload);
      } else {
        await apiSend("/api/achievements", "POST", payload);
      }
      setForm(blank);
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this achievement?")) return;
    await apiSend(`/api/achievements/${id}`, "DELETE");
    if (editingId === id) {
      setEditingId(null);
      setForm(blank);
    }
    refresh();
  }

  async function recompute() {
    setNote(null);
    await apiSend("/api/achievements/reconcile", "POST");
    setNote("Recomputed all achievements.");
    refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Achievements</h2>
        <button
          onClick={recompute}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Recompute now
        </button>
      </div>
      {note && <p className="mt-2 text-sm text-emerald-600">{note}</p>}

      {/* existing definitions */}
      <div className="mt-4 space-y-2">
        {defs.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
          >
            <span className="text-xl">{d.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{d.title}</span>
                {!d.enabled && (
                  <span className="rounded bg-gray-100 px-1.5 text-[10px] uppercase text-gray-400">
                    off
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {STRATEGY_LABELS[d.strategy] ?? d.strategy}
                {d.metric ? ` · ${METRICS[d.metric as keyof typeof METRICS]?.label ?? d.metric}` : ""}
                {` · ${d.scope}`}
                {` · ${ACTIVITY_TYPE_LABELS[d.activityType] ?? d.activityType}`}
              </div>
            </div>
            <button
              onClick={() => {
                setEditingId(d.id);
                setForm({
                  title: d.title,
                  description: d.description,
                  strategy: d.strategy,
                  metric: d.metric ?? "distanceM",
                  scope: d.scope,
                  activityType: d.activityType,
                  icon: d.icon,
                  enabled: d.enabled,
                  sort: d.sort,
                });
              }}
              className="text-sm text-gray-500 hover:text-ink"
            >
              Edit
            </button>
            <button
              onClick={() => remove(d.id)}
              className="text-sm text-dhlRed hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {defs.length === 0 && (
          <p className="text-sm text-gray-500">No achievements yet.</p>
        )}
      </div>

      {/* create / edit form */}
      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-semibold">
          {editingId ? "Edit achievement" : "New achievement"}
        </h3>

        <div className="mt-2 flex gap-2">
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-14 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-ink"
            maxLength={4}
          />
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title, e.g. Fastest 1K"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            maxLength={80}
          />
        </div>

        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description (optional)"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
          maxLength={280}
        />

        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="text-xs font-medium text-gray-500">
            Rule
            <select
              value={form.strategy}
              onChange={(e) => setForm({ ...form, strategy: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>
                  {STRATEGY_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500">
            Awarded to
            <select
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s === "team" ? "Team" : "Individual"}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-gray-500">
            Activity type
            <select
              value={form.activityType}
              onChange={(e) => setForm({ ...form, activityType: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {needsMetric && (
          <label className="mt-2 block text-xs font-medium text-gray-500">
            Metric
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            >
              {METRIC_KEYS.map((k) => (
                <option key={k} value={k}>
                  {METRICS[k].label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            Order
            <input
              type="number"
              value={form.sort}
              onChange={(e) =>
                setForm({ ...form, sort: Number(e.target.value) })
              }
              className="w-20 rounded-lg border border-gray-300 px-2 py-1"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-dhlRed">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            {editingId ? "Save changes" : "Create achievement"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(blank);
              }}
              className="rounded-lg px-4 py-2 text-sm text-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
