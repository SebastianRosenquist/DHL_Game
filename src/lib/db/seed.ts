import { randomUUID } from "node:crypto";
import { sqlite } from "./client";
import { runMigrations } from "./migrate";
import { DEFAULT_ACHIEVEMENTS } from "@/lib/achievements/definitions";
import { DEFAULT_MILESTONES } from "@/lib/milestones";

/** Insert default achievement definitions if the table is empty. Idempotent. */
export function seedAchievements() {
  const { count } = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM achievement_definitions`)
    .get() as { count: number };
  if (count > 0) return;

  const insert = sqlite.prepare(
    `INSERT INTO achievement_definitions
       (id, title, description, strategy, params, scope, is_record_holder,
        window, icon, enabled, sort, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, 'all_time', ?, 1, ?, ?)`,
  );
  const now = Date.now();
  const tx = sqlite.transaction(() => {
    for (const a of DEFAULT_ACHIEVEMENTS) {
      insert.run(
        randomUUID(),
        a.title,
        a.description,
        a.strategy,
        JSON.stringify(a.metric ? { metric: a.metric } : {}),
        a.scope,
        a.icon,
        a.sort,
        now,
      );
    }
  });
  tx();
}

/** Insert default milestones if the table is empty. Idempotent. */
export function seedMilestones() {
  const { count } = sqlite
    .prepare(`SELECT COUNT(*) AS count FROM milestones`)
    .get() as { count: number };
  if (count > 0) return;

  const insert = sqlite.prepare(
    `INSERT INTO milestones (id, km, label, icon, created_at) VALUES (?, ?, ?, ?, ?)`,
  );
  const now = Date.now();
  const tx = sqlite.transaction(() => {
    for (const m of DEFAULT_MILESTONES) {
      insert.run(randomUUID(), m.km, m.label, m.icon, now);
    }
  });
  tx();
}

// Allow running directly: `tsx src/lib/db/seed.ts`
if (process.argv[1]?.endsWith("seed.ts")) {
  runMigrations();
  seedAchievements();
  seedMilestones();
  console.log("Seeded default achievements and milestones.");
}
