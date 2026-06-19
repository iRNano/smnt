# Database setup (Supabase)

1. **Enable PostGIS:** In Supabase Dashboard go to **Database → Extensions**, find **PostGIS** and enable it.

2. **Run schema v1:** Open **SQL Editor**, paste and run [schema-and-seed.sql](schema-and-seed.sql). This creates `routes` and `pois` tables with MVP seed data.

3. **Run schema v2 (recommended):** Paste and run [schema-v2.sql](schema-v2.sql). This adds:
   - `trail_routes` — official network (`proposed_main`, `exit`, `not_passable`)
   - `user_route_submissions` — GPX uploads (`pending` / `approved`)
   - `trail_sections`, `trail_corridors`
   - Migrates existing `routes` rows into `trail_routes`

4. **Connection string:** In **Project Settings → Database** copy the connection string (URI) for `DATABASE_URL`. Use the **Connection pooling** URI (port **6543**) for serverless.

## API after v2

- `GET /api/map` — structured response: `proposedMain`, `officialRoutes`, `userRoutes`, plus legacy `routes[]`
- `POST /api/routes/upload` — multipart form field `gpx` (requires v2 tables)

Without `DATABASE_URL`, the app uses the bundled GPX file; user routes can be imported via the map **GPX** button and stored in browser `localStorage`.
