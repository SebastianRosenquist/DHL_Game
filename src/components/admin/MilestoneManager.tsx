"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { apiSend, fetcher } from "@/lib/fetcher";

type Milestone = {
  id: string;
  km: number;
  label: string;
  subtitle: string;
  icon: string;
};

const blank = { km: "", label: "", subtitle: "", icon: "🏁" };
type FormState = typeof blank;

export default function MilestoneManager() {
  const { data } = useSWR<{ milestones: Milestone[] }>(
    "/api/milestones",
    fetcher,
  );
  const [form, setForm] = useState<FormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = data?.milestones ?? [];

  function refresh() {
    mutate("/api/milestones");
    mutate("/api/standings");
  }

  async function save() {
    setError(null);
    const payload = {
      km: form.km,
      label: form.label,
      subtitle: form.subtitle,
      icon: form.icon || "🏁",
    };
    try {
      if (editingId) {
        await apiSend(`/api/milestones/${editingId}`, "PATCH", payload);
      } else {
        await apiSend("/api/milestones", "POST", payload);
      }
      setForm(blank);
      setEditingId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this milestone?")) return;
    await apiSend(`/api/milestones/${id}`, "DELETE");
    if (editingId === id) {
      setEditingId(null);
      setForm(blank);
    }
    refresh();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="font-bold">Route Prizes (Milestones)</h2>
      <p className="mt-1 text-sm text-gray-500">
        Checkpoints along the route. Each team unlocks them by reaching the total
        distance. The largest is the finish line.
      </p>

      <div className="mt-4 space-y-2">
        {items.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
          >
            <span className="text-xl">{m.icon}</span>
            <span className="w-16 font-semibold tabular-nums">{m.km} km</span>
            <span className="flex-1 min-w-0">
              <span className="block text-gray-600">{m.label}</span>
              {m.subtitle && (
                <span className="block text-xs text-gray-400">{m.subtitle}</span>
              )}
            </span>
            <button
              onClick={() => {
                setEditingId(m.id);
                setForm({
                  km: String(m.km),
                  label: m.label,
                  subtitle: m.subtitle ?? "",
                  icon: m.icon,
                });
              }}
              className="text-sm text-gray-500 hover:text-ink"
            >
              Edit
            </button>
            <button
              onClick={() => remove(m.id)}
              className="text-sm text-dhlRed hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500">
            No milestones yet — add one below.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <h3 className="text-sm font-semibold">
          {editingId ? "Edit milestone" : "New milestone"}
        </h3>
        <div className="mt-2 flex gap-2">
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="w-14 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-ink"
            maxLength={4}
            aria-label="Icon"
          />
          <input
            value={form.km}
            onChange={(e) => setForm({ ...form, km: e.target.value })}
            placeholder="km"
            inputMode="decimal"
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            aria-label="Distance in km"
          />
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Prize name, e.g. Bronze Boot"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            maxLength={40}
          />
        </div>
        <div className="mt-2">
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Optional subtitle, e.g. prize description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            maxLength={80}
          />
        </div>

        {error && <p className="mt-3 text-sm text-dhlRed">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            {editingId ? "Save changes" : "Add milestone"}
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
