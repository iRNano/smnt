"use client";

import { useMemo } from "react";
import length from "@turf/length";
import { lineString } from "@turf/helpers";

import { RoutePreviewMap } from "./RoutePreviewMap";
import { getPeakElevationM } from "@/lib/gpxPeakElevations";
import type { SectionRow } from "@/lib/mapTypes";

type Props = {
  section: SectionRow;
  mainLine?: GeoJSON.LineString | null;
  showPreviewMap?: boolean;
};

/** Reusable section detail body: used both in the map's click-through modal and the /sections/[slug] page. */
export function SectionDetail({ section, mainLine = null, showPreviewMap = true }: Props) {
  const lengthKm = useMemo(() => {
    if (!section.geometry?.coordinates?.length) return null;
    return length(lineString(section.geometry.coordinates), { units: "kilometers" });
  }, [section.geometry]);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[#525252]">
        <span className="font-medium text-[#0A0A0A]">From:</span> {section.from_poi}
        {" · "}
        <span className="font-medium text-[#0A0A0A]">To:</span> {section.to_poi}
        {lengthKm != null && (
          <>
            {" · "}
            <span className="font-medium text-[#0A0A0A]">Length:</span> {lengthKm.toFixed(1)} km
          </>
        )}
      </p>
      {section.description && (
        <p className="text-sm leading-relaxed text-[#525252]">{section.description}</p>
      )}
      {section.peaksInSection && section.peaksInSection.length > 0 && (
        <p className="text-sm leading-relaxed text-[#525252]">
          <span className="font-medium text-[#0A0A0A]">Passes near:</span>{" "}
          {section.peaksInSection
            .map((name) => {
              const elevation = getPeakElevationM(name);
              return elevation != null ? `${name} (${elevation.toLocaleString()} m)` : name;
            })
            .join(", ")}
        </p>
      )}
      {section.provinces && section.provinces.length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-xs text-[#525252]">
          <p>
            <span className="font-medium text-[#0A0A0A]">
              Province{section.provinces.length > 1 ? "s" : ""}:
            </span>{" "}
            {section.provinces.join(", ")}
          </p>
          <p className="mt-1">
            Proposed route only — not all sections are field-verified. For logistics and
            permits, start with the {section.provinces.length > 1 ? "relevant" : ""} provincial
            tourism or environment office. Boundaries are approximate; verify locally.
          </p>
        </div>
      )}
      {showPreviewMap && (
        <RoutePreviewMap
          proposedMain={mainLine}
          userRoute={null}
          sections={[section]}
          matchedSections={[section]}
          className="h-[260px] w-full"
          focusPreview={false}
          initialBearing={90}
          showRotateControl
        />
      )}
    </div>
  );
}
