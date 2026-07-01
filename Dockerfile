# syntax=docker/dockerfile:1

# ---- deps: install node modules (compiles better-sqlite3 for this arch) ----
FROM node:22-alpine AS deps
WORKDIR /app
# Build tools needed to compile better-sqlite3's native binding on Alpine/musl.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: build the standalone Next.js server ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone server + assets.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Migrations are read from ./drizzle at boot (via instrumentation.ts).
COPY --from=builder /app/drizzle ./drizzle

# Persistent data (DB + uploads) lives here; mount a volume on it.
RUN mkdir -p /data/db /data/uploads
ENV DATABASE_URL=file:/data/db/app.db
ENV UPLOAD_DIR=/data/uploads

EXPOSE 3000
CMD ["node", "server.js"]
