import { sqlite } from "@/lib/db/client";

export type PersonalStats = {
  totalDistanceM: number;
  runDistanceM: number;
  walkDistanceM: number;
  runCount: number;
  walkCount: number;
  teamName: string | null;
  teamColor: string | null;
};

/** Totals for the logged-in user's own activities, split by run/walk. */
export function getPersonalStats(userId: string): PersonalStats {
  const rows = sqlite
    .prepare(
      `SELECT activity_type AS activityType, COALESCE(SUM(distance_m),0) AS distanceM, COUNT(*) AS cnt
       FROM activities WHERE user_id = ? GROUP BY activity_type`,
    )
    .all(userId) as { activityType: string; distanceM: number; cnt: number }[];

  const byType = new Map(rows.map((r) => [r.activityType, r]));
  const runDistanceM = byType.get("run")?.distanceM ?? 0;
  const walkDistanceM = byType.get("walk")?.distanceM ?? 0;
  const runCount = byType.get("run")?.cnt ?? 0;
  const walkCount = byType.get("walk")?.cnt ?? 0;

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
    teamName: teamRow?.name ?? null,
    teamColor: teamRow?.colorHex ?? null,
  };
}
