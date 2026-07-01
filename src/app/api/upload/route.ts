import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { currentUserId } from "@/lib/auth";
import { reconcileAll } from "@/lib/achievements/engine";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { ingestActivity } from "@/lib/ingest";
import { parseActivityFile } from "@/lib/parsing";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return NextResponse.json({ error: "Join a team first." }, { status: 401 });
  const user = db.select().from(users).where(eq(users.id, uid)).get();
  if (!user) return NextResponse.json({ error: "Join a team first." }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
  }

  const text = await file.text();
  let parsed;
  try {
    parsed = parseActivityFile(file.name, text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not parse file.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  if (parsed.activities.length === 0) {
    return NextResponse.json(
      { error: "No runs found in that file.", skipped: parsed.skipped },
      { status: 422 },
    );
  }

  // Keep the original upload for the record.
  const uploadDir = process.env.UPLOAD_DIR ?? "./data/uploads";
  mkdirSync(uploadDir, { recursive: true });
  const safeName = file.name.replace(/[^a-z0-9._-]/gi, "_");
  const rawFilePath = join(uploadDir, `${randomUUID()}-${safeName}`);
  writeFileSync(rawFilePath, text);

  let created = 0;
  let duplicates = 0;
  let rejected = 0;
  const errors: string[] = [];
  for (const act of parsed.activities) {
    const r = ingestActivity(uid, user.teamId, {
      distanceM: act.distanceMeters,
      elapsedSec: act.elapsedSec,
      movingSec: act.movingSec,
      startedAt: act.startedAt,
      source: act.source,
      points: act.points,
      rawFilePath,
    });
    if (r.status === "created") created++;
    else if (r.status === "duplicate") duplicates++;
    else {
      rejected++;
      errors.push(r.reason);
    }
  }

  if (created > 0) reconcileAll();
  return NextResponse.json({
    created,
    duplicates,
    skipped: parsed.skipped,
    rejected,
    errors: errors.slice(0, 5),
  });
}
