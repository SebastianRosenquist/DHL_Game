import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db } from "@/lib/db/client";
import { teams } from "@/lib/db/schema";
import { teamInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = teamInput.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  try {
    const row = db
      .update(teams)
      .set(parsed.data)
      .where(eq(teams.id, id))
      .returning()
      .get();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ team: row });
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

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  db.delete(teams).where(eq(teams.id, id)).run();
  // Deleting a team removes its activities, which can change record holders.
  reconcileAll();
  return NextResponse.json({ ok: true });
}
