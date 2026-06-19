"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import length from "@turf/length";
import { lineString } from "@turf/helpers";

import { Modal } from "./Modal";
import { RoutePreviewMap } from "./RoutePreviewMap";
import { normalizeMapApiResponse } from "@/lib/normalizeMapApiResponse";
import { parseGpxXmlToLineString } from "@/lib/parseGpxToLineString";
import { savePendingSubmission } from "@/lib/pendingSubmissionsStorage";
import { matchSubmissionToSections } from "@/lib/sectionUtils";
import type { MapData, SectionRow } from "@/lib/mapTypes";

const MAX_GPX_BYTES = 5 * 1024 * 1024;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function SubmitRouteModal({ open, onClose, onSubmitted }: Props) {
  const [mapContext, setMapContext] = useState<Pick<
    MapData,
    "proposedMain" | "sections" | "entryExitPoisSuggested"
  > | null>(null);
  const [routeName, setRouteName] = useState("");
  const [userGeometry, setUserGeometry] = useState<GeoJSON.LineString | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetForm = useCallback(() => {
    setRouteName("");
    setUserGeometry(null);
    setFileName(null);
    setError(null);
    setSubmitting(false);
    setSuccess(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    fetch("/api/map")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const data = normalizeMapApiResponse(json as Record<string, unknown>);
        setMapContext({
          proposedMain: data.proposedMain,
          sections: data.sections,
          entryExitPoisSuggested: data.entryExitPoisSuggested,
        });
      })
      .catch(() => setError("Could not load proposed trail for preview."));
  }, [open, resetForm]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(false);
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Please upload a .gpx file.");
      return;
    }
    if (file.size > MAX_GPX_BYTES) {
      setError("File too large (max 5 MB).");
      return;
    }
    const xml = await file.text();
    const geometry = parseGpxXmlToLineString(xml);
    if (!geometry) {
      setError("Could not parse a valid track from this GPX file.");
      return;
    }
    const baseName = file.name.replace(/\.gpx$/i, "") || "User route";
    setRouteName((prev) => prev || baseName);
    setUserGeometry(geometry);
    setFileName(file.name);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const routeLengthKm = userGeometry
    ? length(lineString(userGeometry.coordinates), { units: "kilometers" })
    : null;

  const handleSubmit = async () => {
    if (!userGeometry || !routeName.trim()) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    const coordXml = userGeometry.coordinates
      .map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}"></trkpt>`)
      .join("");
    const gpxXml = `<?xml version="1.0"?><gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${routeName}</name><trkseg>${coordXml}</trkseg></trk></gpx>`;
    const gpxFile = new File([gpxXml], `${routeName}.gpx`, { type: "application/gpx+xml" });
    formData.append("gpx", gpxFile);
    formData.append("name", routeName.trim());

    try {
      const res = await fetch("/api/routes/upload", { method: "POST", body: formData });
      if (res.ok) {
        setSuccess(true);
        onSubmitted?.();
        window.dispatchEvent(new CustomEvent("smnt-map-refresh"));
        return;
      }

      if (res.status === 503) {
        savePendingSubmission({
          id: `local-${Date.now()}`,
          name: routeName.trim(),
          geometry: userGeometry,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });
        setSuccess(true);
        onSubmitted?.();
        return;
      }

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Submission failed.");
    } catch {
      setError("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const proposedGeometry = mapContext?.proposedMain?.geometry ?? null;
  const sections = mapContext?.sections ?? [];
  const entryExitPois = mapContext?.entryExitPoisSuggested ?? [];

  const matchedSections: SectionRow[] = useMemo(() => {
    if (!userGeometry || sections.length === 0) return [];
    return matchSubmissionToSections(userGeometry, sections);
  }, [userGeometry, sections]);

  const hasEntryExit = entryExitPois.length >= 2;
  const hasSections = sections.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Submit your route" maxWidth="xl">
      {success ? (
        <div className="space-y-4 py-2">
          <p className="rounded-lg bg-[#F0FDFA] px-4 py-3 text-sm text-[#0F766E]">
            Your route has been submitted and is <strong>pending SMNT review</strong>. It will appear
            on the map after an admin approves it.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E]"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[#525252]">
            Drop your GPX track to see how it aligns with the proposed SMNT main trail. Submissions
            stay pending until an SMNT admin verifies them.
          </p>

          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${
              dragOver
                ? "border-[#0D9488] bg-[#F0FDFA]"
                : "border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#0D9488]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              className="sr-only"
              onChange={onFileInput}
            />
            <span className="text-sm font-medium text-[#0A0A0A]">
              Drop .gpx here or click to browse
            </span>
            {fileName && (
              <span className="mt-1 text-xs text-[#525252]">{fileName}</span>
            )}
          </label>

          <div>
            <label htmlFor="route-name" className="mb-1 block text-sm font-medium text-[#0A0A0A]">
              Route name
            </label>
            <input
              id="route-name"
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="e.g. Crow's recon — Section 3"
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>

          {userGeometry && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#0A0A0A]">Preview on proposed trail</span>
                {routeLengthKm != null && (
                  <span className="text-[#525252]">{routeLengthKm.toFixed(1)} km</span>
                )}
              </div>
              <p className="text-xs text-[#525252]">
                Bright window follows your submitted track. Purple dashed = your GPX; gray = proposed
                main. Orange highlight = matching trail section(s).
              </p>
              {userGeometry && hasSections && (
                <div className="rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-xs text-[#525252]">
                  {matchedSections.length > 0 ? (
                    <>
                      <span className="font-medium text-[#0A0A0A]">Aligns with section(s):</span>
                      <ul className="mt-1 list-inside list-disc">
                        {matchedSections.map((s) => (
                          <li key={s.id}>{s.name}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <span>
                      No trail section matched within 3 km — your track may be off the proposed main
                      or between entry/exit boundaries.
                    </span>
                  )}
                  {!hasEntryExit && (
                    <span className="mt-1 block text-[#78716c]">
                      Entry/exit boundaries: not enough points on main trail yet.
                    </span>
                  )}
                </div>
              )}
              <RoutePreviewMap
                proposedMain={proposedGeometry}
                userRoute={userGeometry}
                sections={sections}
                matchedSections={matchedSections}
                entryExitPois={entryExitPois}
                className="h-[300px] w-full"
                focusPreview
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#E5E5E5] px-4 py-2.5 text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!userGeometry || !routeName.trim() || submitting}
              onClick={() => void handleSubmit()}
              className="flex-1 rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
