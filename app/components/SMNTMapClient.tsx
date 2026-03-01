"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import along from "@turf/along";
import bbox from "@turf/bbox";
import { lineString } from "@turf/helpers";
import type { MapRef } from "react-map-gl/mapbox";
import Map, { Layer, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { ElevationProfileOverlay } from "./ElevationProfileOverlay";

type RouteRow = {
  id: string;
  name: string;
  route_type: string;
  explorer_credits: string[];
  opened_at: string | null;
  geometry: GeoJSON.LineString;
};

type PoiRow = {
  id: string;
  name: string;
  poi_type: string;
  description: string | null;
  geometry: GeoJSON.Point;
};

type SectionRow = {
  id: string;
  slug: string;
  name: string;
  from_poi: string;
  to_poi: string;
  description: string | null;
  geometry: GeoJSON.LineString;
};

type TrailProfile = { distances: number[]; elevations: number[] } | null;
type MapData = {
  routes: RouteRow[];
  pois: PoiRow[];
  sections: SectionRow[];
  trailProfile?: TrailProfile;
  trailCorridor?: GeoJSON.Feature<GeoJSON.Polygon> | null;
  entryExitPoisSuggested?: PoiRow[];
};

const ENTRY_EXIT_POIS_STORAGE_KEY = "smnt-entry-exit-pois";

const ROUTE_COLORS: Record<string, string> = {
  main: "#22C55E",
  exit: "#F97316",
  not_passable: "#EF4444",
};

function RotateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

const ENTRY_EXIT_POI_LAYER_ID = "entry-exit-pois-layer";

function MapContent({
  data,
  userEntryExitPois,
  onAddEntryExit,
}: {
  data: MapData;
  userEntryExitPois: PoiRow[];
  onAddEntryExit: (distanceKm: number, elevationM: number) => void;
}) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PoiRow | null>(null);
  const [mapInfo, setMapInfo] = useState<{ zoom: number; bounds: string } | null>(null);

  const boundsBbox = useMemo((): [number, number, number, number] | null => {
    const main = data.routes?.find((r) => r.route_type === "main") ?? data.routes?.[0];
    if (!main?.geometry?.coordinates?.length) return null;
    const line = lineString(main.geometry.coordinates);
    return bbox(line) as [number, number, number, number];
  }, [data.routes]);

  const routeFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: (data.routes || []).map((r) => ({
        type: "Feature" as const,
        id: r.id,
        properties: {
          name: r.name,
          route_type: r.route_type,
          explorer_credits: r.explorer_credits,
          opened_at: r.opened_at,
        },
        geometry: r.geometry,
      })),
    }),
    [data.routes]
  );

  const corridorFeatures: GeoJSON.FeatureCollection<GeoJSON.Polygon> = useMemo(
    () =>
      data.trailCorridor?.geometry
        ? {
          type: "FeatureCollection" as const,
          features: [data.trailCorridor as GeoJSON.Feature<GeoJSON.Polygon>],
        }
        : { type: "FeatureCollection" as const, features: [] },
    [data.trailCorridor]
  );

  const entryExitPois = useMemo(
    () => [...(data.entryExitPoisSuggested ?? []), ...userEntryExitPois],
    [data.entryExitPoisSuggested, userEntryExitPois]
  );

  const poiFeatures: GeoJSON.FeatureCollection<GeoJSON.Point> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: entryExitPois.map((poi) => ({
        type: "Feature" as const,
        id: poi.id,
        properties: {
          id: poi.id,
          name: poi.name,
          description: poi.description ?? "",
        },
        geometry: poi.geometry,
      })),
    }),
    [entryExitPois]
  );

  const updateMapInfo = useCallback(() => {
    const rawMap = mapRef.current?.getMap?.();
    if (!rawMap) return;
    const zoom = rawMap.getZoom();
    const b = rawMap.getBounds();
    if (!b) return;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    const boundsStr = `[${sw.lng.toFixed(4)}, ${sw.lat.toFixed(4)}, ${ne.lng.toFixed(4)}, ${ne.lat.toFixed(4)}]`;
    setMapInfo({ zoom, bounds: boundsStr });
  }, []);

  const onMapLoad = useCallback(() => {
    const rawMap = mapRef.current?.getMap?.();
    if (!rawMap || !boundsBbox) return;
    const bounds: [[number, number], [number, number]] = [
      [boundsBbox[0], boundsBbox[1]],
      [boundsBbox[2], boundsBbox[3]],
    ];
    rawMap.fitBounds(bounds, { padding: 80, maxZoom: 8 });
    rawMap.setMinZoom(3);
    rawMap.setMaxZoom(12);
    const pad = 2.5;
    const maxBounds: [[number, number], [number, number]] = [
      [boundsBbox[0] - pad, boundsBbox[1] - pad],
      [boundsBbox[2] + pad, boundsBbox[3] + pad],
    ];
    rawMap.setMaxBounds(maxBounds);
    requestAnimationFrame(() => {
      rawMap.setBearing(90);
      updateMapInfo();
    });
  }, [boundsBbox, updateMapInfo]);

  const onMapClick = useCallback(
    (e: { point: { x: number; y: number }; defaultPrevented?: boolean }) => {
      if (e.defaultPrevented) return;
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      const point: [number, number] = [e.point.x, e.point.y];
      const features = map.queryRenderedFeatures(point, {
        layers: [ENTRY_EXIT_POI_LAYER_ID],
      });
      if (features.length === 0) {
        setSelectedPoi(null);
        return;
      }
      const f = features[0];
      const props = f.properties as { id?: string; name?: string; description?: string };
      const coords = (f.geometry as GeoJSON.Point).coordinates;
      const [lng, lat] = coords;
      const poi = entryExitPois.find((p) => p.id === props?.id);
      if (poi) {
        setSelectedPoi(poi);
      } else {
        setSelectedPoi({
          id: props?.id ?? "",
          name: props?.name ?? "Entry/exit",
          poi_type: "entry_exit",
          description: props?.description ?? null,
          geometry: { type: "Point", coordinates: [lng, lat] },
        });
      }
    },
    [entryExitPois]
  );

  const onRotationClick = useCallback(() => {
    const ref = mapRef.current;
    if (!ref) return;
    const map = ref.getMap?.();
    if (!map) return;
    const bearing = map.getBearing();
    const isNear270 = bearing > 200 && bearing < 340;
    const nextBearing = isNear270 ? 0 : 270;
    requestAnimationFrame(() => {
      map.setBearing(nextBearing);
    });
  }, []);

  const onZoomIn = useCallback(() => {
    mapRef.current?.getMap?.()?.zoomIn({ duration: 150 });
  }, []);

  const onZoomOut = useCallback(() => {
    mapRef.current?.getMap?.()?.zoomOut({ duration: 150 });
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center bg-[#0F1419] text-[#A3A3A3]">
        Set NEXT_PUBLIC_MAPBOX_TOKEN to display the map.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ minHeight: "60vh" }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: 121.8,
          latitude: 16.4,
          zoom: 8.10,
          bearing: 90,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        onLoad={onMapLoad}
        onMoveEnd={updateMapInfo}
        onClick={onMapClick}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={[ENTRY_EXIT_POI_LAYER_ID]}
        cursor={undefined}
      >
        {corridorFeatures.features.length > 0 && (
          <Source id="corridor" type="geojson" data={corridorFeatures}>
            <Layer
              id="corridor-fill"
              type="fill"
              paint={{
                "fill-color": "#22C55E",
                "fill-opacity": 0.15,
              }}
            />
            <Layer
              id="corridor-line"
              type="line"
              paint={{
                "line-color": "#16A34A",
                "line-width": 1,
                "line-opacity": 0.7,
              }}
            />
          </Source>
        )}
        <Source id="route" type="geojson" data={routeFeatures}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": [
                "match",
                ["get", "route_type"],
                "main",
                ROUTE_COLORS.main,
                "exit",
                ROUTE_COLORS.exit,
                "not_passable",
                ROUTE_COLORS.not_passable,
                ROUTE_COLORS.main,
              ],
              "line-width": 5,
              "line-opacity": 0.9,
            }}
          />
        </Source>
        <Source id="entry-exit-pois" type="geojson" data={poiFeatures}>
          <Layer
            id={ENTRY_EXIT_POI_LAYER_ID}
            type="circle"
            paint={{
              "circle-radius": 8,
              "circle-color": "#F97316",
              "circle-stroke-color": "#EA580C",
              "circle-stroke-width": 2,
            }}
          />
        </Source>
        {selectedPoi && (
          <Popup
            longitude={selectedPoi.geometry.coordinates[0]}
            latitude={selectedPoi.geometry.coordinates[1]}
            onClose={() => setSelectedPoi(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="min-w-[140px]">
              <strong>{selectedPoi.name}</strong>
              {selectedPoi.description && (
                <p className="mt-1 text-sm">{selectedPoi.description}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
      <div className="absolute left-2 top-2 z-100 flex flex-col gap-1">
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-white text-[#333] shadow hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onZoomIn();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
            <line x1={12} y1={5} x2={12} y2={19} />
            <line x1={5} y1={12} x2={19} y2={12} />
          </svg>
        </button>
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-white text-[#333] shadow hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onZoomOut();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none">
            <line x1={5} y1={12} x2={19} y2={12} />
          </svg>
        </button>
        <button
          type="button"
          title="Rotate map: 270° (North left) or 0° (North up)"
          aria-label="Toggle map rotation 270° / 0°"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-white text-[#333] shadow hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRotationClick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RotateIcon />
        </button>
      </div>
      <ElevationProfileOverlay
        trailProfile={data.trailProfile ?? null}
        onAddEntryExit={onAddEntryExit}
      />
      {mapInfo && (
        <div className="absolute bottom-2 right-2 z-100 max-w-[280px] rounded bg-white/95 px-2 py-1.5 font-mono text-[10px] text-stone-600 shadow">
          <div>Zoom: {mapInfo.zoom.toFixed(2)}</div>
          <div className="truncate" title={mapInfo.bounds}>Bounds: {mapInfo.bounds}</div>
        </div>
      )}
    </div>
  );
}

function loadUserEntryExitPois(): PoiRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENTRY_EXIT_POIS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PoiRow =>
        !!p &&
        typeof p === "object" &&
        typeof (p as PoiRow).id === "string" &&
        typeof (p as PoiRow).name === "string" &&
        (p as PoiRow).geometry?.type === "Point" &&
        Array.isArray((p as PoiRow).geometry?.coordinates)
    );
  } catch {
    return [];
  }
}

export default function SMNTMapClient() {
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEntryExitPois, setUserEntryExitPois] = useState<PoiRow[]>([]);

  useEffect(() => {
    setUserEntryExitPois(loadUserEntryExitPois());
  }, []);

  const handleAddEntryExit = useCallback(
    (distanceKm: number, _elevationM: number) => {
      if (!data?.routes?.length) return;
      const main = data.routes.find((r) => r.route_type === "main") ?? data.routes[0];
      if (!main?.geometry?.coordinates?.length) return;
      const line = lineString(main.geometry.coordinates);
      const pt = along(line, distanceKm, { units: "kilometers" });
      const [lng, lat] = pt.geometry.coordinates;
      const newPoi: PoiRow = {
        id: `entry-exit-user-${Date.now()}`,
        name: "Entry/exit point",
        poi_type: "entry_exit",
        description: null,
        geometry: { type: "Point", coordinates: [lng, lat] },
      };
      setUserEntryExitPois((prev) => {
        const next = [...prev, newPoi];
        try {
          window.localStorage.setItem(ENTRY_EXIT_POIS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [data?.routes]
  );

  useEffect(() => {
    fetch("/api/map")
      .then((res) => {
        if (!res.ok)
          throw new Error(res.status === 503 ? "Database not configured" : "Failed to load map");
        return res.json();
      })
      .then((json) =>
        setData({
          routes: json.routes ?? [],
          pois: json.pois ?? [],
          sections: json.sections ?? [],
          trailProfile: json.trailProfile ?? null,
          trailCorridor: json.trailCorridor ?? null,
          entryExitPoisSuggested: json.entryExitPoisSuggested ?? [],
        })
      )
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center bg-[#0F1419] text-[#A3A3A3]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center bg-[#0F1419] text-[#A3A3A3]">
        Loading map…
      </div>
    );
  }

  return (
    <MapContent
      data={data}
      userEntryExitPois={userEntryExitPois}
      onAddEntryExit={handleAddEntryExit}
    />
  );
}
