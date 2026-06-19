# SMNT (Map + Elevation Profile) — Next.js + Mapbox

Interactive map-first web app for exploring the SMNT trail: a main route + corridor, elevation profile, and POIs.

**Product docs:** see `docs/` — including [ARCHITECTURE.md](docs/ARCHITECTURE.md) (web mapping system), vision/MVP notes, and [DEPLOY.md](docs/DEPLOY.md).

## Stack

- Next.js (App Router) + React
- TypeScript (strict)
- Mapbox GL (`mapbox-gl`) + `react-map-gl`
- Turf.js for geospatial utilities (buffers, distances, etc.)
- Optional data mode: Postgres (Supabase + PostGIS) via `pg`

## Key features

- Map-first home experience (client-only map component)
- GPX-derived trail route + corridor polygon
- Elevation profile overlay with cursor sync
- `/api/map` endpoint (structured: `proposedMain`, `officialRoutes`, `userRoutes`)
- `POST /api/routes/upload` for GPX (requires schema v2 + `DATABASE_URL`)
- **Submit route** modal on home: GPX drop, preview vs proposed main, pending review
- **`/admin`** — SMNT admin reviews (set `SMNT_ADMIN_SECRET` in env)

## Local development

1. Install deps:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env.local
```

3. Set at least:

- `NEXT_PUBLIC_MAPBOX_TOKEN`

Optional:

- `DATABASE_URL` (enables DB mode for `/api/map` and route submissions)
- `SMNT_ADMIN_SECRET` (required for `/admin` route reviews)

4. Run dev server:

```bash
npm run dev
```

## Scripts

- `npm run dev`: dev server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: lint

## Deployment

See `docs/DEPLOY.md` for Vercel + Supabase setup and notes about connection pooling.

## Portfolio talking points

- **Non-trivial UI interactions**: map + chart synchronization and performance trade-offs.
- **Geospatial work**: GPX parsing + corridor buffering and distance/elevation utilities.
- **Production mindset**: SSR boundaries for heavy client libraries + deploy docs.
