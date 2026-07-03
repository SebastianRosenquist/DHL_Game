"use client";

import type { GapInfo } from "@/lib/achievement-gaps";
import { formatMetricValue } from "@/lib/format";
import type { AchievementView, MetricUnit } from "@/lib/types";

/** Wording for "how far behind" that reads naturally per metric unit. */
function gapLabel(unit: MetricUnit, gap: number): string {
  if (unit === "count") {
    const n = Math.round(gap);
    return `${n} fewer day${n === 1 ? "" : "s"}`;
  }
  const formatted = formatMetricValue(unit, gap);
  return unit === "distance" ? `${formatted} behind` : `${formatted} slower`;
}

export default function AchievementBadges({
  achievements,
  gaps,
}: {
  achievements: AchievementView[];
  gaps?: Record<string, GapInfo>;
}) {
  if (achievements.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No achievements configured yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a) => {
        const held = a.value != null;
        const gap = gaps?.[a.id];
        return (
          <div
            key={a.id}
            className={`rounded-2xl border p-4 transition ${
              held
                ? "border-amber-200 bg-amber-50"
                : "border-gray-200 bg-white opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl leading-none">{a.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{a.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                    {a.scope}
                  </span>
                </div>
                {a.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{a.description}</p>
                )}

                {held ? (
                  <div className="mt-2">
                    <div className="text-lg font-bold tabular-nums">
                      {formatMetricValue(a.unit, a.value as number)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm">
                      {a.teamColor && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ background: a.teamColor }}
                        />
                      )}
                      <span className="font-medium">
                        {a.holderName ?? a.teamName ?? "—"}
                      </span>
                      {a.holderName && a.teamName && (
                        <span className="text-gray-400">· {a.teamName}</span>
                      )}
                    </div>
                    {gap?.status === "holder" && (
                      <div className="mt-1 text-xs font-semibold text-amber-700">
                        🎉 This is your record!
                      </div>
                    )}
                    {gap?.status === "behind" && (
                      <div className="mt-1 text-xs text-gray-500">
                        You're {gapLabel(a.unit, gap.gap)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-sm italic text-gray-400">
                    Up for grabs!
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
