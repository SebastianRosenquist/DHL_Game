import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { milestones } from "@/lib/db/schema";
import { milestoneInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Public: list milestones (also included in /api/standings). */
export async function GET() {
  const rows = db.select().from(milestones).orderBy(milestones.km).all();
  return NextResponse.json({ milestones: rows });
}

/** Admin: create a milestone. */
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = milestoneInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const row = db.insert(milestones).values(parsed.data).returning().get();
  return NextResponse.json({ milestone: row }, { status: 201 });
}
