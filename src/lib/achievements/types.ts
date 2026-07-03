import { z } from "zod";
import { ACTIVITY_TYPES } from "@/lib/activity-type";

/** Computation strategies the engine knows how to run. */
export const STRATEGIES = [
  "min_metric",
  "max_metric",
  "sum_metric",
  "count_distinct_days",
] as const;
export type Strategy = (typeof STRATEGIES)[number];

/**
 * Metrics an admin can target. Each maps to either an activity column or a
 * special daily-rollup. Allow-listed so admin input can never reach raw SQL.
 */
export const METRICS = {
  distanceM: { label: "Distance (m)", column: "distance_m", unit: "distance" },
  fastest5kSec: {
    label: "Fastest 5K time (s)",
    column: "fastest_5k_sec",
    unit: "duration",
  },
  fastest1kSec: {
    label: "Fastest 1K time (s)",
    column: "fastest_1k_sec",
    unit: "duration",
  },
  fastest10kSec: {
    label: "Fastest 10K time (s)",
    column: "fastest_10k_sec",
    unit: "duration",
  },
  avgPaceSecPerKm: {
    label: "Average pace (s/km)",
    column: "avg_pace_sec_per_km",
    unit: "pace",
  },
  elapsedSec: {
    label: "Run duration (s)",
    column: "elapsed_sec",
    unit: "duration",
  },
  dayDistanceM: {
    label: "Distance in a single day (m)",
    column: null, // special: SUM(distance_m) grouped by day
    unit: "distance",
  },
} as const;
export type MetricKey = keyof typeof METRICS;
export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

export const SCOPES = ["individual", "team"] as const;
export type Scope = (typeof SCOPES)[number];

export const WINDOWS = ["all_time", "challenge"] as const;
export type Window = (typeof WINDOWS)[number];

/** Validates an achievement-definition payload from the admin form. */
export const achievementDefInput = z
  .object({
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(280).default(""),
    strategy: z.enum(STRATEGIES),
    metric: z.enum(METRIC_KEYS as [MetricKey, ...MetricKey[]]).optional(),
    scope: z.enum(SCOPES).default("individual"),
    window: z.enum(WINDOWS).default("all_time"),
    activityType: z.enum(ACTIVITY_TYPES).default("run"),
    icon: z.string().trim().min(1).max(8).default("🏆"),
    enabled: z.boolean().default(true),
    sort: z.number().int().default(0),
  })
  .superRefine((val, ctx) => {
    // count_distinct_days needs no metric; everything else does.
    if (val.strategy === "count_distinct_days") return;
    if (!val.metric) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Strategy "${val.strategy}" requires a metric.`,
        path: ["metric"],
      });
      return;
    }
    // dayDistanceM is a daily rollup — only valid with max/min over the day total.
    if (val.metric === "dayDistanceM" && val.strategy === "sum_metric") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use max_metric (not sum) with the single-day distance metric.",
        path: ["strategy"],
      });
    }
  });

export type AchievementDefInput = z.infer<typeof achievementDefInput>;

/** Params blob stored on the definition row. */
export type AchievementParams = {
  metric?: MetricKey;
  requireNotNull?: boolean;
};
