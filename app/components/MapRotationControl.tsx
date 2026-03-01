"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type MapWithBearing = ReturnType<typeof useMap> & {
  setBearing: (deg: number) => void;
  getBearing?: () => number;
};

const ROTATE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';

/**
 * Single rotate icon in the upper left. Click toggles map bearing between 270° (North left) and 0° (North up).
 */
export function MapRotationControl() {
  const map = useMap() as MapWithBearing;
  const controlRef = useRef<{ remove: () => void } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof map.setBearing !== "function") return;

    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted) return;

      // Prevent duplicates: remove any control we added in a previous run or double-invoke
      controlRef.current?.remove();
      controlRef.current = null;

      const Control = L.Control ?? (window as unknown as { L: { Control: L.Control } }).L?.Control;
      if (!Control) return;

      const getBearing = typeof map.getBearing === "function" ? () => map.getBearing!() : () => 0;

      const RotateControl = Control.extend({
        onAdd() {
          const div = document.createElement("div");
          div.className = "leaflet-control leaflet-bar";
          div.style.background = "#fff";
          div.style.borderRadius = "4px";

          const btn = document.createElement("button");
          btn.type = "button";
          btn.title = "Rotate map: 270° (North left) or 0° (North up)";
          btn.setAttribute("aria-label", "Toggle map rotation 270° / 0°");
          btn.style.cssText =
            "width:30px;height:28px;border:none;cursor:pointer;padding:0;background:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#333";
          btn.innerHTML = ROTATE_ICON_SVG;
          btn.addEventListener("click", () => {
            const current = getBearing();
            const isNear270 = current > 200 && current < 340;
            map.setBearing(isNear270 ? 0 : 270);
          });

          div.appendChild(btn);
          return div;
        },
      });

      const control = new (RotateControl as new (opts?: L.ControlOptions) => L.Control)({
        position: "topleft",
      });
      control.addTo(map);
      controlRef.current = control;
      cleanupRef.current = () => {
        control.remove();
        controlRef.current = null;
        cleanupRef.current = null;
      };
    });

    return () => {
      mounted = false;
      cleanupRef.current?.();
    };
  }, [map]);

  return null;
}
