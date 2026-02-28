# Deploy SMNT MVP (Vercel + Supabase)

**Mock-first:** If `DATABASE_URL` is not set, `GET /api/map` returns mock data from [lib/mockMapData.ts](../lib/mockMapData.ts), so the map and UI work without any backend. Set `DATABASE_URL` to switch to real Supabase data.

## Prerequisites

- Supabase project with PostGIS enabled and [schema/seed](scripts/README.md) applied
- Git repo pushed to GitHub/GitLab/Bitbucket
- Vercel account

## 1. Supabase

1. In **Database → Extensions**, enable **PostGIS**.
2. Run [scripts/schema-and-seed.sql](scripts/schema-and-seed.sql) in the **SQL Editor**.
3. In **Project Settings → Database**, copy the **Connection string** (URI). Use the **Connection pooling** string (port **6543**) for serverless. It looks like:
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

## 2. Vercel

1. Go to [vercel.com](https://vercel.com) and **Add New Project**.
2. Import your Git repository (e.g. GitHub).
3. **Environment Variables:** Add:
   - **Name:** `DATABASE_URL`  
   - **Value:** the Supabase connection string from step 1.3  
   - **Environment:** Production (and Preview if you want branch previews to use the DB).
4. Leave **Build Command** as `next build` and **Output** as default.
5. Deploy. Vercel will run `next build` and deploy.

## 3. Smoke test

1. Open the deployed URL (e.g. `https://your-project.vercel.app`).
2. **Home:** Map should load; if `DATABASE_URL` is set, routes and POIs appear. Hover a route to see explorer credits. Click a POI for the popup.
3. **About, Contact, Donors:** Pages load with header/footer and ad placeholder.
4. If the map shows "Database not configured", check that `DATABASE_URL` is set in Vercel and that the Supabase DB allows connections from the internet (default).

## Local development

1. Copy [.env.example](.env.example) to `.env.local`.
2. Set `DATABASE_URL` to your Supabase connection string.
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
