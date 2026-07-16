"use client";

import { useMemo } from "react";
import length from "@turf/length";
import { lineString } from "@turf/helpers";

import { RoutePreviewMap } from "./RoutePreviewMap";
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
