"use client";

import { useState } from "react";
import useSWR from "swr";
import AchievementBadges from "@/components/AchievementBadges";
import Cheerleaders from "@/components/Cheerleaders";
import Nav from "@/components/Nav";
import RaceTrack from "@/components/RaceTrack";
import RoutePrizes from "@/components/RoutePrizes";
import SegmentRace from "@/components/SegmentRace";
import Tutorial from "@/components/Tutorial";
import type { GapInfo } from "@/lib/achievement-gaps";
import { fetcher } from "@/lib/fetcher";
import { formatDistance } from "@/lib/format";
import type { PersonalStats } from "@/lib/personal-stats";
import type { Me, Standings } from "@/lib/types";

type RaceView = "next" | "full";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-[3px] border-ink bg-white px-4 py-3 shadow-pixel">
      <div className="font-pixel text-lg tabular-nums leading-tight text-ink">
        {value}
      </div>
      <div className="mt-1 font-pixel text-[8px] uppercase tracking-widest text-gray-500">
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [view, setView] = useState<RaceView>("next");
  // Poll every 5s so the race updates live as people log runs.
  const { data, isLoading } = useSWR<Standings>("/api/standings", fetcher, {
    refreshInterval: 5000,
  });
  const { data: me } = useSWR<Me>("/api/me", fetcher);
  const { data: gapsData } = useSWR<{ gaps: Record<string, GapInfo> }>(
    me?.user ? "/api/me/achievement-gaps" : null,
    fetcher,
  );
  const { data: statsData } = useSWR<{ stats: PersonalStats | null }>(
    me?.user ? "/api/me/stats" : null,
    fetcher,
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-pixel text-[10px] uppercase tracking-widest text-dhlRed">
              ★ Thursdays ★
            </div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              DHL Team Challenge 🏁
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

        <section
          id="race-section"
          className="mb-8 rounded-lg border-[3px] border-ink bg-white/80 p-4 shadow-pixel sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-pixel text-sm text-ink">🏆 THE RACE</h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border-2 border-ink bg-white p-1 text-sm shadow-pixelSm">
                <button
                  onClick={() => setView("next")}
                  className={`rounded px-3 py-1 font-pixel text-[9px] uppercase tracking-wide transition ${
                    view === "next" ? "bg-ink text-white" : "text-gray-500"
                  }`}
                >
                  Next Prize
                </button>
                <button
                  onClick={() => setView("full")}
                  className={`rounded px-3 py-1 font-pixel text-[9px] uppercase tracking-wide transition ${
                    view === "full" ? "bg-ink text-white" : "text-gray-500"
                  }`}
                >
                  Full Route
                </button>
              </div>
              <span className="hidden font-pixel text-[8px] uppercase text-gray-400 sm:inline">
                Live
              </span>
            </div>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            {view === "next"
              ? "Each team races to their next checkpoint — reach it and the goal jumps to the next prize."
              : "Everyone on the same route — see how the teams stack up overall."}
          </p>
          {isLoading && !data ? (
            <div className="py-10 text-center font-pixel text-[10px] text-gray-400">
              LOADING THE RACE…
            </div>
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

          <Cheerleaders
            teams={data?.teams ?? []}
            milestones={data?.milestones ?? []}
          />
        </section>

        <section id="route-prizes" className="mb-8">
          <h2 className="mb-1 font-pixel text-sm text-ink">🎁 ROUTE PRIZES</h2>
          <p className="mb-4 text-sm text-gray-500">
            Every team unlocks these by reaching the distance checkpoints along the
            route.
          </p>
          <RoutePrizes
            teams={data?.teams ?? []}
            milestones={data?.milestones ?? []}
          />
        </section>

        <section id="achievements">
          <h2 className="mb-1 font-pixel text-sm text-ink">
            🎖️ PRIZES &amp; ACHIEVEMENTS
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Competitive records — one current holder each.
          </p>
          <AchievementBadges
            achievements={data?.achievements ?? []}
            gaps={gapsData?.gaps}
          />
        </section>

        {me?.user && statsData?.stats && (
          <section id="my-stats" className="mt-8">
            <h2 className="mb-1 font-pixel text-sm text-ink">🏃 YOUR STATS</h2>
            <p className="mb-4 text-sm text-gray-500">
              Your personal totals across every run and walk you've logged.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Total distance"
                value={formatDistance(statsData.stats.totalDistanceM)}
              />
              <Stat label="Runs" value={String(statsData.stats.runCount)} />
              <Stat label="Walks" value={String(statsData.stats.walkCount)} />
              <Stat label="Team" value={statsData.stats.teamName ?? "—"} />
            </div>
          </section>
        )}
      </main>

      <Tutorial />
    </>
  );
}
