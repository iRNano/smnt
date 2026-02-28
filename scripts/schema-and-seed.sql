-- SMNT MVP: Schema and seed for Supabase (PostgreSQL + PostGIS)
-- Run in Supabase: Database → SQL Editor. Enable PostGIS first: Database → Extensions → PostGIS.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Routes: line geometry, type, explorer credits
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  route_type text NOT NULL CHECK (route_type IN ('main', 'exit', 'not_passable')),
  geometry geometry(LineString, 4326) NOT NULL,
  explorer_credits jsonb DEFAULT '[]'::jsonb,
  opened_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- POIs: point geometry, type, description
CREATE TABLE IF NOT EXISTS pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  poi_type text NOT NULL CHECK (poi_type IN ('jump_off', 'supply', 'guides_shed', 'hospital', 'police', 'military')),
  description text,
  geometry geometry(Point, 4326) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS routes_updated_at ON routes;
CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS pois_updated_at ON pois;
CREATE TRIGGER pois_updated_at
  BEFORE UPDATE ON pois
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Seed: clear existing seed data (optional; remove if you want to preserve data)
-- TRUNCATE routes, pois RESTART IDENTITY CASCADE;

-- Main route: Crow's Route (approx 20km, sample LineString in Sierra Madre area, Philippines)
INSERT INTO routes (id, name, route_type, geometry, explorer_credits, opened_at)
VALUES (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Crow''s Route',
  'main',
  ST_GeomFromText('LINESTRING(121.05 14.65, 121.12 14.66, 121.18 14.64, 121.24 14.66, 121.30 14.65)', 4326),
  '["UST MC", "Crow Njjfdk", "Hdhkdh Udflj"]'::jsonb,
  '2025-06-03'
)
ON CONFLICT (id) DO NOTHING;

-- Exit route 1
INSERT INTO routes (id, name, route_type, geometry, explorer_credits, opened_at)
VALUES (
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'North Exit',
  'exit',
  ST_GeomFromText('LINESTRING(121.18 14.64, 121.20 14.68, 121.22 14.70)', 4326),
  '["MFPI"]'::jsonb,
  '2025-05-01'
)
ON CONFLICT (id) DO NOTHING;

-- Exit route 2
INSERT INTO routes (id, name, route_type, geometry, explorer_credits, opened_at)
VALUES (
  'a0000000-0000-4000-8000-000000000003'::uuid,
  'South Exit',
  'exit',
  ST_GeomFromText('LINESTRING(121.12 14.66, 121.10 14.62, 121.08 14.60)', 4326),
  '["UPM"]'::jsonb,
  '2025-05-15'
)
ON CONFLICT (id) DO NOTHING;

-- Not passable segment (red)
INSERT INTO routes (id, name, route_type, geometry, explorer_credits, opened_at)
VALUES (
  'a0000000-0000-4000-8000-000000000004'::uuid,
  'Unexplored segment',
  'not_passable',
  ST_GeomFromText('LINESTRING(121.28 14.66, 121.32 14.67)', 4326),
  '[]'::jsonb,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- POIs: jump-offs and supply/guides
INSERT INTO pois (id, name, poi_type, description, geometry)
VALUES
  (
    'b0000000-0000-4000-8000-000000000001'::uuid,
    'Brgy. Example Jump-off',
    'jump_off',
    'How to get here: From Manila take bus to XYZ. Alight at Brgy. Example. Trail starts at the barangay hall.',
    ST_SetSRID(ST_MakePoint(121.05, 14.65), 4326)
  ),
  (
    'b0000000-0000-4000-8000-000000000002'::uuid,
    'Midpoint Jump-off',
    'jump_off',
    'Access from North Exit trail. Water source nearby.',
    ST_SetSRID(ST_MakePoint(121.18, 14.64), 4326)
  ),
  (
    'b0000000-0000-4000-8000-000000000003'::uuid,
    'Supply Station Alpha',
    'supply',
    'First aid, water refill, basic supplies. Operated by Guides Association.',
    ST_SetSRID(ST_MakePoint(121.12, 14.66), 4326)
  ),
  (
    'b0000000-0000-4000-8000-000000000004'::uuid,
    'Guides Association Shed',
    'guides_shed',
    'Accredited guides and local info.',
    ST_SetSRID(ST_MakePoint(121.24, 14.66), 4326)
  )
ON CONFLICT (id) DO NOTHING;
