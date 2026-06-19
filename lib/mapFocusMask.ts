import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";

/** World-spanning outer ring for an "inverse" fill mask (dims everything outside the hole). */
const WORLD_OUTER_RING: GeoJSON.Position[] = [
  [-180, 85],
  [180, 85],
  [180, -85],
  [-180, -85],
  [-180, 85],
];

function closeRing(ring: GeoJSON.Position[]): GeoJSON.Position[] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

/**
 * Build a polygon that covers the world with a hole cut out for `hole`.
 * Mapbox renders the outer ring as filled; the hole stays clear (focus area).
 */
export function buildOutsideFocusMask(hole: GeoJSON.Polygon): GeoJSON.Feature<GeoJSON.Polygon> {
  const holeRing = closeRing(hole.coordinates[0]);
  const inner = [...holeRing].reverse();

  return {
    type: "Feature",
    properties: { kind: "outside-focus-mask" },
    geometry: {
      type: "Polygon",
      coordinates: [WORLD_OUTER_RING, inner],
    },
  };
}

function polygonFromBufferedLine(
  line: GeoJSON.LineString,
  bufferKm: number
): GeoJSON.Polygon | null {
  const buffered = buffer(lineString(line.coordinates), bufferKm, { units: "kilometers" });
  if (!buffered) return null;

  if (buffered.geometry.type === "Polygon") {
    return buffered.geometry;
  }

  if (buffered.geometry.type === "MultiPolygon" && buffered.geometry.coordinates[0]) {
    return { type: "Polygon", coordinates: buffered.geometry.coordinates[0] };
  }

  return null;
}

/**
 * Focus mask for route preview: bright window = buffered region around the submitted track only.
 */
export function buildSubmittedRouteFocusMask(
  userRoute: GeoJSON.LineString,
  bufferKm = 4
): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (!userRoute.coordinates || userRoute.coordinates.length < 2) return null;
  const hole = polygonFromBufferedLine(userRoute, bufferKm);
  if (!hole) return null;
  return buildOutsideFocusMask(hole);
}
