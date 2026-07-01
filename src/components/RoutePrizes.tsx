"use client";

import { formatDistance } from "@/lib/format";
import { type Milestone, hasReached, sortMilestones } from "@/lib/milestones";
import type { TeamStanding } from "@/lib/types";

export default function RoutePrizes({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  if (teams.length === 0 || milestones.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sortMilestones(milestones).map((m) => {
        const reached = teams.filter((t) => hasReached(t.totalM, m));
        const target = m.km * 1000;
        // Closest team still working toward it.
        const chasing = teams
          .filter((t) => !hasReached(t.totalM, m))
          .sort((a, b) => b.totalM - a.totalM)[0];

        return (
          <div
            key={m.id ?? m.km}
            className={`rounded-2xl border p-4 ${
              reached.length
                ? "border-emerald-200 bg-emerald-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl leading-none">{m.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="truncate font-semibold">{m.label}</h3>
                  <span className="text-xs font-medium text-gray-400">
                    {m.km} km
                  </span>
                </div>

                {reached.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {reached.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-emerald-200"
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ background: t.colorHex }}
                        />
                        {t.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    {chasing
                      ? `Not unlocked yet — ${chasing.name} is closest (${formatDistance(
                          Math.max(0, target - chasing.totalM),
                        )} to go)`
                      : "Not unlocked yet."}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
