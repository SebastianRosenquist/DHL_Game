"use client";

import { motion } from "framer-motion";
import { formatDistance } from "@/lib/format";
import { type Milestone, currentSegment } from "@/lib/milestones";
import type { TeamStanding } from "@/lib/types";
import RunnerCharacter from "./RunnerCharacter";

const MEDALS = ["🥇", "🥈", "🥉"];
const MAX_PCT = 86; // leave room for the goal flag at the right

export default function SegmentRace({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-10 text-center text-gray-500">
        No teams yet. Ask the admin to create some teams to start the race! 🏁
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((t, i) => {
        const seg = currentSegment(t.totalM, milestones);
        const left = seg.progress * MAX_PCT;

        return (
          <div
            key={t.id}
            className="grid grid-cols-[150px_1fr] items-center gap-3 sm:grid-cols-[220px_1fr]"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xl tabular-nums">
                {MEDALS[i] ?? `#${i + 1}`}
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold leading-tight">
                  {t.name}
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
            </div>

            <div
              className="relative h-[72px] overflow-hidden rounded-2xl border border-emerald-200 shadow-inner"
              style={{
                background:
                  "linear-gradient(180deg,#e9fbef 0%,#c9f3d6 55%,#b6ecc6 100%)",
              }}
            >
              {/* progress fill in team color */}
              <motion.div
                className="absolute inset-y-0 left-0"
                initial={false}
                animate={{ width: `${seg.progress * 100}%` }}
                transition={{ type: "spring", stiffness: 55, damping: 18 }}
                style={{ background: t.colorHex, opacity: 0.18 }}
              />

              {/* dashed running path */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-white/70" />

              {/* leg start marker (previous milestone or START) */}
              <div className="absolute left-2 top-1.5 text-[10px] font-medium text-gray-500">
                {seg.fromM === 0 ? "START" : `${seg.fromM / 1000}k`}
              </div>

              {/* the goal flag at the right */}
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center">
                {seg.done ? (
                  <span className="text-2xl drop-shadow">🏆</span>
                ) : (
                  <motion.div
                    className="flex flex-col items-center"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  >
                    <span className="text-2xl drop-shadow">
                      {seg.target!.icon}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {seg.target!.km}k
                    </span>
                  </motion.div>
                )}
              </div>

              {/* the runner */}
              <motion.div
                className="absolute bottom-1 z-10"
                initial={false}
                animate={{ left: `${seg.done ? MAX_PCT : left}%` }}
                transition={{ type: "spring", stiffness: 55, damping: 18 }}
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
        );
      })}
    </div>
  );
}
