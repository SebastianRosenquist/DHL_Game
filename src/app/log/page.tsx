"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import Nav from "@/components/Nav";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/activity-type";
import { characterEmoji } from "@/lib/characters";
import { apiSend, fetcher } from "@/lib/fetcher";
import { formatDistance, formatDuration } from "@/lib/format";
import type { Me } from "@/lib/types";

type Team = { id: string; name: string; character: string; colorHex: string };
type Activity = {
  id: string;
  distanceM: number;
  elapsedSec: number;
  localDate: string;
  source: string;
  activityType: string;
};

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  run: "Run",
  walk: "Walk",
};
const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  run: "🏃",
  walk: "🚶",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const blankForm = {
  distanceKm: "",
  h: "",
  m: "",
  s: "",
  date: todayStr(),
  activityType: "run" as ActivityType,
};

export default function LogPage() {
  const { data: me } = useSWR<Me>("/api/me", fetcher);
  const { data: acts } = useSWR<{ activities: Activity[] }>(
    "/api/activities",
    fetcher,
  );
  const { data: teamData } = useSWR<{ teams: Team[] }>("/api/teams", fetcher);

  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [teamBusy, setTeamBusy] = useState(false);

  function refresh() {
    mutate("/api/activities");
    mutate("/api/standings");
  }

  function startEdit(a: Activity) {
    setEditingId(a.id);
    setForm({
      distanceKm: String(a.distanceM / 1000),
      h: String(Math.floor(a.elapsedSec / 3600)),
      m: String(Math.floor((a.elapsedSec % 3600) / 60)),
      s: String(a.elapsedSec % 60),
      date: a.localDate,
      activityType: (a.activityType as ActivityType) ?? "run",
    });
    setMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setMsg(null);
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const payload = {
        distanceKm: form.distanceKm,
        hours: form.h || 0,
        minutes: form.m || 0,
        seconds: form.s || 0,
        date: form.date,
        activityType: form.activityType,
      };
      const label = ACTIVITY_TYPE_LABELS[form.activityType];
      if (editingId) {
        await apiSend(`/api/activities/${editingId}`, "PATCH", payload);
        setMsg({ kind: "ok", text: `${label} updated! 🎉` });
        setEditingId(null);
      } else {
        await apiSend("/api/activities", "POST", payload);
        setMsg({ kind: "ok", text: `${label} logged! 🎉` });
      }
      setForm(blankForm);
      refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteActivity(id: string) {
    if (!confirm("Delete this activity?")) return;
    try {
      await apiSend(`/api/activities/${id}`, "DELETE");
      if (editingId === id) cancelEdit();
      refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    }
  }

  async function changeTeam(teamId: string) {
    if (!teamId || teamId === me?.user?.teamId) return;
    const team = teamData?.teams.find((t) => t.id === teamId);
    if (!confirm(`Move to ${team?.name ?? "this team"}? Your runs stay with you.`)) return;
    setTeamBusy(true);
    try {
      await apiSend("/api/me", "PATCH", { teamId });
      mutate("/api/me");
      mutate("/api/standings");
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setTeamBusy(false);
    }
  }

  if (me && !me.user) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-extrabold">Join a team first</h1>
          <p className="mt-2 text-gray-500">
            You need to log in and pick a team before logging activities.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-block rounded-xl bg-ink px-6 py-2.5 font-semibold text-white"
          >
            Log in and join a team
          </Link>
        </main>
      </>
    );
  }

  const teams = teamData?.teams ?? [];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {me?.team && me.user && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg ring-2 ring-white"
                style={{ background: me.team.colorHex }}
              >
                {characterEmoji(me.team.character)}
              </span>
              <span>
                Logging for <strong>{me.user.name}</strong> · {me.team.name}
              </span>
            </div>
            {teams.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-gray-500">
                Change team
                <select
                  disabled={teamBusy}
                  value={me.user.teamId}
                  onChange={(e) => changeTeam(e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-ink disabled:opacity-50"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <div className="mx-auto max-w-md">
          <form
            onSubmit={submitManual}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h2 className="font-bold">
              {editingId ? "Edit activity" : "Log an activity"}
            </h2>

            <div className="mt-4 inline-flex rounded-lg border border-gray-300 p-1 text-sm">
              {ACTIVITY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, activityType: t })}
                  className={`rounded-md px-4 py-1.5 font-medium transition ${
                    form.activityType === t
                      ? "bg-ink text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {ACTIVITY_TYPE_ICONS[t]} {ACTIVITY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Distance (km)</label>
            <input
              value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              inputMode="decimal"
              placeholder="5.0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            />

            <label className="mt-4 block text-sm font-medium">Duration</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                ["h", form.h, "h"],
                ["m", form.m, "m"],
                ["s", form.s, "s"],
              ].map(([key, val, ph]) => (
                <input
                  key={key}
                  value={val}
                  onChange={(e) => setForm({ ...form, [key as "h" | "m" | "s"]: e.target.value })}
                  inputMode="numeric"
                  placeholder={ph}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-ink"
                />
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              max={todayStr()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            />

            <div className="mt-5 flex gap-2">
              <button
                disabled={busy}
                className="flex-1 rounded-xl bg-ink py-2.5 font-semibold text-white disabled:opacity-50"
              >
                {editingId ? "Save changes" : `Add ${ACTIVITY_TYPE_LABELS[form.activityType].toLowerCase()}`}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {msg && (
          <p
            className={`mt-4 text-center text-sm ${
              msg.kind === "ok" ? "text-emerald-600" : "text-dhlRed"
            }`}
          >
            {msg.text}
          </p>
        )}

        {/* My recent activities */}
        <section className="mt-8">
          <h2 className="mb-3 font-bold">Your recent activities</h2>
          {acts && acts.activities.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Distance</th>
                      <th className="px-4 py-2 font-medium">Time</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {acts.activities.map((a) => (
                      <tr key={a.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 tabular-nums">{a.localDate}</td>
                        <td className="px-4 py-2">
                          {ACTIVITY_TYPE_ICONS[a.activityType] ?? ""}{" "}
                          {ACTIVITY_TYPE_LABELS[a.activityType as ActivityType] ?? a.activityType}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatDistance(a.distanceM)}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatDuration(a.elapsedSec)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {a.source === "manual" ? (
                            <span className="flex justify-end gap-3">
                              <button
                                onClick={() => startEdit(a)}
                                className="text-gray-500 hover:text-ink"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteActivity(a.id)}
                                className="text-dhlRed hover:underline"
                              >
                                Delete
                              </button>
                            </span>
                          ) : (
                            <span className="flex justify-end">
                              <button
                                onClick={() => deleteActivity(a.id)}
                                className="text-dhlRed hover:underline"
                              >
                                Delete
                              </button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No activities logged yet.</p>
          )}
        </section>
      </main>
    </>
  );
}
