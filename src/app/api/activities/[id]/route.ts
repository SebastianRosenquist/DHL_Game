import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { currentUserId, isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";
import { updateActivity } from "@/lib/ingest";
import { manualActivityInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Owner or admin: edit a manually logged activity's distance/time/date/type. */
export async function PATCH(req: Request, { params }: Ctx) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const activity = db.select().from(activities).where(eq(activities.id, id)).get();
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (activity.userId !== uid && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
  const startedAt = Date.parse(`${date}T12:00:00Z`);

  const result = updateActivity(id, {
    distanceM: distanceKm * 1000,
    elapsedSec,
    startedAt,
    source: "manual",
    activityType,
  });

  if (result.status === "rejected") {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }
  if (result.status === "updated") reconcileAll();
  return NextResponse.json(result);
}

/** Owner or admin: delete a single run/walk (e.g. a bogus or mistaken entry). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const activity = db.select().from(activities).where(eq(activities.id, id)).get();
  if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (activity.userId !== uid && !(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // activity_tracks cascade via FK onDelete.
  db.delete(activities).where(eq(activities.id, id)).run();
  reconcileAll();
  return NextResponse.json({ ok: true });
}
