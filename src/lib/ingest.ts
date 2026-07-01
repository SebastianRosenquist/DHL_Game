import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { sqlite } from "@/lib/db/client";
import {
  dropGlitches,
  fastestWindowSec,
} from "@/lib/parsing/rolling-window";
import type { TrackPoint } from "@/lib/parsing/types";

export type NormalizedActivity = {
  distanceM: number;
  elapsedSec: number;
  movingSec?: number;
  startedAt: number; // epoch ms
  source: "manual" | "gpx" | "tcx" | "csv";
  points?: TrackPoint[];
  rawFilePath?: string;
};

export type IngestResult =
  | { status: "created"; activityId: string }
  | { status: "duplicate" }
  | { status: "rejected"; reason: string };

/** YYYY-MM-DD in UTC for day-grouping. */
export function localDateOf(startedAt: number): string {
  return new Date(startedAt).toISOString().slice(0, 10);
}

/** Dedup key: tolerant to re-exports (rounds time to the minute, dist to 10m). */
export function contentHash(
  startedAt: number,
  distanceM: number,
  elapsedSec: number,
): string {
  const minute = Math.round(startedAt / 60000);
  const dist10 = Math.round(distanceM / 10);
  return createHash("sha256")
    .update(`${minute}:${dist10}:${elapsedSec}`)
    .digest("hex");
}

function validate(n: NormalizedActivity): string | null {
  if (!(n.distanceM > 0)) return "Distance must be greater than 0.";
  if (n.distanceM > 500_000) return "Distance is implausibly large (> 500 km).";
  if (!(n.elapsedSec > 0)) return "Duration must be greater than 0.";
  if (!Number.isFinite(n.startedAt)) return "Invalid date.";
  if (n.startedAt > Date.now() + 86_400_000) return "Date is in the future.";
  return null;
}

/**
 * Insert one activity for a user (manual or parsed). Computes pace + fastest
 * windows, dedups by content hash, and stores raw trackpoints separately.
 * Caller is responsible for triggering achievement reconciliation afterwards.
 */
export function ingestActivity(
  userId: string,
  teamId: string,
  raw: NormalizedActivity,
): IngestResult {
  const rejection = validate(raw);
  if (rejection) return { status: "rejected", reason: rejection };

  const points = raw.points && raw.points.length > 1 ? dropGlitches(raw.points) : [];
  const km = raw.distanceM / 1000;
  const avgPace = km > 0 ? raw.elapsedSec / km : null;

  // Fastest windows from GPS when available; otherwise project from average
  // pace for runs long enough to qualify (summary/manual fallback).
  let fastest1k: number | null = null;
  let fastest5k: number | null = null;
  let fastest10k: number | null = null;
  const hasTrack = points.length > 1;
  if (hasTrack) {
    fastest1k = fastestWindowSec(points, 1000);
    fastest5k = fastestWindowSec(points, 5000);
    fastest10k = fastestWindowSec(points, 10000);
  } else if (avgPace != null) {
    if (raw.distanceM >= 1000) fastest1k = Math.round(avgPace * 1);
    if (raw.distanceM >= 5000) fastest5k = Math.round(avgPace * 5);
    if (raw.distanceM >= 10000) fastest10k = Math.round(avgPace * 10);
  }

  const hash = contentHash(raw.startedAt, raw.distanceM, raw.elapsedSec);
  const activityId = randomUUID();

  try {
    const tx = sqlite.transaction(() => {
      sqlite
        .prepare(
          `INSERT INTO activities
             (id, user_id, team_id, distance_m, elapsed_sec, moving_sec,
              started_at, local_date, avg_pace_sec_per_km, fastest_5k_sec,
              fastest_1k_sec, fastest_10k_sec, has_track, source, raw_file_path,
              content_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          activityId,
          userId,
          teamId,
          Math.round(raw.distanceM),
          Math.round(raw.elapsedSec),
          raw.movingSec != null ? Math.round(raw.movingSec) : null,
          raw.startedAt,
          localDateOf(raw.startedAt),
          avgPace,
          fastest5k,
          fastest1k,
          fastest10k,
          hasTrack ? 1 : 0,
          raw.source,
          raw.rawFilePath ?? null,
          hash,
          Date.now(),
        );

      if (hasTrack) {
        const blob = gzipSync(Buffer.from(JSON.stringify(points)));
        sqlite
          .prepare(
            `INSERT INTO activity_tracks (activity_id, points_blob) VALUES (?, ?)`,
          )
          .run(activityId, blob);
      }
    });
    tx();
  } catch (err) {
    if (err instanceof Error && /UNIQUE/i.test(err.message)) {
      return { status: "duplicate" };
    }
    throw err;
  }

  return { status: "created", activityId };
}
