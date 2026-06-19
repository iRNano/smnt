"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import along from "@turf/along";
import bbox from "@turf/bbox";
import length from "@turf/length";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { lineString, point } from "@turf/helpers";
import type { MapRef } from "react-map-gl/mapbox";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { ElevationProfileOverlay } from "./ElevationProfileOverlay";
import { MapTrailLayers } from "./MapTrailLayers";
import { normalizeMapApiResponse } from "@/lib/normalizeMapApiResponse";
import { sectionsToHighlightCollection } from "@/lib/sectionUtils";
import type { MapData, PoiRow, SectionRow } from "@/lib/mapTypes";

const ENTRY_EXIT_POIS_STORAGE_KEY = "smnt-entry-exit-pois";

const ENTRY_EXIT_POI_LAYER_ID = "entry-exit-pois-layer";
const SECTION_HIT_LAYER_ID = "section-hit";
const FOLLOW_MAP_ZOOM = 13;

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

function RouteCursorMarker({
  longitude,
  latitude,
  onDrag,
}: {
  longitude: number;
  latitude: number;
  onDrag: (lng: number, lat: number) => void;
}) {
  // Marker dragging has its own "free-drag" visual; we re-snap every frame
  // so the cursor stays locked to the route while the mouse is held.
  const rafId = useRef<number | null>(null);
  const pending = useRef<{ lng: number; lat: number } | null>(null);

  const flush = useCallback(() => {
    if (!pending.current) return;
    onDrag(pending.current.lng, pending.current.lat);
  }, [onDrag]);

  const schedule = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      flush();
    });
  }, [flush]);

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleDrag = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      pending.current = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      schedule();
    },
    [schedule]
  );

  const handleDragEnd = useCallback(() => {
    flush();
  }, [flush]);

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="center"
      draggable
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex h-5 w-5 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#EA580C] shadow-md active:cursor-grabbing"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      />
    </Marker>
  );
}

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
  const [hoveredSection, setHoveredSection] = useState<SectionRow | null>(null);
  const [mapInfo, setMapInfo] = useState<{ zoom: number; bounds: string } | null>(null);

  const boundsBbox = useMemo((): [number, number, number, number] | null => {
    const main = data.proposedMain;
    if (!main?.geometry?.coordinates?.length) return null;
    const line = lineString(main.geometry.coordinates);
    return bbox(line) as [number, number, number, number];
  }, [data.proposedMain]);

  const proposedMainFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () =>
      data.proposedMain
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: data.proposedMain.id,
                properties: {
                  name: data.proposedMain.name,
                  category: data.proposedMain.category,
                },
                geometry: data.proposedMain.geometry,
              },
            ],
          }
        : { type: "FeatureCollection", features: [] },
    [data.proposedMain]
  );

  const officialRoutesFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: (data.officialRoutes || []).map((r) => ({
        type: "Feature" as const,
        id: r.id,
        properties: {
          name: r.name,
          category: r.category,
          explorer_credits: r.explorer_credits,
        },
        geometry: r.geometry,
      })),
    }),
    [data.officialRoutes]
  );

  const userRoutesFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: (data.userRoutes || []).map((r) => ({
        type: "Feature" as const,
        id: r.id,
        properties: {
          name: r.name,
          status: r.status ?? "approved",
          source: r.source,
        },
        geometry: r.geometry,
      })),
    }),
    [data.userRoutes]
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

  const sectionHitFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () => ({
      type: "FeatureCollection",
      features: (data.sections ?? []).map((s) => ({
        type: "Feature" as const,
        id: s.id,
        properties: { id: s.id, slug: s.slug, name: s.name },
        geometry: s.geometry,
      })),
    }),
    [data.sections]
  );

  const sectionHighlightFeatures = useMemo(() => {
    if (!hoveredSection) {
      return { type: "FeatureCollection" as const, features: [] };
    }
    return sectionsToHighlightCollection([hoveredSection]);
  }, [hoveredSection]);

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

  const mainRoute = data.proposedMain;

  const mainLine = useMemo(() => {
    if (!mainRoute?.geometry?.coordinates?.length) return null;
    return lineString(mainRoute.geometry.coordinates);
  }, [mainRoute]);

  const lineLengthKm = useMemo(() => {
    if (!mainLine) return 0;
    return length(mainLine, { units: "kilometers" });
  }, [mainLine]);

  const profileMaxKm = useMemo(() => {
    const d = data.trailProfile?.distances;
    const max = d?.length ? d[d.length - 1] : 0;
    return typeof max === "number" && max > 0 ? max : 0;
  }, [data.trailProfile]);

  // Cursor distance is stored in "profile km" so the elevation chart and map stay aligned.
  const cursorMaxKm = profileMaxKm || lineLengthKm;
  const [cursorKm, setCursorKm] = useState(0);

  useEffect(() => {
    if (cursorMaxKm <= 0) return;
    setCursorKm((prev) => {
      if (prev > 0 && prev <= cursorMaxKm) return prev;
      return cursorMaxKm / 2;
    });
  }, [cursorMaxKm]);

  const cursorPoint = useMemo(() => {
    if (!mainLine || lineLengthKm <= 0 || cursorMaxKm <= 0) return null;
    const profileKm = Math.max(0, Math.min(cursorMaxKm, cursorKm));
    const kmOnLine = (profileKm / cursorMaxKm) * lineLengthKm;
    try {
      return along(mainLine, kmOnLine, { units: "kilometers" });
    } catch {
      return null;
    }
  }, [mainLine, lineLengthKm, cursorMaxKm, cursorKm]);

  const snapDragToRoute = useCallback(
    (lng: number, lat: number) => {
      if (!mainLine || lineLengthKm <= 0 || cursorMaxKm <= 0) return;
      const snapped = nearestPointOnLine(mainLine, point([lng, lat]), { units: "kilometers" });
      const loc = snapped.properties.location;
      const kmOnLine =
        typeof loc === "number" ? loc : (snapped.properties as { totalDistance?: number }).totalDistance ?? 0;
      if (typeof kmOnLine !== "number" || Number.isNaN(kmOnLine)) return;
      const profileKm = (Math.max(0, Math.min(lineLengthKm, kmOnLine)) / lineLengthKm) * cursorMaxKm;
      setCursorKm(Math.max(0, Math.min(cursorMaxKm, profileKm)));
    },
    [mainLine, lineLengthKm, cursorMaxKm]
  );

  const setCursorKmClamped = useCallback(
    (km: number) => {
      if (cursorMaxKm <= 0) return;
      setCursorKm(Math.max(0, Math.min(cursorMaxKm, km)));
    },
    [cursorMaxKm]
  );

  const followMapRef = useRef<MapRef | null>(null);

  const cursorLngLat = useMemo(() => {
    if (!cursorPoint?.geometry?.coordinates?.length) return null;
    const [lng, lat] = cursorPoint.geometry.coordinates;
    return { lng, lat };
  }, [cursorPoint]);

  useEffect(() => {
    if (!cursorLngLat) return;
    const raw = followMapRef.current?.getMap?.();
    if (!raw) return;
    raw.jumpTo({
      center: [cursorLngLat.lng, cursorLngLat.lat],
      zoom: FOLLOW_MAP_ZOOM,
    });
  }, [cursorLngLat]);

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

      const sectionHits = map.queryRenderedFeatures(point, {
        layers: [SECTION_HIT_LAYER_ID],
      });
      if (sectionHits.length > 0) {
        const slug = sectionHits[0]?.properties?.slug as string | undefined;
        if (slug) {
          window.location.href = `/sections/${slug}`;
          return;
        }
      }

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

  const onMapMouseMove = useCallback(
    (e: { point: { x: number; y: number } }) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      const point: [number, number] = [e.point.x, e.point.y];
      const hits = map.queryRenderedFeatures(point, { layers: [SECTION_HIT_LAYER_ID] });
      if (hits.length === 0) {
        setHoveredSection(null);
        map.getCanvas().style.cursor = "";
        return;
      }
      const id = hits[0]?.properties?.id as string | undefined;
      const section = data.sections?.find((s) => s.id === id) ?? null;
      setHoveredSection(section);
      map.getCanvas().style.cursor = section ? "pointer" : "";
    },
    [data.sections]
  );

  const onMapMouseLeave = useCallback(() => {
    setHoveredSection(null);
    const map = mapRef.current?.getMap?.();
    if (map) map.getCanvas().style.cursor = "";
  }, []);

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

  const showRouteCursor = Boolean(mainLine && lineLengthKm > 0 && cursorMaxKm > 0 && cursorLngLat);

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Explicit height required: flex-1 + h-full parents collapse to 0, hiding the Map canvas */}
      <div className="relative h-[60vh] min-h-[320px] w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
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
          onMouseMove={onMapMouseMove}
          onMouseLeave={onMapMouseLeave}
          style={{ width: "100%", height: "100%" }}
          interactiveLayerIds={[ENTRY_EXIT_POI_LAYER_ID, SECTION_HIT_LAYER_ID]}
          cursor={undefined}
        >
        <MapTrailLayers
          corridorFeatures={corridorFeatures}
          sectionHighlightFeatures={sectionHighlightFeatures}
          sectionHitFeatures={sectionHitFeatures}
          sectionHitLayerId={SECTION_HIT_LAYER_ID}
          proposedMainFeatures={proposedMainFeatures}
          officialRoutesFeatures={officialRoutesFeatures}
          userRoutesFeatures={userRoutesFeatures}
          poiFeatures={poiFeatures}
          entryExitLayerId={ENTRY_EXIT_POI_LAYER_ID}
        />
        {showRouteCursor && cursorLngLat && (
          <RouteCursorMarker
            longitude={cursorLngLat.lng}
            latitude={cursorLngLat.lat}
            onDrag={snapDragToRoute}
          />
        )}
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
      {mapInfo && (
        <div className="absolute bottom-4 right-4 z-100 max-w-[280px] rounded bg-white/95 px-2 py-1.5 font-mono text-[10px] text-stone-600 shadow">
          <div>Zoom: {mapInfo.zoom.toFixed(2)}</div>
          <div className="truncate" title={mapInfo.bounds}>Bounds: {mapInfo.bounds}</div>
        </div>
      )}
      {hoveredSection && (
        <div className="pointer-events-none absolute left-14 top-2 z-100 max-w-[220px] rounded-md bg-white/95 px-2.5 py-1.5 text-xs text-stone-700 shadow">
          <div className="font-medium">{hoveredSection.name}</div>
          <div className="text-[10px] text-stone-500">Click for section details</div>
        </div>
      )}
      </div>

      {data.trailProfile?.distances?.length ? (
        <div className="w-full overflow-hidden rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
          <ElevationProfileOverlay
            trailProfile={data.trailProfile ?? null}
            onAddEntryExit={onAddEntryExit}
            cursorDistanceKm={showRouteCursor ? cursorKm : undefined}
            onCursorChangeKm={showRouteCursor ? setCursorKmClamped : undefined}
          />
        </div>
      ) : null}

      {showRouteCursor && cursorLngLat && (
        <div className="relative h-[240px] w-full shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <Map
            ref={followMapRef}
            mapboxAccessToken={token}
            initialViewState={{
              longitude: cursorLngLat.lng,
              latitude: cursorLngLat.lat,
              zoom: FOLLOW_MAP_ZOOM,
              bearing: 0,
            }}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            style={{ width: "100%", height: "100%" }}
            dragPan={false}
            scrollZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            dragRotate={false}
            touchZoomRotate={false}
            keyboard={false}
            attributionControl={false}
          >
            <MapTrailLayers
              idPrefix="follow-"
              corridorFeatures={corridorFeatures}
              proposedMainFeatures={proposedMainFeatures}
              officialRoutesFeatures={officialRoutesFeatures}
              userRoutesFeatures={userRoutesFeatures}
              poiFeatures={poiFeatures}
              entryExitLayerId="entry-exit-pois-layer-follow"
            />
            <RouteCursorMarker
              longitude={cursorLngLat.lng}
              latitude={cursorLngLat.lat}
              onDrag={snapDragToRoute}
            />
          </Map>
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-md bg-white/95 px-2.5 py-1.5 text-[10px] font-medium text-stone-600 shadow">
            Route detail (follows cursor)
          </div>
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

  const loadMapData = useCallback(() => {
    return fetch("/api/map")
      .then((res) => {
        if (!res.ok)
          throw new Error(res.status === 503 ? "Database not configured" : "Failed to load map");
        return res.json();
      })
      .then((json) => {
        const normalized = normalizeMapApiResponse(json as Record<string, unknown>);
        setData(normalized);
      });
  }, []);

  useEffect(() => {
    setUserEntryExitPois(loadUserEntryExitPois());
    loadMapData().catch((err) => setError(err.message));
  }, [loadMapData]);

  useEffect(() => {
    const onRefresh = () => {
      loadMapData().catch(() => {});
    };
    window.addEventListener("smnt-map-refresh", onRefresh);
    return () => window.removeEventListener("smnt-map-refresh", onRefresh);
  }, [loadMapData]);

  const handleAddEntryExit = useCallback(
    (distanceKm: number, _elevationM: number) => {
      if (!data?.proposedMain?.geometry?.coordinates?.length) return;
      const line = lineString(data.proposedMain.geometry.coordinates);
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
    [data?.proposedMain]
  );

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
