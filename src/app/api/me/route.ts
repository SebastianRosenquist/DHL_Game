import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { UID_COOKIE, currentUserId, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { teams, users } from "@/lib/db/schema";

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

/** Leave / switch identity. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
