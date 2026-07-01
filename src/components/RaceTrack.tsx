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
      <div className="rounded-md border-[3px] border-dashed border-gray-300 bg-white/60 p-10 text-center font-pixel text-[10px] text-gray-500 shadow-pixelSm">
        NO TEAMS YET — ASK THE ADMIN TO CREATE SOME 🏁
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* milestone ruler */}
      <div className="grid grid-cols-[130px_1fr] gap-3 sm:grid-cols-[180px_1fr]">
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

            <div className="pixelated relative h-[76px] overflow-hidden rounded-md border-[3px] border-ink bg-pixel-grass shadow-pixel">
              {/* dashed running path */}
              <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[3px] border-dashed border-white/80" />

              {/* milestone gates: solid (in team color) once reached, faint ahead */}
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
