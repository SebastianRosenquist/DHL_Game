import { sqlite } from "@/lib/db/client";

export type PersonalStats = {
  totalDistanceM: number;
  runDistanceM: number;
  walkDistanceM: number;
  runCount: number;
  walkCount: number;
  totalElapsedSec: number;
  activeDays: number;
  longestRunM: number | null;
  longestWalkM: number | null;
  bestPaceSecPerKm: number | null;
  teamName: string | null;
  teamColor: string | null;
};

/** Totals for the logged-in user's own activities, split by run/walk. */
export function getPersonalStats(userId: string): PersonalStats {
  const rows = sqlite
    .prepare(
      `SELECT activity_type AS activityType,
              COALESCE(SUM(distance_m),0) AS distanceM,
              COUNT(*) AS cnt,
              MAX(distance_m) AS maxDistanceM
       FROM activities WHERE user_id = ? GROUP BY activity_type`,
    )
    .all(userId) as {
    activityType: string;
    distanceM: number;
    cnt: number;
    maxDistanceM: number | null;
  }[];

  const byType = new Map(rows.map((r) => [r.activityType, r]));
  const runDistanceM = byType.get("run")?.distanceM ?? 0;
  const walkDistanceM = byType.get("walk")?.distanceM ?? 0;
  const runCount = byType.get("run")?.cnt ?? 0;
  const walkCount = byType.get("walk")?.cnt ?? 0;

  const overall = sqlite
    .prepare(
      `SELECT COALESCE(SUM(elapsed_sec),0) AS totalElapsedSec,
              COUNT(DISTINCT local_date) AS activeDays
       FROM activities WHERE user_id = ?`,
    )
    .get(userId) as { totalElapsedSec: number; activeDays: number };

  const bestPace = sqlite
    .prepare(
      `SELECT MIN(avg_pace_sec_per_km) AS v FROM activities
       WHERE user_id = ? AND activity_type = 'run' AND avg_pace_sec_per_km IS NOT NULL`,
    )
    .get(userId) as { v: number | null };

  const teamRow = sqlite
    .prepare(
      `SELECT t.name AS name, t.color_hex AS colorHex
       FROM users u JOIN teams t ON t.id = u.team_id
       WHERE u.id = ?`,
    )
    .get(userId) as { name: string; colorHex: string } | undefined;

  return {
    totalDistanceM: runDistanceM + walkDistanceM,
    runDistanceM,
    walkDistanceM,
    runCount,
    walkCount,
    totalElapsedSec: overall.totalElapsedSec,
    activeDays: overall.activeDays,
    longestRunM: byType.get("run")?.maxDistanceM ?? null,
    longestWalkM: byType.get("walk")?.maxDistanceM ?? null,
    bestPaceSecPerKm: bestPace.v,
    teamName: teamRow?.name ?? null,
    teamColor: teamRow?.colorHex ?? null,
  };
}
