# SMNT (Map + Elevation Profile) — Next.js + Mapbox

Interactive map-first web app for exploring the SMNT trail: a main route + corridor, elevation profile, and POIs.

**Product docs:** see `docs/` (vision/MVP notes + deployment guide).

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
- `/api/map` endpoint that can run in:
  - **GPX mode** (no DB): derives the trail route/profile/corridor
  - **DB mode** (with `DATABASE_URL`): returns routes + POIs from Postgres

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

- `DATABASE_URL` (enables DB mode for `/api/map`)

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
