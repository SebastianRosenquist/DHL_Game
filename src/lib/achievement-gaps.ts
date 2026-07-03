import { computeOwnValue, type DefRow } from "@/lib/achievements/engine";
import { sqlite } from "@/lib/db/client";

export type GapInfo =
  | { status: "holder" }
  | { status: "no_data" }
  | { status: "behind"; gap: number };

/**
 * For each enabled achievement, work out whether this user (or their team,
 * for team-scoped achievements) currently holds it, and if not, how far
 * behind the current leader they are on that same metric/activity type.
 */
export function getAchievementGaps(userId: string): Record<string, GapInfo> {
  const user = sqlite
    .prepare(`SELECT team_id AS teamId FROM users WHERE id = ?`)
    .get(userId) as { teamId: string } | undefined;
  if (!user) return {};

  const defs = sqlite
    .prepare(`SELECT * FROM achievement_definitions WHERE enabled = 1`)
    .all() as DefRow[];

  const gaps: Record<string, GapInfo> = {};

  for (const def of defs) {
    const award = sqlite
      .prepare(
        `SELECT user_id AS userId, team_id AS teamId, value
         FROM achievement_awards WHERE definition_id = ?`,
      )
      .get(def.id) as { userId: string | null; teamId: string | null; value: number } | undefined;

    // No one holds it yet — nothing to show as "behind".
    if (!award) continue;

    const isHolder =
      def.scope === "team" ? award.teamId === user.teamId : award.userId === userId;
    if (isHolder) {
      gaps[def.id] = { status: "holder" };
      continue;
    }

    const ownValue = computeOwnValue(def, { userId, teamId: user.teamId });
    if (ownValue == null) {
      gaps[def.id] = { status: "no_data" };
      continue;
    }

    // Lower is better for min_metric; higher is better for everything else.
    const gap =
      def.strategy === "min_metric" ? ownValue - award.value : award.value - ownValue;
    gaps[def.id] = { status: "behind", gap: Math.max(0, gap) };
  }

  return gaps;
}
