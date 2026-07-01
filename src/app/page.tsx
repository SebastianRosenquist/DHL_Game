"use client";

import { useState } from "react";
import useSWR from "swr";
import AchievementBadges from "@/components/AchievementBadges";
import Nav from "@/components/Nav";
import RaceTrack from "@/components/RaceTrack";
import RoutePrizes from "@/components/RoutePrizes";
import SegmentRace from "@/components/SegmentRace";
import { fetcher } from "@/lib/fetcher";
import { formatDistance } from "@/lib/format";
import type { Standings } from "@/lib/types";

type RaceView = "next" | "full";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
      <div className="text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [view, setView] = useState<RaceView>("next");
  // Poll every 5s so the race updates live as people log runs.
  const { data, isLoading } = useSWR<Standings>("/api/standings", fetcher, {
    refreshInterval: 5000,
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              The Big Team Run 🏁
            </h1>
            <p className="text-gray-500">
              Log your runs, push your team across the map, and grab the prizes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Total distance"
              value={data ? formatDistance(data.totals.distanceM) : "—"}
            />
            <Stat label="Runners" value={data ? String(data.totals.runners) : "—"} />
            <Stat
              label="Runs logged"
              value={data ? String(data.totals.activities) : "—"}
            />
          </div>
        </div>

        <section className="mb-8 rounded-3xl bg-white/70 p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">🏆 The Race</h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
                <button
                  onClick={() => setView("next")}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    view === "next" ? "bg-white shadow text-ink" : "text-gray-500"
                  }`}
                >
                  Race to next prize
                </button>
                <button
                  onClick={() => setView("full")}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    view === "full" ? "bg-white shadow text-ink" : "text-gray-500"
                  }`}
                >
                  Full route
                </button>
              </div>
              <span className="hidden text-xs text-gray-400 sm:inline">
                Updates live
              </span>
            </div>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            {view === "next"
              ? "Each team races to their next checkpoint — reach it and the goal jumps to the next prize."
              : "Everyone on the same 100 km line — see how the teams stack up overall."}
          </p>
          {isLoading && !data ? (
            <div className="py-10 text-center text-gray-400">Loading the race…</div>
          ) : view === "next" ? (
            <SegmentRace
              teams={data?.teams ?? []}
              milestones={data?.milestones ?? []}
            />
          ) : (
            <RaceTrack
              teams={data?.teams ?? []}
              milestones={data?.milestones ?? []}
            />
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-1 text-lg font-bold">🎁 Route Prizes</h2>
          <p className="mb-4 text-sm text-gray-500">
            Every team unlocks these by reaching the distance checkpoints along the
            100 km route.
          </p>
          <RoutePrizes
            teams={data?.teams ?? []}
            milestones={data?.milestones ?? []}
          />
        </section>

        <section>
          <h2 className="mb-1 text-lg font-bold">🎖️ Prizes &amp; Achievements</h2>
          <p className="mb-4 text-sm text-gray-500">
            Competitive records — one current holder each.
          </p>
          <AchievementBadges achievements={data?.achievements ?? []} />
        </section>
      </main>
    </>
  );
}
