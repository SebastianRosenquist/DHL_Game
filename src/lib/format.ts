/** Display helpers. Distances are meters, durations are seconds in the DB. */

export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 100) return `${Math.round(km)} km`;
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Pace in seconds per km -> "m:ss /km". */
export function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

/** Format an achievement value for display based on its metric's unit. */
export function formatMetricValue(
  unit: "distance" | "duration" | "pace" | "count",
  value: number,
): string {
  switch (unit) {
    case "distance":
      return formatDistance(value);
    case "duration":
      return formatDuration(value);
    case "pace":
      return formatPace(value);
    case "count":
      return `${Math.round(value)} days`;
  }
}
