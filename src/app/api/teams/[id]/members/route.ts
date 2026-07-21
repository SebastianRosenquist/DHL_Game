import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** Public: per-member stats for a single team. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const members = sqlite
    .prepare(
      `SELECT u.id, u.name,
              SUM(CASE WHEN a.activity_type = 'run' THEN 1 ELSE 0 END)  AS runs,
              SUM(CASE WHEN a.activity_type = 'walk' THEN 1 ELSE 0 END) AS walks,
              COALESCE(SUM(a.distance_m), 0)     AS totalM,
              MIN(a.fastest_5k_sec)              AS best5kSec,
              MIN(a.fastest_1k_sec)              AS best1kSec,
              MIN(a.avg_pace_sec_per_km)         AS bestPaceSecPerKm,
              MAX(a.started_at)                  AS lastRunAt
       FROM users u
       LEFT JOIN activities a ON a.user_id = u.id
       WHERE u.team_id = ?
       GROUP BY u.id
       ORDER BY totalM DESC`,
    )
    .all(id);

  return NextResponse.json({ members });
}
