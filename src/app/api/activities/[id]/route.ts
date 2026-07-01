import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: delete a single run (e.g. a bogus or mistaken entry). */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  // activity_tracks cascade via FK onDelete.
  db.delete(activities).where(eq(activities.id, id)).run();
  reconcileAll();
  return NextResponse.json({ ok: true });
}
