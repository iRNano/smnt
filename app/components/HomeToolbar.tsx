"use client";

import { useEffect, useState } from "react";

import { SubmitRouteModal } from "./SubmitRouteModal";

export function HomeToolbar() {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [layersVisible, setLayersVisible] = useState({ routes: true, pois: true });

  useEffect(() => {
    const onOpenSubmit = () => setSubmitOpen(true);
    window.addEventListener("smnt-open-submit-route", onOpenSubmit);
    return () => window.removeEventListener("smnt-open-submit-route", onOpenSubmit);
  }, []);

  const toggleLayer = (layer: "routes" | "pois") => {
    const visible = !layersVisible[layer];
    setLayersVisible((prev) => ({ ...prev, [layer]: visible }));
    window.dispatchEvent(new CustomEvent("smnt-toggle-layer", { detail: { layer, visible } }));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleLayer("routes")}
            aria-pressed={layersVisible.routes}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              layersVisible.routes
                ? "border-[#E5E5E5] bg-[#F5F5F5] text-[#0A0A0A]"
                : "border-[#E5E5E5] bg-white text-[#A3A3A3]"
            }`}
          >
            Routes
          </button>
          <button
            type="button"
            onClick={() => toggleLayer("pois")}
            aria-pressed={layersVisible.pois}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              layersVisible.pois
                ? "border-[#E5E5E5] bg-[#F5F5F5] text-[#0A0A0A]"
                : "border-[#E5E5E5] bg-white text-[#A3A3A3]"
            }`}
          >
            POIs
          </button>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="rounded px-5 py-2.5 text-sm font-bold bg-[#F79F17] text-[#2C2626] hover:bg-[#2C2626] hover:text-white transition-colors"
          >
            Submit route
          </button>
          <a
            href="/donors"
            className="rounded px-5 py-2.5 text-sm font-bold border border-[#E5E5E5] hover:border-[#F79F17] hover:text-[#F79F17] transition-colors"
          >
            Explorer&apos;s Kit
          </a>
        </div>
      </div>
      <SubmitRouteModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
