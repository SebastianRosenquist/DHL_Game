import { sqlite } from "@/lib/db/client";
import { METRICS, type AchievementParams, type MetricKey } from "@/lib/achievements/types";
import type {
  AchievementView,
  MetricUnit,
  Standings,
  TeamStanding,
} from "@/lib/types";

function unitForDef(strategy: string, params: AchievementParams): MetricUnit {
  if (strategy === "count_distinct_days") return "count";
  const metric = params.metric as MetricKey | undefined;
  if (metric && METRICS[metric]) return METRICS[metric].unit;
  return "distance";
}

export function getStandings(): Standings {
  const teamsBase = sqlite
    .prepare(`SELECT id, name, character, color_hex AS colorHex FROM teams ORDER BY name`)
    .all() as Pick<TeamStanding, "id" | "name" | "character" | "colorHex">[];

  const totalsRows = sqlite
    .prepare(
      `SELECT team_id AS teamId, COALESCE(SUM(distance_m),0) AS totalM, COUNT(*) AS cnt
       FROM activities GROUP BY team_id`,
    )
    .all() as { teamId: string; totalM: number; cnt: number }[];
  const totalsByTeam = new Map(totalsRows.map((r) => [r.teamId, r]));

  const memberRows = sqlite
    .prepare(`SELECT team_id AS teamId, COUNT(*) AS members FROM users GROUP BY team_id`)
    .all() as { teamId: string; members: number }[];
  const membersByTeam = new Map(memberRows.map((r) => [r.teamId, r.members]));

  const teams: TeamStanding[] = teamsBase
    .map((t) => ({
      ...t,
      totalM: totalsByTeam.get(t.id)?.totalM ?? 0,
      activityCount: totalsByTeam.get(t.id)?.cnt ?? 0,
      memberCount: membersByTeam.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.totalM - a.totalM);

  const maxTotalM = Math.max(1, ...teams.map((t) => t.totalM));

  // Lookups for resolving achievement holders.
  const teamById = new Map(teamsBase.map((t) => [t.id, t]));
  const userRows = sqlite
    .prepare(`SELECT id, name, team_id AS teamId FROM users`)
    .all() as { id: string; name: string; teamId: string }[];
  const userById = new Map(userRows.map((u) => [u.id, u]));

  const defRows = sqlite
    .prepare(
      `SELECT d.id, d.title, d.description, d.icon, d.scope, d.strategy, d.params,
              aw.value AS value, aw.user_id AS userId, aw.team_id AS teamId
       FROM achievement_definitions d
       LEFT JOIN achievement_awards aw ON aw.definition_id = d.id
       WHERE d.enabled = 1
       ORDER BY d.sort, d.title`,
    )
    .all() as {
    id: string;
    title: string;
    description: string;
    icon: string;
    scope: string;
    strategy: string;
    params: string;
    value: number | null;
    userId: string | null;
    teamId: string | null;
  }[];

  const achievements: AchievementView[] = defRows.map((d) => {
    const params = JSON.parse(d.params || "{}") as AchievementParams;
    const user = d.userId ? userById.get(d.userId) : null;
    const teamId = d.teamId ?? user?.teamId ?? null;
    const team = teamId ? teamById.get(teamId) : null;
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      scope: d.scope,
      unit: unitForDef(d.strategy, params),
      value: d.value,
      holderName: user?.name ?? null,
      teamName: team?.name ?? null,
      teamColor: team?.colorHex ?? null,
    };
  });

  const totals = sqlite
    .prepare(
      `SELECT COALESCE(SUM(distance_m),0) AS distanceM, COUNT(*) AS activities
       FROM activities`,
    )
    .get() as { distanceM: number; activities: number };
  const runners = (
    sqlite.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }
  ).c;

  const milestones = sqlite
    .prepare(`SELECT id, km, label, subtitle, icon FROM milestones ORDER BY km`)
    .all() as {
    id: string;
    km: number;
    label: string;
    subtitle: string;
    icon: string;
  }[];

  return {
    teams,
    maxTotalM,
    milestones,
    achievements,
    totals: { distanceM: totals.distanceM, runners, activities: totals.activities },
  };
}
