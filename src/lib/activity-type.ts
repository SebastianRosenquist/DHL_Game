/** Whether a logged activity is a run or a walk. Client-safe (no server-only imports). */
export const ACTIVITY_TYPES = ["run", "walk"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
