"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WheelEvent as ReactWheelEvent } from "react";
import along from "@turf/along";
import bbox from "@turf/bbox";
import distance from "@turf/distance";
import length from "@turf/length";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { lineString, point } from "@turf/helpers";
import type { MapRef } from "react-map-gl/mapbox";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { ElevationProfileOverlay } from "./ElevationProfileOverlay";
import { MapTrailLayers } from "./MapTrailLayers";
import { Modal } from "./Modal";
import { RotateIcon } from "./RotateIcon";
import { SectionDetail } from "./SectionDetail";
import { normalizeMapApiResponse } from "@/lib/normalizeMapApiResponse";
import { sectionsToHighlightCollection } from "@/lib/sectionUtils";
import { sierraMadreExtent } from "@/lib/sierraMadreExtent";
import { loadLocalUserRoutes, mergeUserRoutes } from "@/lib/userRoutesStorage";
import { LAYER_COLORS } from "@/lib/mapApiBuilder";
import type { MapData, PoiRow, SectionRow, TrailRouteRow } from "@/lib/mapTypes";

const ENTRY_EXIT_POIS_STORAGE_KEY = "smnt-entry-exit-pois";

const ENTRY_EXIT_POI_LAYER_ID = "entry-exit-pois-layer";
const SECTION_HIT_LAYER_ID = "section-hit";
const ROUTE_CREDITS_HIT_LAYER_ID = "route-credits-hit";

type MapboxMapInstance = NonNullable<ReturnType<NonNullable<MapRef["getMap"]>>>;

/** mapbox-gl throws if the layer hasn't been added to the style yet (e.g. before data loads). */
function queryLayerFeatures(map: MapboxMapInstance, point: [number, number], layerId: string) {
  if (!map.getLayer(layerId)) return [];
  return map.queryRenderedFeatures(point, { layers: [layerId] });
}

