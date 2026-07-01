import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

// Applies any pending Drizzle migrations from ./drizzle. Run on container start
// and via `npm run db:migrate`.
export function runMigrations() {
  migrate(db, { migrationsFolder: "./drizzle" });
}

// Allow running directly: `tsx src/lib/db/migrate.ts`
if (process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations();
  console.log("Migrations applied.");
}
