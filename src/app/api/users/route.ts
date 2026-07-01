import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sqlite } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** Admin: list all users with their team + activity stats. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = sqlite
    .prepare(
      `SELECT u.id, u.name, u.team_id AS teamId, t.name AS teamName,
              t.color_hex AS teamColor,
              COUNT(a.id) AS runs,
              COALESCE(SUM(a.distance_m), 0) AS totalM
       FROM users u
       JOIN teams t ON t.id = u.team_id
       LEFT JOIN activities a ON a.user_id = u.id
       GROUP BY u.id
       ORDER BY u.name`,
    )
    .all();
  return NextResponse.json({ users });
}
