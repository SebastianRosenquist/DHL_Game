import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { UID_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { teams, users } from "@/lib/db/schema";
import { joinInput } from "@/lib/validation";

function setSession(userId: string, payload: object) {
  const res = NextResponse.json(payload);
  res.cookies.set(UID_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}

/**
 * Log in or join. If the username already exists we log that runner back in and
 * resume their team + history (the team selection is ignored). If it's a new
 * username, a team must be chosen to create the account.
 */
export async function POST(req: Request) {
  const parsed = joinInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { name, teamId } = parsed.data;

  // Existing runner -> log in, resume their team.
  const existing = db.select().from(users).where(eq(users.name, name)).get();
  if (existing) {
    const team = db.select().from(teams).where(eq(teams.id, existing.teamId)).get();
    return setSession(existing.id, { user: existing, team, loggedIn: true });
  }

  // New runner -> need a team to create the account.
  if (!teamId) {
    return NextResponse.json(
      { error: "new_user", message: "New name — pick a team to join." },
      { status: 409 },
    );
  }
  const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
  if (!team) {
    return NextResponse.json({ error: "That team no longer exists." }, { status: 404 });
  }

  const user = db.insert(users).values({ name, teamId }).returning().get();
  return setSession(user.id, { user, team, loggedIn: false });
}
