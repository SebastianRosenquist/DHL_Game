import Papa from "papaparse";
import type { ParsedActivity } from "./types";

/**
 * Parse a CSV of summary activities (e.g. Strava's activities.csv). Tolerant:
 * matches columns by normalized header name, filters to runs, and skips rows it
 * can't understand. Returns one ParsedActivity per usable row (no trackpoints).
 *
 * Recognised headers (case-insensitive, fuzzy):
 *   date     <- any header containing "date"
 *   type     <- "activity type" / "type"        (rows must look like a run)
 *   distance <- any header containing "distance" (km if < 1000, else meters)
 *   time     <- "moving time" preferred, else "elapsed time" (sec or H:M:S)
 */
export function parseCsv(text: string): {
  activities: ParsedActivity[];
  skipped: number;
} {
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const rows = res.data ?? [];

  const activities: ParsedActivity[] = [];
  let skipped = 0;

  for (const row of rows) {
    const get = (pred: (k: string) => boolean): string | undefined => {
      const key = Object.keys(row).find(pred);
      return key ? row[key] : undefined;
    };

    const type = get((k) => k.includes("type"));
    if (type && !/run/i.test(type)) {
      continue; // not a run; silently skip non-run rows
    }

    const dateStr = get((k) => k.includes("date"));
    const distStr = get((k) => k.includes("distance"));
    const timeStr =
      get((k) => k.includes("moving") && k.includes("time")) ??
      get((k) => k.includes("elapsed") && k.includes("time")) ??
      get((k) => k.includes("time")) ??
      get((k) => k.includes("duration"));

    const startedAt = dateStr ? Date.parse(dateStr) : NaN;
    const distanceMeters = parseDistance(distStr);
    const elapsedSec = parseDurationSec(timeStr);

    if (Number.isNaN(startedAt) || !distanceMeters || !elapsedSec) {
      skipped++;
      continue;
    }

    activities.push({
      source: "csv",
      startedAt,
      elapsedSec,
      distanceMeters,
      points: [],
    });
  }

  return { activities, skipped };
}

function parseDistance(s: string | undefined): number {
  if (!s) return 0;
  const v = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(v) || v <= 0) return 0;
  // Heuristic: plausible run distances in km are < 1000; meters are >= 1000.
  return v < 1000 ? v * 1000 : v;
}

function parseDurationSec(s: string | undefined): number {
  if (!s) return 0;
  const str = s.trim();
  if (str.includes(":")) {
    const parts = str.split(":").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    const [h, m, sec] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
    return h * 3600 + m * 60 + sec;
  }
  const v = parseFloat(str);
  return Number.isFinite(v) && v > 0 ? v : 0;
}
