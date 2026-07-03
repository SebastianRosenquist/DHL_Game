import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { reconcileAll } from "@/lib/achievements/engine";
import { UID_COOKIE, currentUserId, isAdmin } from "@/lib/auth";
import { db, sqlite } from "@/lib/db/client";
import { activities, teams, users } from "@/lib/db/schema";
import { selfTeamChangeInput } from "@/lib/validation";

/** Who am I? Returns the joined user + team, plus whether I'm the admin. */
export async function GET() {
  const admin = await isAdmin();
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ user: null, team: null, admin });

  const user = db.select().from(users).where(eq(users.id, uid)).get();
  if (!user) {
    // Stale cookie (user/team was deleted).
    const res = NextResponse.json({ user: null, team: null, admin });
    res.cookies.set(UID_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  }
  const team = db.select().from(teams).where(eq(teams.id, user.teamId)).get();
  return NextResponse.json({ user, team, admin });
}

/** Self-service: move yourself to a different team. */
export async function PATCH(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = db.select().from(users).where(eq(users.id, uid)).get();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = selfTeamChangeInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { teamId } = parsed.data;
  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) {
    return NextResponse.json({ error: "That team no longer exists." }, { status: 404 });
  }

  if (teamId !== user.teamId) {
    // Moving teams must also move the user's runs (teamId is denormalized).
    const tx = sqlite.transaction(() => {
      db.update(users).set({ teamId }).where(eq(users.id, uid)).run();
      db.update(activities).set({ teamId }).where(eq(activities.userId, uid)).run();
    });
    tx();
    reconcileAll();
  }

  return NextResponse.json({ ok: true });
}

/** Leave / switch identity. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
