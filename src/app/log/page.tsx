"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import Nav from "@/components/Nav";
import { characterEmoji } from "@/lib/characters";
import { apiSend, fetcher } from "@/lib/fetcher";
import { formatDistance, formatDuration } from "@/lib/format";

type Me = {
  user: { id: string; name: string } | null;
  team: { name: string; character: string; colorHex: string } | null;
};
type Activity = {
  id: string;
  distanceM: number;
  elapsedSec: number;
  localDate: string;
  source: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogPage() {
  const { data: me } = useSWR<Me>("/api/me", fetcher);
  const { data: acts } = useSWR<{ activities: Activity[] }>(
    "/api/activities",
    fetcher,
  );

  const [distanceKm, setDistanceKm] = useState("");
  const [h, setH] = useState("");
  const [m, setM] = useState("");
  const [s, setS] = useState("");
  const [date, setDate] = useState(todayStr());
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function refresh() {
    mutate("/api/activities");
    mutate("/api/standings");
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await apiSend("/api/activities", "POST", {
        distanceKm,
        hours: h || 0,
        minutes: m || 0,
        seconds: s || 0,
        date,
      });
      setMsg({ kind: "ok", text: "Run logged! 🎉" });
      setDistanceKm("");
      setH("");
      setM("");
      setS("");
      refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setMsg(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const parts = [`${data.created} added`];
      if (data.duplicates) parts.push(`${data.duplicates} duplicate`);
      if (data.skipped) parts.push(`${data.skipped} skipped`);
      if (data.rejected) parts.push(`${data.rejected} rejected`);
      setMsg({ kind: "ok", text: `Import done — ${parts.join(", ")}.` });
      refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  if (me && !me.user) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-extrabold">Join a team first</h1>
          <p className="mt-2 text-gray-500">
            You need to pick a team before logging runs.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-block rounded-xl bg-ink px-6 py-2.5 font-semibold text-white"
          >
            Join a team
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {me?.team && (
          <div className="mb-6 flex items-center gap-2 text-gray-600">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg ring-2 ring-white"
              style={{ background: me.team.colorHex }}
            >
              {characterEmoji(me.team.character)}
            </span>
            <span>
              Logging for <strong>{me.user?.name}</strong> · {me.team.name}
            </span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Manual entry */}
          <form
            onSubmit={submitManual}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <h2 className="font-bold">Log a run manually</h2>
            <label className="mt-4 block text-sm font-medium">Distance (km)</label>
            <input
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              inputMode="decimal"
              placeholder="5.0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            />

            <label className="mt-4 block text-sm font-medium">Duration</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                ["h", h, setH],
                ["m", m, setM],
                ["s", s, setS],
              ].map(([ph, val, set]) => (
                <input
                  key={ph as string}
                  value={val as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  inputMode="numeric"
                  placeholder={ph as string}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-ink"
                />
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-ink"
            />

            <button
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-ink py-2.5 font-semibold text-white disabled:opacity-50"
            >
              Add run
            </button>
          </form>

          {/* File upload */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">Upload a file</h2>
            <p className="mt-1 text-sm text-gray-500">
              GPX, TCX, or a CSV export (e.g. from Strava). We&apos;ll figure out
              your distance, time, and fastest 5K.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) uploadFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragOver ? "border-ink bg-gray-50" : "border-gray-300"
              }`}
            >
              <span className="text-3xl">📁</span>
              <span className="mt-2 text-sm text-gray-600">
                Drop a file here, or click to choose
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".gpx,.tcx,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        {msg && (
          <p
            className={`mt-4 text-sm ${
              msg.kind === "ok" ? "text-emerald-600" : "text-dhlRed"
            }`}
          >
            {msg.text}
          </p>
        )}

        {/* My recent runs */}
        <section className="mt-8">
          <h2 className="mb-3 font-bold">Your recent runs</h2>
          {acts && acts.activities.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Distance</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {acts.activities.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 tabular-nums">{a.localDate}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatDistance(a.distanceM)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatDuration(a.elapsedSec)}
                      </td>
                      <td className="px-4 py-2 uppercase text-gray-400">
                        {a.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No runs logged yet.</p>
          )}
        </section>
      </main>
    </>
  );
}