const LEGEND_ITEMS: { label: string; color: string }[] = [
  { label: "Main route", color: LAYER_COLORS.proposedMain },
  { label: "Exit", color: LAYER_COLORS.exit },
  { label: "Not passable", color: LAYER_COLORS.notPassable },
  { label: "User input", color: LAYER_COLORS.userRoute },
];

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
  const [selectedSectionDetail, setSelectedSectionDetail] = useState<SectionRow | null>(null);
  const [mapInfo, setMapInfo] = useState<{ zoom: number; bounds: string } | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<{
    name: string;
    credits: string;
    creditCount: number;
  } | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(null);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollHintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleLayers, setVisibleLayers] = useState({ routes: true, pois: true });

  useEffect(() => {
    const onToggleLayer = (e: Event) => {
      const { layer, visible } = (e as CustomEvent<{ layer: "routes" | "pois"; visible: boolean }>).detail;
      setVisibleLayers((prev) => ({ ...prev, [layer]: visible }));
    };
    window.addEventListener("smnt-toggle-layer", onToggleLayer);
    return () => window.removeEventListener("smnt-toggle-layer", onToggleLayer);
  }, []);

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

  const routeCreditsFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(() => {
    const rows: TrailRouteRow[] = [
      ...(data.proposedMain ? [data.proposedMain] : []),
      ...(data.officialRoutes ?? []),
      ...(data.userRoutes ?? []),
    ];
    return {
      type: "FeatureCollection",
      features: rows.map((r) => {
        const credits = r.explorer_credits ?? [];
        return {
          type: "Feature" as const,
          id: r.id,
          properties: {
            name: r.name,
            credits: credits.join(", "),
            creditCount: credits.length,
          },
          geometry: r.geometry,
        };
      }),
    };
  }, [data.proposedMain, data.officialRoutes, data.userRoutes]);

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

  const DEDUPE_THRESHOLD_KM = 0.3;

  const entryExitPois = useMemo(() => {
    const namedPois = data.pois ?? [];
    const suggested = (data.entryExitPoisSuggested ?? []).filter(
      (suggestion) =>
        !namedPois.some(
          (named) =>
            distance(named.geometry.coordinates, suggestion.geometry.coordinates, {
              units: "kilometers",
            }) < DEDUPE_THRESHOLD_KM
        )
    );
    return [...namedPois, ...suggested, ...userEntryExitPois];
  }, [data.pois, data.entryExitPoisSuggested, userEntryExitPois]);

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

  const cursorLngLat = useMemo(() => {
    if (!cursorPoint?.geometry?.coordinates?.length) return null;
    const [lng, lat] = cursorPoint.geometry.coordinates;
    return { lng, lat };
  }, [cursorPoint]);

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

      const features = queryLayerFeatures(map, point, ENTRY_EXIT_POI_LAYER_ID);
      if (features.length > 0) {
        const f = features[0];
        const props = f.properties as { id?: string; name?: string; description?: string };
        const coords = (f.geometry as GeoJSON.Point).coordinates;
        const [lng, lat] = coords;
        const poi = entryExitPois.find((p) => p.id === props?.id);
        setSelectedPoi(
          poi ?? {
            id: props?.id ?? "",
            name: props?.name ?? "Entry/exit",
            poi_type: "entry_exit",
            description: props?.description ?? null,
            geometry: { type: "Point", coordinates: [lng, lat] },
          }
        );
        return;
      }
      setSelectedPoi(null);

      const sectionHits = queryLayerFeatures(map, point, SECTION_HIT_LAYER_ID);
      if (sectionHits.length > 0) {
        const id = sectionHits[0]?.properties?.id as string | undefined;
        const section = data.sections?.find((s) => s.id === id) ?? null;
        if (section) {
          setSelectedSectionDetail(section);
        }
      }
    },
    [entryExitPois, data.sections]
  );

  const onMapMouseMove = useCallback(
    (e: { point: { x: number; y: number } }) => {
      const map = mapRef.current?.getMap?.();
      if (!map) return;
      const point: [number, number] = [e.point.x, e.point.y];

      const routeHits = queryLayerFeatures(map, point, ROUTE_CREDITS_HIT_LAYER_ID);
      if (routeHits.length > 0) {
        const props = routeHits[0]?.properties as
          | { name?: string; credits?: string; creditCount?: number }
          | undefined;
        setHoveredRoute({
          name: props?.name ?? "Route",
          credits: props?.credits ?? "",
          creditCount: props?.creditCount ?? 0,
        });
        setHoverPixel({ x: e.point.x, y: e.point.y });
      } else {
        setHoveredRoute(null);
        setHoverPixel(null);
      }

      const hits = queryLayerFeatures(map, point, SECTION_HIT_LAYER_ID);
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
    setHoveredRoute(null);
    setHoverPixel(null);
    const map = mapRef.current?.getMap?.();
    if (map) map.getCanvas().style.cursor = "";
  }, []);

  // Scroll requires Ctrl/Cmd so the mouse wheel scrolls the page by default;
  // holding the modifier temporarily hands the wheel to the map for zooming.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setScrollZoomEnabled(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setScrollZoomEnabled(false);
    };
    const onBlur = () => setScrollZoomEnabled(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const onMapWheel = useCallback((e: ReactWheelEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    setShowScrollHint(true);
    if (scrollHintTimeout.current) clearTimeout(scrollHintTimeout.current);
    scrollHintTimeout.current = setTimeout(() => setShowScrollHint(false), 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollHintTimeout.current) clearTimeout(scrollHintTimeout.current);
    };
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
      <div
        className="relative h-[60vh] min-h-[320px] w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
        onWheelCapture={onMapWheel}
      >
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
          interactiveLayerIds={[ENTRY_EXIT_POI_LAYER_ID, SECTION_HIT_LAYER_ID, ROUTE_CREDITS_HIT_LAYER_ID]}
          cursor={undefined}
          scrollZoom={scrollZoomEnabled}
        >
        <MapTrailLayers
          parkBoundaryFeatures={sierraMadreExtent}
          showRoutes={visibleLayers.routes}
          showPois={visibleLayers.pois}
          corridorFeatures={corridorFeatures}
          sectionHighlightFeatures={sectionHighlightFeatures}
          sectionHitFeatures={sectionHitFeatures}
          sectionHitLayerId={SECTION_HIT_LAYER_ID}
          routeCreditsHitFeatures={routeCreditsFeatures}
          routeCreditsHitLayerId={ROUTE_CREDITS_HIT_LAYER_ID}
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
      <div className="pointer-events-none absolute right-2 top-2 z-100 rounded-md bg-white/95 px-3 py-2 text-xs text-stone-700 shadow">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          Legend
        </div>
        <div className="flex flex-col gap-1">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
      {showScrollHint && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-100 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/75 px-3 py-2 text-xs font-medium text-white shadow-lg">
          Hold Ctrl (⌘ on Mac) + scroll to zoom
        </div>
      )}
      {hoveredRoute && hoverPixel && (
        <div
          className="pointer-events-none absolute z-100 max-w-[240px] rounded-md border border-stone-200 bg-white/95 px-3 py-2 text-xs text-stone-700 shadow-lg"
          style={{ left: hoverPixel.x + 14, top: hoverPixel.y + 14 }}
        >
          <div className="font-semibold text-stone-900">{hoveredRoute.name}</div>
          {hoveredRoute.creditCount > 0 ? (
            <div className="mt-1">
              <div className="text-[10px] uppercase tracking-wide text-stone-400">
                Explorer credits
              </div>
              <div>{hoveredRoute.credits}</div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-stone-500">No explorers credited yet.</span>
              <button
                type="button"
                className="pointer-events-auto font-medium text-[#F79F17] hover:underline"
                onClick={() => window.dispatchEvent(new Event("smnt-open-submit-route"))}
              >
                Be the first →
              </button>
            </div>
          )}
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

      <Modal
        open={!!selectedSectionDetail}
        onClose={() => setSelectedSectionDetail(null)}
        title={selectedSectionDetail?.name ?? "Section"}
        maxWidth="lg"
      >
        {selectedSectionDetail && (
          <>
            <SectionDetail section={selectedSectionDetail} mainLine={mainRoute?.geometry ?? null} />
            <div className="mt-4 text-right text-sm">
              <a
                href={`/sections/${selectedSectionDetail.slug}`}
                className="text-[#F79F17] hover:underline"
              >
                Open full page →
              </a>
            </div>
          </>
        )}
      </Modal>
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
  const [localUserRoutes, setLocalUserRoutes] = useState<TrailRouteRow[]>([]);

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
    setLocalUserRoutes(loadLocalUserRoutes());
    loadMapData().catch((err) => setError(err.message));
  }, [loadMapData]);

  useEffect(() => {
    const onRefresh = () => {
      setLocalUserRoutes(loadLocalUserRoutes());
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

  const mergedData: MapData = {
    ...data,
    userRoutes: mergeUserRoutes(data.userRoutes, localUserRoutes),
  };

  return (
    <MapContent
      data={mergedData}
      userEntryExitPois={userEntryExitPois}
      onAddEntryExit={handleAddEntryExit}
    />
  );
}
