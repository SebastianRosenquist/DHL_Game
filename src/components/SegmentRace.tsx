"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistance, formatDuration, formatPace } from "@/lib/format";
import { type Milestone, currentSegment } from "@/lib/milestones";
import type { TeamStanding } from "@/lib/types";
import RunnerCharacter from "./RunnerCharacter";

const MEDALS = ["🥇", "🥈", "🥉"];
const MAX_PCT = 86;

type Member = {
  id: string;
  name: string;
  runs: number;
  walks: number;
  totalM: number;
  best5kSec: number | null;
  best1kSec: number | null;
  bestPaceSecPerKm: number | null;
  lastRunAt: number | null;
};

export default function SegmentRace({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

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
      {teams.map((t, i) => {
        const seg = currentSegment(t.totalM, milestones);
        const left = seg.progress * MAX_PCT;
        const isExpanded = expanded === t.id;
        const members = cache[t.id] ?? [];

        return (
          <div key={t.id}>
            <div className="grid grid-cols-[minmax(104px,32%)_1fr] items-center gap-3 sm:grid-cols-[220px_1fr]">
              {/* Team info — click to expand */}
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
                    <span className="font-pixel text-[9px] text-gray-400 transition-transform duration-200" style={{ display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                      ▾
                    </span>
                  </div>
                  <div
                    className="text-sm font-bold tabular-nums"
                    style={{ color: t.colorHex }}
                  >
                    {formatDistance(t.totalM)}
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {seg.done ? (
                      <span>All prizes claimed! 🎉</span>
                    ) : (
                      <span>
                        Next: {seg.target!.icon} {seg.target!.label} ·{" "}
                        {formatDistance(seg.remainingM)} to go
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="pixelated relative h-[76px] overflow-hidden rounded-md border-[3px] border-ink bg-pixel-grass shadow-pixel">
                {/* Progress bar behind the runner — commented out because it didn't
                    scale cleanly across screen sizes and was visually confusing
                    versus the runner's own position. */}
                {/* <motion.div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  initial={{ width: "0%" }}
                  animate={{ width: `${seg.progress * 100}%` }}
                  transition={{ type: "spring", stiffness: 40, damping: 20, delay: i * 0.12 }}
                  style={{
                    background: `linear-gradient(to right, ${t.colorHex}55, ${t.colorHex}99)`,
                  }}
                >
                  <motion.div
                    className="absolute right-0 inset-y-0 w-[6px]"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ background: t.colorHex }}
                  />
                </motion.div> */}
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-white/80" />
                <div className="absolute left-2 top-1 font-pixel text-[8px] font-medium text-ink/70">
                  {seg.fromM === 0 ? "START" : `${seg.fromM / 1000}K`}
                </div>
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center">
                  {seg.done ? (
                    <span className="text-2xl drop-shadow">🏆</span>
                  ) : (
                    <motion.div
                      className="flex flex-col items-center"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                    >
                      <span className="text-2xl drop-shadow">{seg.target!.icon}</span>
                      <span className="font-pixel text-[8px] font-semibold text-ink/80">
                        {seg.target!.km}K
                      </span>
                    </motion.div>
                  )}
                </div>
                <motion.div
                  className="absolute bottom-1 z-10 -translate-x-1/2"
                  initial={{ left: "0%" }}
                  animate={{ left: `${seg.done ? MAX_PCT : left}%` }}
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
                  <div className="mt-2 ml-0 sm:ml-[236px] rounded-md border-[3px] border-ink bg-white/80 shadow-pixelSm">
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
                            <th className="px-3 py-2 text-right">Walks</th>
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
                              <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                                {m.walks}
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
