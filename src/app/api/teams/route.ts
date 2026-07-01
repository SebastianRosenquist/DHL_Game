import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { teams } from "@/lib/db/schema";
import { teamInput } from "@/lib/validation";

export async function GET() {
  const all = db.select().from(teams).orderBy(teams.name).all();
  return NextResponse.json({ teams: all });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = teamInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  try {
    const row = db.insert(teams).values(parsed.data).returning().get();
    return NextResponse.json({ team: row }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return NextResponse.json(
        { error: "A team with that name already exists." },
        { status: 409 },
      );
    }
    throw err;
  }
}
