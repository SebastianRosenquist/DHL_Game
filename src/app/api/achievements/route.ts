import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { paramsFromInput } from "@/lib/achievements/params";
import { achievementDefInput, type AchievementParams } from "@/lib/achievements/types";
import { db } from "@/lib/db/client";
import { achievementDefinitions } from "@/lib/db/schema";

type DefForClient = (typeof achievementDefinitions.$inferSelect) & {
  metric: string | null;
};

function withMetric(row: typeof achievementDefinitions.$inferSelect): DefForClient {
  const params = JSON.parse(row.params || "{}") as AchievementParams;
  return { ...row, metric: params.metric ?? null };
}

export async function GET() {
  const rows = db
    .select()
    .from(achievementDefinitions)
    .orderBy(achievementDefinitions.sort, achievementDefinitions.title)
    .all();
  return NextResponse.json({ definitions: rows.map(withMetric) });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = achievementDefInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const row = db
    .insert(achievementDefinitions)
    .values({
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
    .returning()
    .get();
  reconcileAll();
  return NextResponse.json({ definition: withMetric(row) }, { status: 201 });
}
