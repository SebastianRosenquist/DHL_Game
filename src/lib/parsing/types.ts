export type TrackPoint = {
  t: number; // epoch ms
  lat?: number;
  lon?: number;
  ele?: number; // meters
  dist?: number; // cumulative meters from device, if present
};

/** Normalized result every format parser produces. */
export type ParsedActivity = {
  source: "gpx" | "tcx" | "csv";
  startedAt: number; // epoch ms
  elapsedSec: number;
  movingSec?: number;
  distanceMeters: number;
  points: TrackPoint[]; // [] for summary-only CSV
};
