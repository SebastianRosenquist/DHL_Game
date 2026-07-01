/**
 * Prizes placed along the route. A team unlocks each one when its TOTAL team
 * distance crosses the checkpoint — every team can earn all of them
 * independently (unlike the competitive, single-holder achievements).
 *
 * Milestones are stored in the database and managed by the admin. These are the
 * defaults seeded on first boot; the largest `km` is treated as the finish line.
 */
export type Milestone = {
  id?: string;
  km: number;
  label: string;
  icon: string;
};

export const DEFAULT_MILESTONES: Omit<Milestone, "id">[] = [
  { km: 20, label: "Bronze Boot", icon: "🥾" },
  { km: 40, label: "Silver Stride", icon: "🥈" },
  { km: 60, label: "Gold Gallop", icon: "🥇" },
  { km: 80, label: "Diamond Dash", icon: "💎" },
  { km: 100, label: "Centurion Cup", icon: "🏆" },
];

/** Milestones sorted by distance (ascending). */
export function sortMilestones(ms: Milestone[]): Milestone[] {
  return [...ms].sort((a, b) => a.km - b.km);
}

/** Total route length in meters (the largest milestone). 0 if none. */
export function routeTotalM(ms: Milestone[]): number {
  return ms.length ? Math.max(...ms.map((m) => m.km)) * 1000 : 0;
}

/** Fraction (0..1) along the route for a given distance, clamped to the end. */
export function routeFraction(distanceM: number, ms: Milestone[]): number {
  const total = routeTotalM(ms);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, distanceM / total));
}

/** Has a team covering `distanceM` reached this milestone? */
export function hasReached(distanceM: number, m: Milestone): boolean {
  return distanceM >= m.km * 1000;
}

export type Segment = {
  done: boolean; // all milestones reached
  fromM: number; // start of the current leg (meters) — previous milestone, or 0
  target: Milestone | null; // the next milestone to chase (null when done)
  progress: number; // 0..1 within the current leg
  remainingM: number; // meters left to the next milestone (0 when done)
};

/**
 * The team's *current leg*: which milestone they're chasing next, and how far
 * along they are between the previous milestone and that one. Used by the
 * dynamic "race to next prize" view.
 */
export function currentSegment(distanceM: number, ms: Milestone[]): Segment {
  const sorted = sortMilestones(ms);
  let fromM = 0;
  for (const m of sorted) {
    const toM = m.km * 1000;
    if (distanceM < toM) {
      const span = toM - fromM;
      return {
        done: false,
        fromM,
        target: m,
        progress: span > 0 ? Math.max(0, (distanceM - fromM) / span) : 1,
        remainingM: toM - distanceM,
      };
    }
    fromM = toM;
  }
  return { done: sorted.length > 0, fromM, target: null, progress: 1, remainingM: 0 };
}
