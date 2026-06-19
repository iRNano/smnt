/**
 * Server-only: parse GPX XML to a single LineString (merged track points).
 */

import { gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";

export function parseGpxXmlToLineString(xml: string): GeoJSON.LineString | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    const fc = gpx(doc);
    if (!fc?.features?.length) return null;

    const coords: [number, number][] = [];
    for (const f of fc.features) {
      const geom = f.geometry;
      if (geom?.type === "LineString" && Array.isArray(geom.coordinates)) {
        for (const c of geom.coordinates) {
          if (Array.isArray(c) && c.length >= 2) {
            coords.push([Number(c[0]), Number(c[1])]);
          }
        }
      } else if (geom?.type === "MultiLineString" && Array.isArray(geom.coordinates)) {
        for (const line of geom.coordinates) {
          if (!Array.isArray(line)) continue;
          for (const c of line) {
            if (Array.isArray(c) && c.length >= 2) {
              coords.push([Number(c[0]), Number(c[1])]);
            }
          }
        }
      }
    }

    if (coords.length < 2) return null;
    return { type: "LineString", coordinates: coords };
  } catch {
    return null;
  }
}
