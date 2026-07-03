import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { currentUserId } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db } from "@/lib/db/client";
import { activities, users } from "@/lib/db/schema";
import { ingestActivity } from "@/lib/ingest";
import { manualActivityInput } from "@/lib/validation";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ activities: [] });
  const rows = db
    .select()
    .from(activities)
    .where(eq(activities.userId, uid))
    .orderBy(desc(activities.startedAt))
    .limit(50)
    .all();
  return NextResponse.json({ activities: rows });
}

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) {
    return NextResponse.json({ error: "Join a team first." }, { status: 401 });
  }
  const user = db.select().from(users).where(eq(users.id, uid)).get();
  if (!user) {
    return NextResponse.json({ error: "Join a team first." }, { status: 401 });
  }

  const parsed = manualActivityInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { distanceKm, hours, minutes, seconds, date, activityType } = parsed.data;
  const elapsedSec = hours * 3600 + minutes * 60 + seconds;
  if (elapsedSec <= 0) {
    return NextResponse.json({ error: "Enter a duration." }, { status: 400 });
  }
  // Anchor at midday UTC so the calendar date can't drift across time zones.
  const startedAt = Date.parse(`${date}T12:00:00Z`);

  const result = ingestActivity(uid, user.teamId, {
    distanceM: distanceKm * 1000,
    elapsedSec,
    startedAt,
    source: "manual",
    activityType,
  });

  if (result.status === "rejected") {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }
  if (result.status === "created") reconcileAll();
  return NextResponse.json(result);
}
