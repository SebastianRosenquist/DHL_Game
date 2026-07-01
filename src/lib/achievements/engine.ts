import { randomUUID } from "node:crypto";
import { sqlite } from "@/lib/db/client";
import { METRICS, type AchievementParams, type MetricKey } from "./types";

type DefRow = {
  id: string;
  strategy: string;
  params: string;
  scope: string;
  is_record_holder: number;
  enabled: number;
};

type Candidate = {
  value: number;
  userId: string | null;
  teamId: string | null;
  sourceActivityId: string | null;
} | null;

/** Map an admin-chosen metric to its real column, via the allowlist. */
function columnFor(metric: MetricKey | undefined): string | null {
  if (!metric) return null;
  const def = METRICS[metric];
  return def ? def.column : null;
}

function computeCandidate(def: DefRow): Candidate {
  const params = JSON.parse(def.params || "{}") as AchievementParams;
  const metric = params.metric;
  const scope = def.scope === "team" ? "team" : "individual";

  // Most active days.
  if (def.strategy === "count_distinct_days") {
    const groupCol = scope === "team" ? "team_id" : "user_id";
    const row = sqlite
      .prepare(
        `SELECT ${groupCol} AS gid,
                ${scope === "team" ? "NULL" : "team_id"} AS team_id,
                COUNT(DISTINCT local_date) AS v
         FROM activities GROUP BY ${groupCol}
         ORDER BY v DESC LIMIT 1`,
      )
      .get() as { gid: string; team_id: string | null; v: number } | undefined;
    if (!row || row.v <= 0) return null;
    return scope === "team"
      ? { value: row.v, userId: null, teamId: row.gid, sourceActivityId: null }
      : {
          value: row.v,
          userId: row.gid,
          teamId: row.team_id,
          sourceActivityId: null,
        };
  }

  // Single-day distance rollup (max/min of SUM per day).
  if (metric === "dayDistanceM") {
    const dir = def.strategy === "min_metric" ? "ASC" : "DESC";
    if (scope === "team") {
      const row = sqlite
        .prepare(
          `SELECT team_id, SUM(distance_m) AS v
           FROM activities GROUP BY team_id, local_date
           ORDER BY v ${dir} LIMIT 1`,
        )
        .get() as { team_id: string; v: number } | undefined;
      if (!row) return null;
      return { value: row.v, userId: null, teamId: row.team_id, sourceActivityId: null };
    }
    const row = sqlite
      .prepare(
        `SELECT user_id, team_id, SUM(distance_m) AS v
         FROM activities GROUP BY user_id, local_date
         ORDER BY v ${dir} LIMIT 1`,
      )
      .get() as { user_id: string; team_id: string; v: number } | undefined;
    if (!row) return null;
    return {
      value: row.v,
      userId: row.user_id,
      teamId: row.team_id,
      sourceActivityId: null,
    };
  }

  const col = columnFor(metric);
  if (!col) return null;

  // Sum of a column, grouped by holder.
  if (def.strategy === "sum_metric") {
    const groupCol = scope === "team" ? "team_id" : "user_id";
    const row = sqlite
      .prepare(
        `SELECT ${groupCol} AS gid,
                ${scope === "team" ? "NULL" : "team_id"} AS team_id,
                SUM(${col}) AS v
         FROM activities WHERE ${col} IS NOT NULL
         GROUP BY ${groupCol} ORDER BY v DESC LIMIT 1`,
      )
      .get() as { gid: string; team_id: string | null; v: number } | undefined;
    if (!row || row.v == null) return null;
    return scope === "team"
      ? { value: row.v, userId: null, teamId: row.gid, sourceActivityId: null }
      : {
          value: row.v,
          userId: row.gid,
          teamId: row.team_id,
          sourceActivityId: null,
        };
  }

  // min/max of a per-activity column: pick the single best activity.
  const dir = def.strategy === "min_metric" ? "ASC" : "DESC";
  const row = sqlite
    .prepare(
      `SELECT id, user_id, team_id, ${col} AS v
       FROM activities WHERE ${col} IS NOT NULL
       ORDER BY v ${dir} LIMIT 1`,
    )
    .get() as
    | { id: string; user_id: string; team_id: string; v: number }
    | undefined;
  if (!row) return null;
  return {
    value: row.v,
    userId: scope === "team" ? null : row.user_id,
    teamId: row.team_id,
    sourceActivityId: row.id,
  };
}

/**
 * Recompute every enabled achievement from scratch and update the current
 * award + transition history. Cheap at team scale; called after any data change.
 */
export function reconcileAll() {
  const defs = sqlite
    .prepare(`SELECT * FROM achievement_definitions WHERE enabled = 1`)
    .all() as DefRow[];

  const now = Date.now();
  const tx = sqlite.transaction(() => {
    for (const def of defs) {
      const cand = computeCandidate(def);
      const existing = sqlite
        .prepare(`SELECT * FROM achievement_awards WHERE definition_id = ?`)
        .get(def.id) as
        | {
            id: string;
            user_id: string | null;
            team_id: string | null;
            value: number;
          }
        | undefined;

      // No eligible data: drop any stale award.
      if (!cand) {
        if (existing) {
          closeHistory(def.id, now);
          sqlite
            .prepare(`DELETE FROM achievement_awards WHERE definition_id = ?`)
            .run(def.id);
        }
        continue;
      }

      const sameHolder =
        existing &&
        existing.user_id === cand.userId &&
        existing.team_id === cand.teamId &&
        existing.value === cand.value;
      if (sameHolder) continue;

      if (existing) {
        closeHistory(def.id, now);
        sqlite
          .prepare(`DELETE FROM achievement_awards WHERE definition_id = ?`)
          .run(def.id);
      }

      sqlite
        .prepare(
          `INSERT INTO achievement_awards
             (id, definition_id, user_id, team_id, value, source_activity_id, awarded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          def.id,
          cand.userId,
          cand.teamId,
          cand.value,
          cand.sourceActivityId,
          now,
        );

      sqlite
        .prepare(
          `INSERT INTO achievement_history
             (id, definition_id, user_id, team_id, value, started_at, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        )
        .run(randomUUID(), def.id, cand.userId, cand.teamId, cand.value, now);
    }
  });
  tx();
}

function closeHistory(definitionId: string, now: number) {
  sqlite
    .prepare(
      `UPDATE achievement_history SET ended_at = ?
       WHERE definition_id = ? AND ended_at IS NULL`,
    )
    .run(now, definitionId);
}
