import type { Scope, Strategy } from "./types";

/** Seeded on first boot. The admin can edit, disable, or delete any of these. */
export type DefaultDefinition = {
  title: string;
  description: string;
  strategy: Strategy;
  metric?: string;
  scope: Scope;
  icon: string;
  sort: number;
};

export const DEFAULT_ACHIEVEMENTS: DefaultDefinition[] = [
  {
    title: "Fastest 5K",
    description: "Quickest 5 km on a single run.",
    strategy: "min_metric",
    metric: "fastest5kSec",
    scope: "individual",
    icon: "⚡",
    sort: 10,
  },
  {
    title: "Longest Single Run",
    description: "Greatest distance covered in one run.",
    strategy: "max_metric",
    metric: "distanceM",
    scope: "individual",
    icon: "🏔️",
    sort: 20,
  },
  {
    title: "Biggest Single Day",
    description: "Most distance run across one calendar day.",
    strategy: "max_metric",
    metric: "dayDistanceM",
    scope: "individual",
    icon: "☀️",
    sort: 30,
  },
  {
    title: "Most Distance (Individual)",
    description: "Top total distance by one runner.",
    strategy: "sum_metric",
    metric: "distanceM",
    scope: "individual",
    icon: "👟",
    sort: 40,
  },
  {
    title: "Most Distance (Team)",
    description: "Top total distance across a whole team.",
    strategy: "sum_metric",
    metric: "distanceM",
    scope: "team",
    icon: "🚩",
    sort: 50,
  },
  {
    title: "Most Active Days",
    description: "Most distinct days with at least one run.",
    strategy: "count_distinct_days",
    scope: "individual",
    icon: "📅",
    sort: 60,
  },
];
