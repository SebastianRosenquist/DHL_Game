"use client";

import { motion } from "framer-motion";
import { formatDistance } from "@/lib/format";
import {
  type Milestone,
  hasReached,
  routeFraction,
  sortMilestones,
} from "@/lib/milestones";
import type { TeamStanding } from "@/lib/types";
import RunnerCharacter from "./RunnerCharacter";

const MEDALS = ["🥇", "🥈", "🥉"];
// How far across the track the finish sits (leaves room for the runner).
const MAX_PCT = 92;

export default function RaceTrack({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  const ordered = sortMilestones(milestones);
  const milestonePct = (km: number) => routeFraction(km * 1000, milestones) * MAX_PCT;

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-10 text-center text-gray-500">
        No teams yet. Ask the admin to create some teams to start the race! 🏁
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* milestone ruler */}
      <div className="grid grid-cols-[130px_1fr] gap-3 sm:grid-cols-[180px_1fr]">
        <div className="text-xs font-medium text-gray-400 self-end">
          Route prizes →
        </div>
        <div className="relative h-9">
          {ordered.map((m) => (
            <div
              key={m.id ?? m.km}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${milestonePct(m.km)}%` }}
              title={`${m.label} — ${m.km} km`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <span className="text-[10px] font-medium text-gray-400">
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
        return (
          <div
            key={t.id}
            className="grid grid-cols-[130px_1fr] items-center gap-3 sm:grid-cols-[180px_1fr]"
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
                  {finished && " 🎉"}
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
              {/* dashed running path */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-white/70" />

              {/* milestone gates: solid (in team color) once reached, faint ahead */}
              {ordered.map((m) => {
                const reached = hasReached(t.totalM, m);
                return (
                  <div
                    key={m.id ?? m.km}
                    className="absolute bottom-0 top-0 w-px -translate-x-1/2"
                    style={{
                      left: `${milestonePct(m.km)}%`,
                      background: reached ? t.colorHex : "rgba(255,255,255,0.85)",
                      opacity: reached ? 0.9 : 1,
                    }}
                  >
                    <span
                      className={`absolute top-1 left-1/2 -translate-x-1/2 text-xs ${
                        reached ? "" : "opacity-25 grayscale"
                      }`}
                    >
                      {m.icon}
                    </span>
                  </div>
                );
              })}

              {/* the runner */}
              <motion.div
                className="absolute bottom-1 z-10"
                initial={false}
                animate={{ left: `${left}%` }}
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
