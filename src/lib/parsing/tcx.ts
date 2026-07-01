import { XMLParser } from "fast-xml-parser";
import { cumulativeDistance } from "./rolling-window";
import type { ParsedActivity, TrackPoint } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function arr<T>(x: unknown): T[] {
  if (x == null) return [];
  return (Array.isArray(x) ? x : [x]) as T[];
}

export function parseTcx(xml: string): ParsedActivity {
  const doc = parser.parse(xml);
  const tcd = doc?.TrainingCenterDatabase;
  if (!tcd) throw new Error("Not a valid TCX file.");

  const points: TrackPoint[] = [];
  let lapTimeSec = 0;
  for (const activity of arr<Record<string, unknown>>(tcd.Activities?.Activity)) {
    for (const lap of arr<Record<string, unknown>>(activity.Lap)) {
      const tts = lap.TotalTimeSeconds;
      if (tts != null) lapTimeSec += parseFloat(String(tts)) || 0;
      const track = (lap.Track ?? {}) as Record<string, unknown>;
      for (const tp of arr<Record<string, unknown>>(track.Trackpoint)) {
        const time = tp.Time ? Date.parse(String(tp.Time)) : NaN;
        const pos = (tp.Position ?? {}) as Record<string, unknown>;
        const lat =
          pos.LatitudeDegrees != null
            ? parseFloat(String(pos.LatitudeDegrees))
            : undefined;
        const lon =
          pos.LongitudeDegrees != null
            ? parseFloat(String(pos.LongitudeDegrees))
            : undefined;
        const dist =
          tp.DistanceMeters != null
            ? parseFloat(String(tp.DistanceMeters))
            : undefined;
        points.push({ t: time, lat, lon, dist });
      }
    }
  }

  if (points.length < 2) throw new Error("TCX file has no usable track points.");

  // Prefer device cumulative distance; fall back to haversine.
  const last = points[points.length - 1];
  const first = points[0];
  let distanceMeters =
    last.dist != null && first.dist != null ? last.dist - first.dist : 0;
  if (!(distanceMeters > 0)) {
    const cum = cumulativeDistance(points);
    distanceMeters = cum[cum.length - 1];
  }

  const times = points.map((p) => p.t).filter((t) => !Number.isNaN(t));
  if (times.length < 2) {
    throw new Error("TCX has no timestamps — please log this run manually.");
  }
  const startedAt = times[0];
  const elapsedSec = lapTimeSec > 0 ? lapTimeSec : (times[times.length - 1] - times[0]) / 1000;
  if (elapsedSec <= 0) throw new Error("TCX duration could not be determined.");

  return { source: "tcx", startedAt, elapsedSec, distanceMeters, points };
}
