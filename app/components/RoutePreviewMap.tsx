"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import bbox from "@turf/bbox";
import { lineString } from "@turf/helpers";
import type { MapRef } from "react-map-gl/mapbox";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { MapTrailLayers } from "./MapTrailLayers";
import { RotateIcon } from "./RotateIcon";
import { buildSubmittedRouteFocusMask } from "@/lib/mapFocusMask";
import { sectionsToHighlightCollection } from "@/lib/sectionUtils";
import type { PoiRow, SectionRow } from "@/lib/mapTypes";

const PREVIEW_MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

type Props = {
  proposedMain: GeoJSON.LineString | null;
  userRoute: GeoJSON.LineString | null;
  sections?: SectionRow[];
  matchedSections?: SectionRow[];
  entryExitPois?: PoiRow[];
  className?: string;
  focusPreview?: boolean;
  focusBufferKm?: number;
  /** Initial map bearing. Defaults to 0; pass 90 to match the main map's default orientation. */
  initialBearing?: number;
  /** Show a rotate widget so the user can flip orientation, same as the main map. */
  showRotateControl?: boolean;
};

function centerOfLine(line: GeoJSON.LineString): { longitude: number; latitude: number } {
  const bounds = bbox(lineString(line.coordinates)) as [number, number, number, number];
  return {
    longitude: (bounds[0] + bounds[2]) / 2,
    latitude: (bounds[1] + bounds[3]) / 2,
  };
}

function zoomForLineBounds(bounds: [number, number, number, number]): number {
  const span = Math.max(
    Math.abs(bounds[2] - bounds[0]),
    Math.abs(bounds[3] - bounds[1])
  );
  if (span > 2) return 8;
  if (span > 1) return 9;
  if (span > 0.5) return 10;
  if (span > 0.2) return 11;
  if (span > 0.08) return 12;
  return 13;
}

export function RoutePreviewMap({
  proposedMain,
  userRoute,
  sections = [],
  matchedSections = [],
  entryExitPois = [],
  className = "h-[280px] w-full",
  focusPreview = true,
  focusBufferKm = 4,
  initialBearing = 0,
  showRotateControl = false,
}: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const outsideMaskFeature = useMemo(() => {
    if (!focusPreview || !userRoute) return null;
    return buildSubmittedRouteFocusMask(userRoute, focusBufferKm);
  }, [focusPreview, userRoute, focusBufferKm]);

  const sectionHighlightFeatures = useMemo(
    () => sectionsToHighlightCollection(matchedSections),
    [matchedSections]
  );

  const proposedMainFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () =>
      proposedMain
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: "Proposed main", category: "proposed_main" },
                geometry: proposedMain,
              },
            ],
          }
        : { type: "FeatureCollection", features: [] },
    [proposedMain]
  );

  const userRoutesFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () =>
      userRoute
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: "Your route", status: "pending", source: "user" },
                geometry: userRoute,
              },
            ],
          }
        : { type: "FeatureCollection", features: [] },
    [userRoute]
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

  const emptyOfficial: GeoJSON.FeatureCollection<GeoJSON.LineString> = useMemo(
    () => ({ type: "FeatureCollection", features: [] }),
    []
  );

  const emptyCorridor: GeoJSON.FeatureCollection<GeoJSON.Polygon> = useMemo(
    () => ({ type: "FeatureCollection", features: [] }),
    []
  );

  // When there's no submitted userRoute (e.g. viewing a single trail section),
  // fall back to focusing on the first matched/highlighted section instead.
  const focusLine = userRoute ?? matchedSections[0]?.geometry ?? null;

  const initialViewState = useMemo(() => {
    if (focusLine?.coordinates?.length) {
      const center = centerOfLine(focusLine);
      const bounds = bbox(lineString(focusLine.coordinates)) as [number, number, number, number];
      return { ...center, zoom: zoomForLineBounds(bounds), bearing: initialBearing, pitch: 0 };
    }
    if (proposedMain?.coordinates?.length) {
      const center = centerOfLine(proposedMain);
      return { ...center, zoom: 9, bearing: initialBearing, pitch: 0 };
    }
    return { longitude: 121.8, latitude: 16.4, zoom: 8, bearing: initialBearing, pitch: 0 };
  }, [focusLine, proposedMain, initialBearing]);

  const onRotationClick = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const bearing = map.getBearing();
    const isNear270 = bearing > 200 && bearing < 340;
    const nextBearing = isNear270 ? 0 : 270;
    requestAnimationFrame(() => {
      map.setBearing(nextBearing);
    });
  }, []);

  const fitToFocus = useCallback(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !focusLine?.coordinates?.length) return;
    const bounds = bbox(lineString(focusLine.coordinates)) as [number, number, number, number];
    // fitBounds defaults bearing to 0 unless told otherwise; preserve whatever
    // orientation is currently set (initialBearing, or a rotate-widget toggle).
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: 56, maxZoom: 14, duration: 400, bearing: map.getBearing() }
    );
  }, [focusLine]);

  useEffect(() => {
    fitToFocus();
  }, [fitToFocus]);

  if (!token) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-sm text-stone-400 ${className}`}
      >
        Map preview requires NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-stone-700 ${className}`}>
      <Map
        key={focusLine ? `preview-${focusLine.coordinates.length}` : "preview-empty"}
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={initialViewState}
        mapStyle={PREVIEW_MAP_STYLE}
        onLoad={fitToFocus}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <MapTrailLayers
          idPrefix="preview-"
          outsideMaskFeature={outsideMaskFeature}
          outsideMaskOpacity={0.72}
          corridorFeatures={emptyCorridor}
          sectionHighlightFeatures={sectionHighlightFeatures}
          proposedMainFeatures={proposedMainFeatures}
          proposedMainColor="#9CA3AF"
          officialRoutesFeatures={emptyOfficial}
          userRoutesFeatures={userRoutesFeatures}
          poiFeatures={poiFeatures}
          entryExitLayerId="preview-entry-exit"
        />
      </Map>
      {showRotateControl && (
        <button
          type="button"
          title="Rotate map: 270° (North left) or 0° (North up)"
          aria-label="Toggle map rotation 270° / 0°"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-white text-[#333] shadow hover:bg-gray-100"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRotationClick();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <RotateIcon />
        </button>
      )}
      <div className="pointer-events-none absolute bottom-2 left-2 flex max-w-[90%] flex-col gap-1 rounded bg-stone-900/90 px-2 py-1.5 text-[10px] text-stone-300 shadow">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-[#9CA3AF]" /> Proposed main
          </span>
          {userRoute && (
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-0 w-4 border-t-2 border-dashed border-[#A78BFA]"
                aria-hidden
              />{" "}
              Your route (pending)
            </span>
          )}
          {matchedSections.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-4 rounded-sm bg-[#F59E0B]" />{" "}
              {userRoute ? "Matched section" : "This section"}
            </span>
          )}
        </div>
        {outsideMaskFeature && (
          <span className="text-[9px] text-stone-500">
            Bright area = your submitted route region
          </span>
        )}
        {sections.length > 0 && userRoute && (
          <span className="text-[9px] text-stone-500">
            Orange = trail section(s) your GPX aligns with · dots = entry/exit boundaries
          </span>
        )}
      </div>
    </div>
  );
}
