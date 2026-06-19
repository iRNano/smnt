# Deploy SMNT MVP (Vercel + Supabase)

**GPX-default:** If `DATABASE_URL` is not set, `GET /api/map` serves the proposed main trail from [lib/loadGpxTrail.ts](../lib/loadGpxTrail.ts) (authoritative GPX file). The map still requires **`NEXT_PUBLIC_MAPBOX_TOKEN`**. Set `DATABASE_URL` and apply the v2 schema to enable PostGIS routes, POIs, and GPX upload persistence.

## Prerequisites

- Mapbox access token (`NEXT_PUBLIC_MAPBOX_TOKEN`)
- (Optional) Supabase project with PostGIS enabled and [schema/seed](scripts/README.md) applied
- Git repo pushed to GitHub/GitLab/Bitbucket
- Vercel account

## 1. Supabase (optional)

1. In **Database → Extensions**, enable **PostGIS**.
2. Run [scripts/schema-and-seed.sql](scripts/schema-and-seed.sql) in the **SQL Editor** (v1 tables).
3. Run [scripts/schema-v2.sql](scripts/schema-v2.sql) for structured routes and `user_route_submissions` (GPX upload API).
4. In **Project Settings → Database**, copy the **Connection string** (URI). Use the **Connection pooling** string (port **6543**) for serverless. It looks like:
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

## 2. Vercel

1. Go to [vercel.com](https://vercel.com) and **Add New Project**.
2. Import your Git repository (e.g. GitHub).
3. **Environment Variables:** Add:
   - **Name:** `NEXT_PUBLIC_MAPBOX_TOKEN`  
   - **Value:** your Mapbox public token  
   - **Environment:** Production (and Preview if desired).
   - **Name:** `DATABASE_URL` *(optional)*  
   - **Value:** the Supabase connection string from step 1.4  
   - **Environment:** Production (and Preview if you want branch previews to use the DB).
4. Leave **Build Command** as `next build` and **Output** as default.
5. Deploy. Vercel will run `next build` and deploy.

## 3. Smoke test

1. Open the deployed URL (e.g. `https://your-project.vercel.app`).
2. **Home:** Map loads with Mapbox basemap; proposed main (gray) and corridor appear without DB. With `DATABASE_URL`, routes and POIs come from PostGIS. Click a POI for the popup. Use **GPX** on the map to import a purple user route.
3. **About, Contact, Donors:** Pages load with header/footer and ad placeholder.
4. If the map shows a Mapbox configuration message, set `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel. If upload fails with a DB error, check `DATABASE_URL` and that v2 schema is applied.

## Local development

1. Copy [.env.example](.env.example) to `.env.local`.
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN` (required).
3. Optionally set `DATABASE_URL` to your Supabase connection string.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
