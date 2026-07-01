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

export function parseGpx(xml: string): ParsedActivity {
  const doc = parser.parse(xml);
  const gpx = doc?.gpx;
  if (!gpx) throw new Error("Not a valid GPX file.");

  const points: TrackPoint[] = [];
  for (const trk of arr<Record<string, unknown>>(gpx.trk)) {
    for (const seg of arr<Record<string, unknown>>(trk.trkseg)) {
      for (const pt of arr<Record<string, unknown>>(seg.trkpt)) {
        const lat = parseFloat(String(pt["@_lat"]));
        const lon = parseFloat(String(pt["@_lon"]));
        const time = pt.time ? Date.parse(String(pt.time)) : NaN;
        const ele = pt.ele != null ? parseFloat(String(pt.ele)) : undefined;
        points.push({
          t: time,
          lat: Number.isNaN(lat) ? undefined : lat,
          lon: Number.isNaN(lon) ? undefined : lon,
          ele,
        });
      }
    }
  }

  if (points.length < 2) throw new Error("GPX file has no usable track points.");

  const cum = cumulativeDistance(points);
  const distanceMeters = cum[cum.length - 1];
  const times = points.map((p) => p.t).filter((t) => !Number.isNaN(t));
  if (times.length < 2) {
    throw new Error("GPX has no timestamps — please log this run manually.");
  }
  const startedAt = times[0];
  const elapsedSec = (times[times.length - 1] - times[0]) / 1000;
  if (elapsedSec <= 0) throw new Error("GPX duration could not be determined.");

  return { source: "gpx", startedAt, elapsedSec, distanceMeters, points };
}
