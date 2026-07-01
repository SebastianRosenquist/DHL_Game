import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: list a single user's runs (for review / deletion). */
export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rows = db
    .select({
      id: activities.id,
      distanceM: activities.distanceM,
      elapsedSec: activities.elapsedSec,
      localDate: activities.localDate,
      source: activities.source,
    })
    .from(activities)
    .where(eq(activities.userId, id))
    .orderBy(desc(activities.startedAt))
    .all();
  return NextResponse.json({ activities: rows });
}
