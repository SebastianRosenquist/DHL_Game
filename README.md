# Team Running Challenge Dashboard 🏃‍♀️🏁

A fun, interactive dashboard where teams compete by logging runs. Upload your
GPX/TCX/CSV exports (Strava, Garmin, …) or enter runs manually, watch animated
team characters race along a track in real time, and win prizes like *Fastest 5K*
and *Biggest Single Day*.

- **Admin** (passcode-protected) creates teams and defines achievements.
- **Runners** join one team by name (trust-based — no passwords) and log runs.
- The dashboard updates live, ranking teams by total distance.

## Tech stack

Next.js 15 (App Router, TypeScript) · SQLite via better-sqlite3 + Drizzle ·
Tailwind CSS · Framer Motion. Everything runs in **one container** with a
**single persistent volume** for the database and uploaded files.

## Local development

```bash
npm install
cp .env.example .env.local          # set ADMIN_PASSCODE + SESSION_SECRET
npm run db:seed                     # create the DB + seed default achievements
npm run dev                         # http://localhost:3000
```

The schema and default achievements are also applied automatically on server
boot (see `src/instrumentation.ts`), so the app is self-healing.

- Visit `/admin`, enter your `ADMIN_PASSCODE`, and create some teams.
- Visit `/join` to join a team, then `/log` to add runs.
- The home page `/` is the live race dashboard.

## Run in Docker (local test)

```bash
echo "ADMIN_PASSCODE=letmein"            >  .env
echo "SESSION_SECRET=$(openssl rand -hex 24)" >> .env
docker compose up --build -d             # http://localhost:8080
```

Data persists in the `running_data` volume across `docker compose down && up`.
Use `docker compose down -v` to wipe it.

## Deploy to a NAS (Synology / QNAP)

better-sqlite3 is a native module, so **build the image for the NAS's CPU
architecture**. Either build directly on the NAS, or cross-build:

```bash
docker buildx build --platform linux/arm64 -t running-dashboard:latest .   # arm64 NAS
# (use linux/amd64 for x86 NAS)
```

Then run with a **bind mount** so backups are easy — edit `docker-compose.yml`:

```yaml
    volumes:
      - /volume1/docker/running/data:/data
```

Set a strong `ADMIN_PASSCODE` and `SESSION_SECRET` in the NAS container's
environment. The app listens on container port `3000` (mapped to host `8080`).
Back up by copying the `/data` folder (DB + uploads).

## Achievements

Default prizes are seeded on first boot; the admin can create, edit, enable, or
delete any of them at `/admin`. Each achievement picks a **rule** (record low /
record high / biggest total / most active days), a **metric** (distance, fastest
5K, pace, single-day distance, …), and a **scope** (individual or team). Records
recompute automatically whenever runs are added or removed.

### File parsing notes

- **GPX / TCX**: distance from GPS trackpoints (haversine), with an exact
  fastest-1K/5K/10K computed via a sliding window.
- **CSV** (e.g. Strava's `activities.csv`): summary only — non-run rows are
  skipped, and fastest-5K is approximated from average pace for runs ≥ 5 km.
- **FIT** files aren't supported yet (export GPX/TCX instead).
- Duplicate uploads are detected and ignored, so re-importing is safe.
