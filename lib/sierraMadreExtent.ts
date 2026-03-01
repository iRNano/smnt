/**
 * Sierra Madre terrain extent for the map highlight layer.
 * Uses real data: Northern Sierra Madre Natural Park (NSMNP) approximate boundary.
 * NSMNP is the largest protected area in the Philippines (359,486 ha, Isabela province).
 * Boundaries: North = Isabela–Cagayan; South = Disabungan River; West = Cagayan Valley; East = Philippine Sea (coast).
 * Polygon follows valley (W) and coast (E) to avoid a box; extent within UNESCO/NIPAS bounds.
 * Source: UNESCO tentative list; NIPAS / DENR-BMB; OSM relation 2784140.
 */

// Simplified outline: W = Cagayan Valley edge, E = Isabela/Cagayan coast (no ocean fill).
const NORTHERN_SIERRA_MADRE_NATURAL_PARK: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [121.32, 15.99],   // SW – valley, south (Disabungan area)
      [122.22, 16.02],   // SE – coast south
      [122.38, 16.85],
      [122.42, 17.25],   // east coast mid
      [122.40, 17.75],
      [122.35, 18.05],   // NE – coast north (Isabela–Cagayan)
      [121.42, 18.05],   // NW – valley north
      [121.32, 17.0],    // west valley
      [121.32, 15.99],   // close
    ],
  ],
};

export const sierraMadreExtent: GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Northern Sierra Madre Natural Park", source: "NIPAS / simplified" },
      geometry: NORTHERN_SIERRA_MADRE_NATURAL_PARK,
    },
  ],
};
