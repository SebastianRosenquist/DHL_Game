"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistance, formatDuration, formatPace } from "@/lib/format";
import {
  type Milestone,
  hasReached,
  routeFraction,
  sortMilestones,
} from "@/lib/milestones";
import type { TeamStanding } from "@/lib/types";
import RunnerCharacter from "./RunnerCharacter";

const MEDALS = ["🥇", "🥈", "🥉"];
const MAX_PCT = 92;

type Member = {
  id: string;
  name: string;
  runs: number;
  totalM: number;
  best5kSec: number | null;
  best1kSec: number | null;
  bestPaceSecPerKm: number | null;
  lastRunAt: number | null;
};

export default function RaceTrack({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const ordered = sortMilestones(milestones);
  const milestonePct = (km: number) => routeFraction(km * 1000, milestones) * MAX_PCT;

  async function toggleTeam(teamId: string) {
    if (expanded === teamId) {
      setExpanded(null);
      return;
    }
    setExpanded(teamId);
    if (!cache[teamId]) {
      setLoading(teamId);
      const res = await fetch(`/api/teams/${teamId}/members`);
      const data = await res.json();
      setCache((prev) => ({ ...prev, [teamId]: data.members }));
      setLoading(null);
    }
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-md border-[3px] border-dashed border-gray-300 bg-white/60 p-10 text-center font-pixel text-[10px] text-gray-500 shadow-pixelSm">
        NO TEAMS YET — ASK THE ADMIN TO CREATE SOME 🏁
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* milestone ruler */}
      <div className="grid grid-cols-[minmax(96px,30%)_1fr] gap-3 sm:grid-cols-[180px_1fr]">
        <div className="self-end font-pixel text-[9px] uppercase tracking-wider text-gray-400">
          Route prizes →
        </div>
        <div className="relative h-9 rounded-md bg-pixel-sky border-[3px] border-ink shadow-pixelSm">
          {ordered.map((m) => (
            <div
              key={m.id ?? m.km}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${milestonePct(m.km)}%`, top: 2 }}
              title={`${m.label} — ${m.km} km`}
            >
              <span className="text-base leading-none drop-shadow">{m.icon}</span>
              <span className="font-pixel text-[8px] font-medium text-ink/70">
                {m.km}k
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* lanes */}
      {teams.map((t, i) => {
        const left = routeFraction(t.totalM, milestones) * MAX_PCT;
        const finished =
          ordered.length > 0 &&
          t.totalM >= ordered[ordered.length - 1].km * 1000;
        const isExpanded = expanded === t.id;
        const members = cache[t.id] ?? [];

        return (
          <div key={t.id}>
            <div className="grid grid-cols-[minmax(96px,30%)_1fr] items-center gap-3 sm:grid-cols-[180px_1fr]">
              <button
                onClick={() => toggleTeam(t.id)}
                className="flex items-center gap-2 overflow-hidden text-left"
              >
                <span className="text-xl tabular-nums">
                  {MEDALS[i] ?? `#${i + 1}`}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-semibold leading-tight">
                      {t.name}
                    </span>
                    <span
                      className="font-pixel text-[9px] text-gray-400 transition-transform duration-200"
                      style={{ display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      ▾
                    </span>
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums"
                    style={{ color: t.colorHex }}
                  >
                    {formatDistance(t.totalM)}
                    {finished && " 🎉"}
                  </div>
                </div>
              </button>

              <div className="pixelated relative h-[76px] overflow-hidden rounded-md border-[3px] border-ink bg-pixel-grass shadow-pixel">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-white/80" />
                {ordered.map((m) => {
                  const reached = hasReached(t.totalM, m);
                  return (
                    <div
                      key={m.id ?? m.km}
                      className="absolute bottom-0 top-0 w-[2px] -translate-x-1/2"
                      style={{
                        left: `${milestonePct(m.km)}%`,
                        background: reached ? t.colorHex : "rgba(26,26,26,0.35)",
                      }}
                    >
                      <span
                        className={`absolute top-1 left-1/2 -translate-x-1/2 text-sm drop-shadow ${
                          reached ? "" : "opacity-30 grayscale"
                        }`}
                      >
                        {m.icon}
                      </span>
                    </div>
                  );
                })}
                <motion.div
                  className="absolute bottom-1 z-10 -translate-x-1/2"
                  initial={{ left: "0%" }}
                  animate={{ left: `${left}%` }}
                  transition={{ type: "spring", stiffness: 40, damping: 20, delay: i * 0.12 }}
                >
                  <RunnerCharacter
                    character={t.character}
                    color={t.colorHex}
                    running={t.totalM > 0}
                    size={48}
                  />
                </motion.div>
              </div>
            </div>

            {/* Expandable member stats panel */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 ml-0 sm:ml-[192px] rounded-md border-[3px] border-ink bg-white/80 shadow-pixelSm">
                    {loading === t.id ? (
                      <div className="py-4 text-center font-pixel text-[9px] text-gray-400">
                        LOADING…
                      </div>
                    ) : members.length === 0 ? (
                      <div className="py-4 text-center font-pixel text-[9px] text-gray-400">
                        NO MEMBERS YET
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-[2px] border-ink/10 font-pixel text-[8px] uppercase tracking-wider text-gray-400">
                            <th className="px-3 py-2 text-left">Runner</th>
                            <th className="px-3 py-2 text-right">Distance</th>
                            <th className="px-3 py-2 text-right">Runs</th>
                            <th className="hidden px-3 py-2 text-right sm:table-cell">Best 5K</th>
                            <th className="hidden px-3 py-2 text-right sm:table-cell">Best pace</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((m, mi) => (
                            <tr
                              key={m.id}
                              className={mi < members.length - 1 ? "border-b border-ink/10" : ""}
                            >
                              <td className="px-3 py-2 font-semibold" style={{ color: t.colorHex }}>
                                {m.name}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatDistance(m.totalM)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                                {m.runs}
                              </td>
                              <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">
                                {m.best5kSec ? formatDuration(m.best5kSec) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">
                                {m.bestPaceSecPerKm ? formatPace(m.bestPaceSecPerKm) : <span className="text-gray-300">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
