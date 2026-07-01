import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/** Resolve the on-disk SQLite path from DATABASE_URL (strips the file: prefix). */
export function resolveDbPath(): string {
  const url = process.env.DATABASE_URL ?? "file:./data/db/app.db";
  return url.replace(/^file:/, "");
}

// Reuse the connection across hot reloads in dev.
const globalForDb = globalThis as unknown as {
  __sqlite?: Database.Database;
};

function createConnection(): Database.Database {
  const path = resolveDbPath();
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export const sqlite =
  globalForDb.__sqlite ?? (globalForDb.__sqlite = createConnection());

export const db = drizzle(sqlite, { schema });
export { schema };
