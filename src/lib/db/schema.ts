import { randomUUID } from "node:crypto";
import {
  blob,
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () =>
  integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now());

/** A team the admin creates. Each has a character + theme color. */
export const teams = sqliteTable("teams", {
  id: id(),
  name: text("name").notNull().unique(),
  character: text("character").notNull().default("fox"),
  colorHex: text("color_hex").notNull().default("#FFCC00"),
  createdAt: createdAt(),
});

/**
 * A participant. Joins exactly one team and is identified by a globally unique
 * username (trust-based — login is just typing the name, no password). The
 * account persists across logout; the session is held in a cookie, not here.
 */
export const users = sqliteTable("users", {
  id: id(),
  name: text("name").notNull().unique(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

/** A single logged run. Distances in meters, durations in seconds. */
export const activities = sqliteTable(
  "activities",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Denormalized for fast team aggregation.
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    distanceM: integer("distance_m").notNull(),
    elapsedSec: integer("elapsed_sec").notNull(),
    movingSec: integer("moving_sec"),
    startedAt: integer("started_at").notNull(), // epoch ms
    localDate: text("local_date").notNull(), // YYYY-MM-DD for day grouping
    avgPaceSecPerKm: real("avg_pace_sec_per_km"),
    fastest5kSec: integer("fastest_5k_sec"),
    fastest1kSec: integer("fastest_1k_sec"),
    fastest10kSec: integer("fastest_10k_sec"),
    // True when computed from GPS trackpoints (GPS-accurate records).
    hasTrack: integer("has_track", { mode: "boolean" })
      .notNull()
      .default(false),
    source: text("source").notNull(), // manual | gpx | tcx | csv
    rawFilePath: text("raw_file_path"),
    contentHash: text("content_hash").notNull(),
    // run | walk. Walks count toward team/race totals but not running achievements.
    activityType: text("activity_type").notNull().default("run"),
    createdAt: createdAt(),
  },
  (t) => ({
    teamIdx: index("activities_team_idx").on(t.teamId),
    dateIdx: index("activities_date_idx").on(t.localDate),
    typeIdx: index("activities_type_idx").on(t.activityType),
    // Same activity can't be imported twice by the same user.
    userHashUnique: unique("activities_user_hash_unique").on(
      t.userId,
      t.contentHash,
    ),
  }),
);

/** Raw trackpoints, stored separately to keep the hot activities table small. */
export const activityTracks = sqliteTable("activity_tracks", {
  activityId: text("activity_id")
    .primaryKey()
    .references(() => activities.id, { onDelete: "cascade" }),
  // gzip-compressed JSON of the trackpoint array.
  pointsBlob: blob("points_blob").notNull(),
});

/** Admin-defined prize. Names a strategy + params; computed from activities. */
export const achievementDefinitions = sqliteTable("achievement_definitions", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  // min_metric | max_metric | sum_metric | count_distinct_days
  strategy: text("strategy").notNull(),
  // JSON: { metric, requireNotNull?, ... }
  params: text("params").notNull().default("{}"),
  scope: text("scope").notNull().default("individual"), // individual | team
  isRecordHolder: integer("is_record_holder", { mode: "boolean" })
    .notNull()
    .default(true),
  window: text("window").notNull().default("all_time"), // all_time | challenge
  // run | walk. Which logged-activity type this achievement is computed over.
  activityType: text("activity_type").notNull().default("run"),
  icon: text("icon").notNull().default("🏆"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

/** Current holder of an achievement (one row per definition for record types). */
export const achievementAwards = sqliteTable(
  "achievement_awards",
  {
    id: id(),
    definitionId: text("definition_id")
      .notNull()
      .references(() => achievementDefinitions.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
    value: real("value").notNull(),
    sourceActivityId: text("source_activity_id").references(
      () => activities.id,
      { onDelete: "set null" },
    ),
    awardedAt: integer("awarded_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (t) => ({
    // Record-holder achievements have exactly one current holder.
    defUnique: unique("awards_definition_unique").on(t.definitionId),
  }),
);

/** History of record transitions, for "previous record" / timeline display. */
export const achievementHistory = sqliteTable("achievement_history", {
  id: id(),
  definitionId: text("definition_id")
    .notNull()
    .references(() => achievementDefinitions.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  teamId: text("team_id"),
  value: real("value").notNull(),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
});

/** Admin-defined prizes along the route, unlocked by cumulative team distance. */
export const milestones = sqliteTable("milestones", {
  id: id(),
  km: real("km").notNull(),
  label: text("label").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  icon: text("icon").notNull().default("🏁"),
  createdAt: createdAt(),
});

export type Team = typeof teams.$inferSelect;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type AchievementDefinition = typeof achievementDefinitions.$inferSelect;
export type AchievementAward = typeof achievementAwards.$inferSelect;
export type MilestoneRow = typeof milestones.$inferSelect;
