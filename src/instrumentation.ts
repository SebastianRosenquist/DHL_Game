// Runs once when the Next.js server boots. Ensures the database schema exists
// and default achievements are seeded — so the Docker container is self-healing.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("@/lib/db/migrate");
    const { seedAchievements, seedMilestones } = await import("@/lib/db/seed");
    runMigrations();
    seedAchievements();
    seedMilestones();
  }
}
