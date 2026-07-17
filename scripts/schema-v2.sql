-- SMNT schema v2: trail_routes, user_route_submissions, trail_sections
-- Run after schema-and-seed.sql (or on a fresh DB with PostGIS enabled).
-- Supabase: Database → Extensions → PostGIS, then SQL Editor.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Official SMNT network (replaces semantic use of routes.main)
CREATE TABLE IF NOT EXISTS trail_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('proposed_main', 'exit', 'not_passable', 'verified_main')),
  verification_status text NOT NULL DEFAULT 'proposed' CHECK (verification_status IN ('proposed', 'verified')),
  geometry geometry(LineString, 4326) NOT NULL,
  explorer_credits jsonb DEFAULT '[]'::jsonb,
  opened_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trail_routes_category_idx ON trail_routes (category);
CREATE INDEX IF NOT EXISTS trail_routes_geom_idx ON trail_routes USING GIST (geometry);

-- User-contributed GPX tracks
CREATE TABLE IF NOT EXISTS user_route_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'User route',
  geometry geometry(LineString, 4326) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source_format text NOT NULL DEFAULT 'gpx',
  user_id uuid,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewer_notes text
);

CREATE INDEX IF NOT EXISTS user_route_submissions_status_idx ON user_route_submissions (status);
CREATE INDEX IF NOT EXISTS user_route_submissions_geom_idx ON user_route_submissions USING GIST (geometry);

-- Trail sections (for /sections/[slug])
CREATE TABLE IF NOT EXISTS trail_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  from_poi text NOT NULL DEFAULT '',
  to_poi text NOT NULL DEFAULT '',
  description text,
  geometry geometry(LineString, 4326) NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trail_sections_slug_idx ON trail_sections (slug);

-- Optional persisted corridor polygon
CREATE TABLE IF NOT EXISTS trail_corridors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  derived_from_route_id uuid REFERENCES trail_routes(id) ON DELETE SET NULL,
  buffer_km numeric NOT NULL DEFAULT 8,
  geometry geometry(Polygon, 4326) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trail_corridors_geom_idx ON trail_corridors USING GIST (geometry);

-- updated_at triggers (reuse function from v1 if present)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trail_routes_updated_at ON trail_routes;
CREATE TRIGGER trail_routes_updated_at
  BEFORE UPDATE ON trail_routes
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS user_route_submissions_updated_at ON user_route_submissions;
CREATE TRIGGER user_route_submissions_updated_at
  BEFORE UPDATE ON user_route_submissions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trail_sections_updated_at ON trail_sections;
CREATE TRIGGER trail_sections_updated_at
  BEFORE UPDATE ON trail_sections
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Migrate legacy routes → trail_routes (idempotent)
INSERT INTO trail_routes (id, name, category, verification_status, geometry, explorer_credits, opened_at)
SELECT
  id,
  name,
  CASE route_type
    WHEN 'main' THEN 'proposed_main'
    WHEN 'exit' THEN 'exit'
    WHEN 'not_passable' THEN 'not_passable'
    ELSE 'proposed_main'
  END,
  CASE route_type WHEN 'main' THEN 'proposed' ELSE 'proposed' END,
  geometry,
  explorer_credits,
  opened_at
FROM routes
WHERE NOT EXISTS (SELECT 1 FROM trail_routes tr WHERE tr.id = routes.id)
ON CONFLICT (id) DO NOTHING;

-- Note: v1 `routes` and `pois` tables are kept for backward compatibility.
-- New application code reads trail_routes and user_route_submissions.

ALTER TABLE user_route_submissions ADD COLUMN IF NOT EXISTS reviewer_notes text;
ALTER TABLE user_route_submissions ADD COLUMN IF NOT EXISTS submitted_by text;

-- Points confirmed by the contributor during submission (docs/GPX_STRUCTURE.md §4),
-- scoped to one submission. Cascade-deletes with the submission (e.g. on rejection).
CREATE TABLE IF NOT EXISTS submission_pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES user_route_submissions(id) ON DELETE CASCADE,
  name text NOT NULL,
  poi_type text NOT NULL CHECK (poi_type IN ('start', 'exit', 'camp', 'water', 'peak', 'poi', 'danger', 'other')),
  geometry geometry(Point, 4326) NOT NULL,
  source text NOT NULL DEFAULT 'contributor' CHECK (source IN ('contributor', 'inferred')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submission_pois_submission_idx ON submission_pois (submission_id);
CREATE INDEX IF NOT EXISTS submission_pois_geom_idx ON submission_pois USING GIST (geometry);
