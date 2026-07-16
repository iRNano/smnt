"use client";

import { Layer, Source } from "react-map-gl/mapbox";
import { LAYER_COLORS } from "@/lib/mapApiBuilder";

type Props = {
  idPrefix?: string;
  outsideMaskFeature?: GeoJSON.Feature<GeoJSON.Polygon> | null;
  outsideMaskOpacity?: number;
  corridorFeatures: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  sectionHighlightFeatures?: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  sectionHitFeatures?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  sectionHitLayerId?: string;
  routeCreditsHitFeatures?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  routeCreditsHitLayerId?: string;
  proposedMainFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  officialRoutesFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  userRoutesFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  poiFeatures: GeoJSON.FeatureCollection<GeoJSON.Point>;
  entryExitLayerId: string;
  /** Brighter proposed main for dark basemap previews */
  proposedMainColor?: string;
};

export function MapTrailLayers({
  idPrefix = "",
  outsideMaskFeature = null,
  outsideMaskOpacity = 0.55,
  corridorFeatures,
  sectionHighlightFeatures,
  sectionHitFeatures,
  sectionHitLayerId,
  routeCreditsHitFeatures,
  routeCreditsHitLayerId,
  proposedMainFeatures,
  officialRoutesFeatures,
  userRoutesFeatures,
  poiFeatures,
  entryExitLayerId,
  proposedMainColor,
}: Props) {
  const p = idPrefix;
  const hitLayerId = sectionHitLayerId ?? `${p}section-hit`;

  return (
    <>
      {outsideMaskFeature && (
        <Source
          id={`${p}outside-mask`}
          type="geojson"
          data={{ type: "FeatureCollection", features: [outsideMaskFeature] }}
        >
          <Layer
            id={`${p}outside-mask-fill`}
            type="fill"
            paint={{
              "fill-color": "#0a0f14",
              "fill-opacity": outsideMaskOpacity,
            }}
          />
        </Source>
      )}
      {corridorFeatures.features.length > 0 && (
        <Source id={`${p}corridor`} type="geojson" data={corridorFeatures}>
          <Layer
            id={`${p}corridor-fill`}
            type="fill"
            paint={{
              "fill-color": "#78716c",
              "fill-opacity": 0.14,
            }}
          />
          <Layer
            id={`${p}corridor-line`}
            type="line"
            paint={{
              "line-color": "#57534e",
              "line-width": 1,
              "line-opacity": 0.7,
            }}
          />
        </Source>
      )}
      {sectionHighlightFeatures && sectionHighlightFeatures.features.length > 0 && (
        <Source id={`${p}section-highlight`} type="geojson" data={sectionHighlightFeatures}>
          <Layer
            id={`${p}section-highlight-fill`}
            type="fill"
            paint={{
              "fill-color": LAYER_COLORS.sectionHighlight,
              "fill-opacity": 0.38,
            }}
          />
          <Layer
            id={`${p}section-highlight-line`}
            type="line"
            paint={{
              "line-color": LAYER_COLORS.sectionHighlight,
              "line-width": 2,
              "line-opacity": 0.85,
            }}
          />
        </Source>
      )}
      {proposedMainFeatures.features.length > 0 && (
        <Source id={`${p}proposed-main`} type="geojson" data={proposedMainFeatures}>
          <Layer
            id={`${p}proposed-main-line`}
            type="line"
            paint={{
              "line-color": proposedMainColor ?? LAYER_COLORS.proposedMain,
              "line-width": 5,
              "line-opacity": 0.95,
            }}
          />
        </Source>
      )}
      {routeCreditsHitFeatures && routeCreditsHitFeatures.features.length > 0 && (
        <Source id={`${p}route-credits-hit`} type="geojson" data={routeCreditsHitFeatures}>
          <Layer
            id={routeCreditsHitLayerId ?? `${p}route-credits-hit`}
            type="line"
            paint={{
              "line-color": LAYER_COLORS.proposedMain,
              "line-width": 16,
              "line-opacity": 0,
            }}
          />
        </Source>
      )}
      {sectionHitFeatures && sectionHitFeatures.features.length > 0 && (
        <Source id={`${p}section-hit`} type="geojson" data={sectionHitFeatures}>
          <Layer
            id={hitLayerId}
            type="line"
            paint={{
              "line-color": LAYER_COLORS.proposedMain,
              "line-width": 14,
              "line-opacity": 0,
            }}
          />
        </Source>
      )}
      {officialRoutesFeatures.features.length > 0 && (
        <Source id={`${p}official-routes`} type="geojson" data={officialRoutesFeatures}>
          <Layer
            id={`${p}official-routes-line`}
            type="line"
            paint={{
              "line-color": [
                "match",
                ["get", "category"],
                "exit",
                LAYER_COLORS.exit,
                "not_passable",
                LAYER_COLORS.notPassable,
                LAYER_COLORS.exit,
              ],
              "line-width": 5,
              "line-opacity": 0.9,
            }}
          />
        </Source>
      )}
      {userRoutesFeatures.features.length > 0 && (
        <Source id={`${p}user-routes`} type="geojson" data={userRoutesFeatures}>
          <Layer
            id={`${p}user-routes-line`}
            type="line"
            paint={{
              "line-color": LAYER_COLORS.userRoute,
              "line-width": 5,
              "line-opacity": 1,
              "line-dasharray": [
                "match",
                ["get", "status"],
                "pending",
                ["literal", [3, 2]],
                ["literal", [1, 0]],
              ],
            }}
          />
        </Source>
      )}
      <Source id={`${p}entry-exit-pois`} type="geojson" data={poiFeatures}>
        <Layer
          id={entryExitLayerId}
          type="circle"
          paint={{
            "circle-radius": 8,
            "circle-color": "#C2410C",
            "circle-stroke-color": "#9A3412",
            "circle-stroke-width": 2,
          }}
        />
      </Source>
    </>
  );
}

export function defaultSectionHitLayerId(idPrefix = "") {
  return `${idPrefix}section-hit`;
}
