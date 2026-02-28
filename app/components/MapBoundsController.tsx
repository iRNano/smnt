"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Turf bbox is [minX (lng), minY (lat), maxX (lng), maxY (lat)].
 * Leaflet expects [[south, west], [north, east]] = [[minLat, minLng], [maxLat, maxLng]].
 */
function bboxToLeafletBounds(bbox: [number, number, number, number]): [[number, number], [number, number]] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

type Props = {
  /** Turf bbox: [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number] | null;
  minZoom?: number;
  maxZoom?: number;
};

export function MapBoundsController({ bbox, minZoom = 6, maxZoom = 12 }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!bbox) return;
    const bounds = bboxToLeafletBounds(bbox);
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
  }, [map, bbox, minZoom, maxZoom]);

  return null;
}
