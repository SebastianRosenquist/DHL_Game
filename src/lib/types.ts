// Client-safe view types shared between the API and React components.
// (No server-only imports here, so client bundles can import these freely.)

import type { Milestone } from "@/lib/milestones";

export type TeamStanding = {
  id: string;
  name: string;
  character: string;
  colorHex: string;
  totalM: number;
  memberCount: number;
  activityCount: number;
};

export type MetricUnit = "distance" | "duration" | "pace" | "count";

export type AchievementView = {
  id: string;
  title: string;
  description: string;
  icon: string;
  scope: string;
  unit: MetricUnit;
  value: number | null;
  holderName: string | null;
  teamName: string | null;
  teamColor: string | null;
};

export type Standings = {
  teams: TeamStanding[];
  maxTotalM: number;
  milestones: Milestone[];
  achievements: AchievementView[];
  totals: { distanceM: number; runners: number; activities: number };
};
