import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { paramsFromInput } from "@/lib/achievements/params";
import { achievementDefInput } from "@/lib/achievements/types";
import { db } from "@/lib/db/client";
import { achievementDefinitions } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = achievementDefInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const row = db
    .update(achievementDefinitions)
    .set({
      title: d.title,
      description: d.description,
      strategy: d.strategy,
      params: paramsFromInput(d),
      scope: d.scope,
      window: d.window,
      activityType: d.activityType,
      icon: d.icon,
      enabled: d.enabled,
      sort: d.sort,
    })
    .where(eq(achievementDefinitions.id, id))
    .returning()
    .get();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  reconcileAll();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  db.delete(achievementDefinitions).where(eq(achievementDefinitions.id, id)).run();
  return NextResponse.json({ ok: true });
}
