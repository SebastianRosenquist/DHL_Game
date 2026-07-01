import type { TrackPoint } from "./types";

const EARTH_M = 6371000;

/** Great-circle distance between two lat/lon points, in meters. */
export function haversine(a: TrackPoint, b: TrackPoint): number {
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Cumulative distance (m) per point, using device distance when present. */
export function cumulativeDistance(points: TrackPoint[]): number[] {
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const seg =
      cur.dist != null && prev.dist != null
        ? Math.max(0, cur.dist - prev.dist)
        : haversine(prev, cur);
    cum.push(cum[i - 1] + seg);
  }
  return cum;
}

/**
 * Fastest continuous `target` meters within a run, in seconds, via a
 * two-pointer sliding window. Interpolates the entry point so the window is
 * exactly `target` long. Returns null if the run is shorter than `target` or
 * lacks timestamps. Generalizes to 1k / 5k / 10k by changing `target`.
 */
export function fastestWindowSec(
  points: TrackPoint[],
  target: number,
): number | null {
  if (points.length < 2) return null;
  const cum = cumulativeDistance(points);
  const total = cum[cum.length - 1];
  if (total < target) return null;

  let best = Infinity;
  let lo = 0;
  for (let hi = 1; hi < points.length; hi++) {
    // Advance lo while the window [lo+1, hi] still covers >= target.
    while (lo + 1 < hi && cum[hi] - cum[lo + 1] >= target) lo++;
    if (cum[hi] - cum[lo] >= target) {
      // Interpolate the start so the window is exactly `target` meters.
      const overshoot = cum[hi] - cum[lo] - target;
      const segLen = cum[lo + 1] - cum[lo];
      const frac = segLen > 0 ? overshoot / segLen : 0;
      const tStart = points[lo].t + (points[lo + 1].t - points[lo].t) * frac;
      const dt = (points[hi].t - tStart) / 1000;
      if (dt > 0 && dt < best) best = dt;
    }
  }
  return best === Infinity ? null : Math.round(best);
}

const SPEED_CAP_MS = 12; // ~2:20/km — drop GPS teleport spikes above this.

/** Remove points implying impossible speed (GPS glitches) before summing. */
export function dropGlitches(points: TrackPoint[]): TrackPoint[] {
  if (points.length < 2) return points;
  const out: TrackPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const dt = (cur.t - prev.t) / 1000;
    const dist =
      cur.dist != null && prev.dist != null
        ? Math.max(0, cur.dist - prev.dist)
        : haversine(prev, cur);
    if (dt > 0 && dist / dt > SPEED_CAP_MS) continue; // skip the glitch
    out.push(cur);
  }
  return out;
}
