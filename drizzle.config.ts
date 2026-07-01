import type { Config } from "drizzle-kit";

// Strip the "file:" prefix Drizzle Kit's better-sqlite driver doesn't want.
const url = (process.env.DATABASE_URL ?? "file:./data/db/app.db").replace(
  /^file:/,
  "",
);

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url },
} satisfies Config;
