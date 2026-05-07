"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_WIDTH = 720;
const HEIGHT = 120;
const PAD = { top: 12, right: 8, bottom: 20, left: 36 };

export type TrailProfile = { distances: number[]; elevations: number[] } | null;

type Props = {
  trailProfile: TrailProfile;
  onAddEntryExit?: (distanceKm: number, elevationM: number) => void;
  /** When set, draws a persistent cursor line synced with the route (km along trail). */
  cursorDistanceKm?: number;
  /** Click or drag on the chart to move the route cursor (km along trail). */
  onCursorChangeKm?: (km: number) => void;
};

function distanceIndexFromClientX(
  trailProfile: NonNullable<TrailProfile>,
  clientX: number,
  svgEl: SVGSVGElement,
  width: number
): { distance: number; elevation: number; index: number } {
  const rect = svgEl.getBoundingClientRect();
  const x = clientX - rect.left - PAD.left;
  const innerW = width - PAD.left - PAD.right;
  const maxD = trailProfile.distances[trailProfile.distances.length - 1] ?? 0;
  if (maxD === 0 || innerW <= 0) {
    return {
      distance: trailProfile.distances[0]!,
      elevation: trailProfile.elevations[0]!,
      index: 0,
    };
  }
  const t = Math.max(0, Math.min(1, x / innerW));
  const idx = Math.floor(t * (trailProfile.distances.length - 1));
  const i = Math.min(idx, trailProfile.distances.length - 1);
  return {
    distance: trailProfile.distances[i]!,
    elevation: trailProfile.elevations[i]!,
    index: i,
  };
}

/**
 * Elevation profile chart (distance km vs elevation m) as an overlay below the map controls.
 * Hover shows distance and elevation.
 */
export function ElevationProfileOverlay({
  trailProfile,
  onAddEntryExit,
  cursorDistanceKm,
  onCursorChangeKm,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hover, setHover] = useState<{ distance: number; elevation: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const apply = () => {
      const next = Math.max(320, Math.floor(el.getBoundingClientRect().width));
      setWidth(next);
    };
    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { pathD, pathArea, scaleX, scaleY, maxDist, yTicks } = useMemo(() => {
    if (!trailProfile?.distances?.length || trailProfile.distances.length !== trailProfile.elevations.length) {
      return {
        pathD: "",
        pathArea: "",
        scaleX: () => 0,
        scaleY: () => 0,
        maxDist: 0,
        yTicks: [] as number[],
      };
    }
    const dist = trailProfile.distances;
    const ele = trailProfile.elevations;
    const minE = Math.min(...ele);
    const maxE = Math.max(...ele);
    const maxD = dist[dist.length - 1] ?? 0;
    const range = maxE - minE || 1;
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const scaleX = (d: number) => PAD.left + (d / maxD) * innerW;
    const scaleY = (e: number) => PAD.top + innerH - ((e - minE) / range) * innerH;

    const points = dist.map((d, i) => `${scaleX(d)},${scaleY(ele[i]!)}`).join(" ");
    const pathD = `M ${points.split(" ").join(" L ")}`;
    const bottom = PAD.top + innerH;
    const pathArea = `M ${PAD.left},${bottom} L ${points.split(" ").join(" L ")} L ${scaleX(maxD)},${bottom} Z`;

    const ticks = [minE];
    for (let i = 1; i <= 3; i++) ticks.push(minE + (range * i) / 4);
    ticks.push(maxE);
    const yTicks = [...new Set(ticks.map((v) => Math.round(v)))].sort((a, b) => a - b);

    return { pathD, pathArea, scaleX, scaleY, maxDist: maxD, yTicks };
  }, [trailProfile, width]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!trailProfile?.distances?.length || maxDist === 0) return;
      const { distance, elevation } = distanceIndexFromClientX(trailProfile, e.clientX, e.currentTarget, width);
      setHover({ distance, elevation });
      if (onCursorChangeKm && e.buttons === 1) {
        onCursorChangeKm(distance);
      }
    },
    [trailProfile, maxDist, onCursorChangeKm, width]
  );

  const onMouseLeave = useCallback(() => setHover(null), []);

  const onClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!trailProfile?.distances?.length || maxDist === 0) return;
      const { distance, elevation } = distanceIndexFromClientX(trailProfile, e.clientX, e.currentTarget, width);
      if (e.shiftKey && onAddEntryExit) {
        onAddEntryExit(distance, elevation);
        return;
      }
      if (onCursorChangeKm) {
        onCursorChangeKm(distance);
        return;
      }
      if (onAddEntryExit) {
        onAddEntryExit(distance, elevation);
      }
    },
    [trailProfile, maxDist, onAddEntryExit, onCursorChangeKm, width]
  );

  if (!trailProfile?.distances?.length) return null;

  return (
    <div ref={containerRef} className="w-full" aria-label="Elevation profile">
      <div className="text-[10px] font-medium text-stone-600">Elevation (m)</div>
      {onCursorChangeKm && onAddEntryExit && (
        <div className="text-[9px] text-stone-500">Click: cursor · Shift+click: entry/exit</div>
      )}
      {onCursorChangeKm && !onAddEntryExit && (
        <div className="text-[9px] text-stone-500">Click or drag to move cursor</div>
      )}
      {!onCursorChangeKm && onAddEntryExit && (
        <div className="text-[9px] text-stone-500">Click to add entry/exit point</div>
      )}
      <svg
        width={width}
        height={HEIGHT}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        className="mt-1 block cursor-crosshair"
        role={onAddEntryExit || onCursorChangeKm ? "button" : undefined}
      >
        <defs>
          <linearGradient id="elevation-fill" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Y axis labels - elevation scale */}
        {yTicks.map((elev) => (
          <text
            key={elev}
            x={PAD.left - 4}
            y={scaleY(elev)}
            textAnchor="end"
            className="fill-stone-500 text-[9px]"
          >
            {elev} m
          </text>
        ))}
        {/* X axis label */}
        <text x={width / 2} y={HEIGHT - 4} textAnchor="middle" className="fill-stone-500 text-[9px]">
          Distance (km)
        </text>
        {/* Area under line */}
        <path
          d={pathArea}
          fill="url(#elevation-fill)"
        />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Route cursor (synced with map) */}
        {cursorDistanceKm != null && maxDist > 0 && (
          <line
            x1={scaleX(cursorDistanceKm)}
            y1={PAD.top}
            x2={scaleX(cursorDistanceKm)}
            y2={HEIGHT - PAD.bottom}
            stroke="#EA580C"
            strokeWidth="2"
          />
        )}
        {/* Hover vertical line */}
        {hover !== null && (
          <line
            x1={scaleX(hover.distance)}
            y1={PAD.top}
            x2={scaleX(hover.distance)}
            y2={HEIGHT - PAD.bottom}
            stroke="#F97316"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity={0.85}
          />
        )}
      </svg>
      {hover !== null && (
        <div className="mt-0.5 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-700">
          {hover.distance.toFixed(1)} km · {Math.round(hover.elevation)} m
        </div>
      )}
    </div>
  );
}
