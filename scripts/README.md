# Database setup (Supabase)

1. **Enable PostGIS:** In Supabase Dashboard go to **Database → Extensions**, find **PostGIS** and enable it.

2. **Run schema and seed:** Open **SQL Editor**, paste the contents of `schema-and-seed.sql`, and run it. This creates `routes` and `pois` tables and inserts MVP seed data (Crow's Route, exit routes, POIs).

3. **Connection string:** In **Project Settings → Database** copy the connection string (URI) for use as `DATABASE_URL` in `.env.local` and Vercel. Use the "Connection pooling" URI if available (port 6543).
