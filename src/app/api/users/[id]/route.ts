import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db, sqlite } from "@/lib/db/client";
import { activities, teams, users } from "@/lib/db/schema";
import { userEditInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: rename a user and/or move them (and their runs) to another team. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = userEditInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, teamId } = parsed.data;
  if (teamId) {
    const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
    if (!team) {
      return NextResponse.json({ error: "That team no longer exists." }, { status: 404 });
    }
  }

  try {
    // Moving teams must also move the user's runs (teamId is denormalized).
    const tx = sqlite.transaction(() => {
      db.update(users)
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(teamId !== undefined ? { teamId } : {}),
        })
        .where(eq(users.id, id))
        .run();
      if (teamId !== undefined && teamId !== user.teamId) {
        db.update(activities)
          .set({ teamId })
          .where(eq(activities.userId, id))
          .run();
      }
    });
    tx();
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return NextResponse.json(
        { error: "Another runner already has that name." },
        { status: 409 },
      );
    }
    throw err;
  }

  reconcileAll();
  return NextResponse.json({ ok: true });
}

/** Admin: delete a user and all of their runs. */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  // activities + tracks cascade via FK onDelete.
  db.delete(users).where(eq(users.id, id)).run();
  reconcileAll();
  return NextResponse.json({ ok: true });
}
