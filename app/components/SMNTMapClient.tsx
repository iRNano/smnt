"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import along from "@turf/along";
import bbox from "@turf/bbox";
import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";

// Leaflet CSS must be loaded on client
import "leaflet/dist/leaflet.css";

// import { sierraMadreExtent } from "@/lib/sierraMadreExtent"; // NSMNP commented out for now
import { ElevationProfileOverlay } from "./ElevationProfileOverlay";
import { MapBoundsController } from "./MapBoundsController";
import { MapRotationControl } from "./MapRotationControl";

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

function MapContent({
  data,
  userEntryExitPois,
  onAddEntryExit,
}: {
  data: MapData;
  userEntryExitPois: PoiRow[];
  onAddEntryExit: (distanceKm: number, elevationM: number) => void;
}) {
  const router = useRouter();
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [MapContainer, setMapContainer] = useState<React.ComponentType<unknown> | null>(null);
  const [GeoJSON, setGeoJSON] = useState<React.ComponentType<unknown> | null>(null);
  const [TileLayer, setTileLayer] = useState<React.ComponentType<unknown> | null>(null);
  const [CircleMarker, setCircleMarker] = useState<React.ComponentType<unknown> | null>(null);
  const [Popup, setPopup] = useState<React.ComponentType<unknown> | null>(null);
  const [Tooltip, setTooltip] = useState<React.ComponentType<unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      const leafletModule = await import("leaflet");
      if (typeof window !== "undefined") {
        (window as unknown as { L: unknown }).L = leafletModule.default ?? leafletModule;
      }
      await import("leaflet-rotate");
      const L = await import("react-leaflet");
      setMapContainer(L.MapContainer as React.ComponentType<unknown>);
      setGeoJSON(L.GeoJSON as React.ComponentType<unknown>);
      setTileLayer(L.TileLayer as React.ComponentType<unknown>);
      setCircleMarker(L.CircleMarker as React.ComponentType<unknown>);
      setPopup(L.Popup as React.ComponentType<unknown>);
      setTooltip(L.Tooltip as React.ComponentType<unknown>);
    })();
  }, []);

  const boundsBbox = useMemo((): [number, number, number, number] | null => {
    const main = data.routes?.find((r) => r.route_type === "main") ?? data.routes?.[0];
    if (!main?.geometry?.coordinates?.length) return null;
    const line = lineString(main.geometry.coordinates);
    return bbox(line) as [number, number, number, number];
  }, [data.routes]);

  const sectionFeatures = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.LineString> => ({
      type: "FeatureCollection",
      features: (data.sections || []).map((s) => ({
        type: "Feature" as const,
        id: s.id,
        properties: { slug: s.slug, sectionId: s.id, name: s.name },
        geometry: s.geometry,
      })),
    }),
    [data.sections]
  );

  const SECTION_BUFFER_KM = 10;
  const sectionPolygonFeatures = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> => {
      const features: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>[] = [];
      for (const s of data.sections || []) {
        const line = lineString(s.geometry.coordinates);
        const buffered = buffer(line, SECTION_BUFFER_KM, { units: "kilometers" });
        const geom = buffered?.geometry;
        if (!geom) continue;
        features.push({
          type: "Feature",
          id: `poly-${s.id}`,
          properties: { slug: s.slug, sectionId: s.id, name: s.name },
          geometry: geom as GeoJSON.Polygon | GeoJSON.MultiPolygon,
        });
      }
      return { type: "FeatureCollection", features };
    },
    [data.sections]
  );

  if (!MapContainer || !GeoJSON || !TileLayer || !CircleMarker || !Popup || !Tooltip) {
    return (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center bg-[#0F1419] text-[#A3A3A3]">
        Loading map…
      </div>
    );
  }

  const routeFeatures: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
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
  };

  const routeStyle = (feature?: GeoJSON.Feature<GeoJSON.LineString>) => {
    const t = feature?.properties?.route_type ?? "main";
    return {
      color: ROUTE_COLORS[t] ?? "#22C55E",
      weight: 5,
      opacity: 0.9,
    };
  };

  const onEachRouteFeature = (feature: GeoJSON.Feature<GeoJSON.LineString>, layer: L.Layer) => {
    const props = feature?.properties as { name?: string; explorer_credits?: string[] } | undefined;
    const name = props?.name ?? "Route";
    const credits = Array.isArray(props?.explorer_credits) ? props.explorer_credits : [];
    const label = credits.length > 0 ? `${name} · ${credits.join(", ")}` : name;
    const l = layer as { bindTooltip?: (content: string, opts?: { sticky?: boolean; className?: string }) => unknown };
    if (l?.bindTooltip) l.bindTooltip(label, { sticky: true, className: "map-route-tooltip" });
  };

  const sectionLineStyle = () => ({
    color: "#22C55E",
    weight: 4,
    opacity: 0.9,
  });

  const onEachSectionLineFeature = (_feature: GeoJSON.Feature<GeoJSON.LineString>, _layer: L.Layer) => {
    // Section lines are non-interactive; polygons handle click/hover
  };

  const sectionPolygonStyle = (feature?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>) => {
    const slug = (feature?.properties as { slug?: string })?.slug;
    const hovered = slug != null && hoveredSectionId === slug;
    return {
      fillColor: "#22C55E",
      fillOpacity: hovered ? 0.45 : 0.2,
      color: hovered ? "#EA580C" : "#16A34A",
      weight: hovered ? 3 : 1.5,
      opacity: hovered ? 1 : 0.8,
    };
  };

  const onEachSectionPolygonFeature = (
    feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
    layer: L.Layer
  ) => {
    const slug = (feature?.properties as { slug?: string })?.slug ?? "";
    const name = (feature?.properties as { name?: string })?.name ?? "Section";
    const l = layer as L.Layer & {
      bindTooltip?: (content: string, opts?: { sticky?: boolean }) => void;
      on?: (event: string, fn: () => void) => void;
    };
    if (l?.bindTooltip) l.bindTooltip(name, { sticky: true });
    if (l?.on) {
      l.on("click", () => router.push(`/sections/${slug}`));
      l.on("mouseover", () => setHoveredSectionId(slug));
      l.on("mouseout", () => setHoveredSectionId(null));
    }
  };

  const MC = MapContainer as React.ComponentType<{
    center: [number, number];
    zoom: number;
    className: string;
    style: React.CSSProperties;
    rotate?: boolean;
    bearing?: number;
    children: React.ReactNode;
  }>;
  const TL = TileLayer as React.ComponentType<{
    attribution: string;
    url: string;
  }>;
  const GJ = GeoJSON as React.ComponentType<{
    data: GeoJSON.FeatureCollection<GeoJSON.LineString>;
    style: (f?: GeoJSON.Feature<GeoJSON.LineString>) => { color: string; weight: number; opacity: number };
    onEachFeature: (feature: GeoJSON.Feature<GeoJSON.LineString>, layer: L.Layer) => void;
  }>;
  const GJPolygon = GeoJSON as React.ComponentType<{
    data: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    style: () => {
      fillColor: string;
      fillOpacity: number;
      color: string;
      weight: number;
      opacity: number;
    };
  }>;
  const GJSections = GeoJSON as React.ComponentType<{
    data: GeoJSON.FeatureCollection<GeoJSON.LineString>;
    style: () => { color: string; weight: number; opacity: number };
    onEachFeature: (feature: GeoJSON.Feature<GeoJSON.LineString>, layer: L.Layer) => void;
  }>;
  const GJSectionPolygons = GeoJSON as React.ComponentType<{
    data: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    style: (f?: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>) => {
      fillColor: string;
      fillOpacity: number;
      color: string;
      weight: number;
      opacity: number;
    };
    onEachFeature: (
      feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
      layer: L.Layer
    ) => void;
  }>;

  // Center on Sierra Madre trail (south 14.62°N to north 18.22°N; full range view)
  const center: [number, number] = [16.4, 121.8];
  const defaultZoom = 7;

  return (
    <MC
      center={center}
      zoom={defaultZoom}
      className="h-full w-full"
      style={{ height: "100%", minHeight: "60vh" }}
      rotate={true}
      bearing={270}
    >
      <MapBoundsController bbox={boundsBbox} />
      <TL
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* NSMNP terrain polygon commented out for now
      <GJPolygon
        data={sierraMadreExtent}
        style={() => ({
          fillColor: "#22C55E",
          fillOpacity: 0.3,
          color: "#16A34A",
          weight: 1.5,
          opacity: 0.9,
        })}
      />
      */}
      <MapRotationControl />
      {data.trailCorridor?.geometry && (
        <GJPolygon
          data={{
            type: "FeatureCollection",
            features: [data.trailCorridor],
          }}
          style={() => ({
            fillColor: "#22C55E",
            fillOpacity: 0.15,
            color: "#16A34A",
            weight: 1,
            opacity: 0.7,
          })}
        />
      )}
      <ElevationProfileOverlay
        trailProfile={data.trailProfile ?? null}
        onAddEntryExit={onAddEntryExit}
      />
      <GJ data={routeFeatures} style={routeStyle} onEachFeature={onEachRouteFeature} />
      {[...(data.entryExitPoisSuggested ?? []), ...userEntryExitPois].map((poi) => {
        const coords = poi.geometry.coordinates;
        const [lng, lat] = coords;
        const CM = CircleMarker as React.ComponentType<{
          center: [number, number];
          radius: number;
          pathOptions?: { color: string; fillColor: string; fillOpacity: number; weight: number };
          children: React.ReactNode;
        }>;
        const P = Popup as React.ComponentType<{ children: React.ReactNode }>;
        return (
          <CM
            key={poi.id}
            center={[lat, lng]}
            radius={8}
            pathOptions={{ color: "#EA580C", fillColor: "#F97316", fillOpacity: 0.9, weight: 2 }}
          >
            <P>
              <strong>{poi.name}</strong>
              {poi.description && <p className="mt-1 text-sm">{poi.description}</p>}
            </P>
          </CM>
        );
      })}
      {/* Interactive section polygons and other POIs commented out
      {sectionFeatures.features.length > 0 && (
        <GJSections
          data={sectionFeatures}
          style={sectionLineStyle}
          onEachFeature={onEachSectionLineFeature}
        />
      )}
      {sectionPolygonFeatures.features.length > 0 && (
        <GJSectionPolygons
          data={sectionPolygonFeatures}
          style={sectionPolygonStyle}
          onEachFeature={onEachSectionPolygonFeature}
        />
      )}
      {(data.pois || []).map((poi) => {
        const coords = poi.geometry.coordinates;
        const [lng, lat] = coords;
        const CM = CircleMarker as React.ComponentType<{
          center: [number, number];
          radius: number;
          pathOptions?: { color: string; fillColor: string; fillOpacity: number; weight: number };
          children: React.ReactNode;
        }>;
        const P = Popup as React.ComponentType<{ children: React.ReactNode }>;
        return (
          <CM
            key={poi.id}
            center={[lat, lng]}
            radius={8}
            pathOptions={{ color: "#0D9488", fillColor: "#2DD4BF", fillOpacity: 0.9, weight: 2 }}
          >
            <P>
              <strong>{poi.name}</strong>
              {poi.description && <p className="mt-1 text-sm">{poi.description}</p>}
            </P>
          </CM>
        );
      })}
      */}
    </MC>
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
        p &&
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
        if (!res.ok) throw new Error(res.status === 503 ? "Database not configured" : "Failed to load map");
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
