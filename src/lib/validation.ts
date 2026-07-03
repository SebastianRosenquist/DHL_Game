import { z } from "zod";
import { ACTIVITY_TYPES } from "@/lib/activity-type";
import { CHARACTER_KEYS } from "./characters";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #FFCC00");

export const teamInput = z.object({
  name: z.string().trim().min(1, "Name required").max(40),
  character: z.enum(CHARACTER_KEYS),
  colorHex: hexColor,
});
export type TeamInput = z.infer<typeof teamInput>;

export const joinInput = z.object({
  name: z.string().trim().min(1, "Enter your name").max(40),
  // Only required when creating a new account; returning users just log in.
  teamId: z.string().min(1).optional(),
});

/** Admin creating/editing a route milestone (prize). */
export const milestoneInput = z.object({
  km: z.coerce.number().positive("Distance must be > 0").max(100000),
  label: z.string().trim().min(1, "Name required").max(40),
  icon: z.string().trim().min(1).max(8).default("🏁"),
});
export type MilestoneInput = z.infer<typeof milestoneInput>;

/** Admin editing a user: rename and/or move to another team. */
export const userEditInput = z
  .object({
    name: z.string().trim().min(1, "Name required").max(40).optional(),
    teamId: z.string().min(1).optional(),
  })
  .refine((v) => v.name !== undefined || v.teamId !== undefined, {
    message: "Nothing to update",
  });

/**
 * Manual run entry. Distance comes in km and duration as h/m/s for a friendly
 * form; we normalize to meters + seconds before storing.
 */
export const manualActivityInput = z.object({
  distanceKm: z.coerce.number().positive("Distance must be > 0").max(500),
  hours: z.coerce.number().int().min(0).max(48).default(0),
  minutes: z.coerce.number().int().min(0).max(59).default(0),
  seconds: z.coerce.number().int().min(0).max(59).default(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  activityType: z.enum(ACTIVITY_TYPES).default("run"),
});
export type ManualActivityInput = z.infer<typeof manualActivityInput>;

/** A logged-in user changing their own team. */
export const selfTeamChangeInput = z.object({
  teamId: z.string().min(1),
});
