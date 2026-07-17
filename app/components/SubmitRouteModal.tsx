"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import along from "@turf/along";
import length from "@turf/length";
import { lineString } from "@turf/helpers";

import { Modal } from "./Modal";
import { RoutePreviewMap } from "./RoutePreviewMap";
import { normalizeMapApiResponse } from "@/lib/normalizeMapApiResponse";
import { parseGpxXmlToLineString } from "@/lib/parseGpxToLineString";
import { analyzeGpx, type WaypointRole } from "@/lib/gpxStructure";
import { savePendingSubmission } from "@/lib/pendingSubmissionsStorage";
import { matchSubmissionToSections } from "@/lib/sectionUtils";
import type { MapData, SectionRow } from "@/lib/mapTypes";
import type { ConfirmedPoi } from "@/lib/submissionTypes";

const POI_TYPE_LABELS: Record<WaypointRole, string> = {
  start: "Start",
  exit: "Exit",
  camp: "Camp",
  water: "Water source",
  summit: "Summit",
  poi: "Point of interest",
  danger: "Danger",
  other: "Other",
};

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
  const [submittedBy, setSubmittedBy] = useState("");
  const [userGeometry, setUserGeometry] = useState<GeoJSON.LineString | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmedPois, setConfirmedPois] = useState<ConfirmedPoi[]>([]);
  const [gpxWarnings, setGpxWarnings] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setRouteName("");
    setSubmittedBy("");
    setUserGeometry(null);
    setFileName(null);
    setError(null);
    setSubmitting(false);
    setSuccess(false);
    setConfirmedPois([]);
    setGpxWarnings([]);
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

    const analysis = analyzeGpx(xml);
    setGpxWarnings(analysis.warnings);
    if (analysis.waypoints.length > 0) {
      setConfirmedPois(
        analysis.waypoints.map((w) => ({
          name: w.name,
          poi_type: w.role,
          geometry: { type: "Point", coordinates: w.coordinates },
          source: "contributor",
        }))
      );
    } else if (geometry.coordinates.length >= 2) {
      const first = geometry.coordinates[0]!;
      const last = geometry.coordinates[geometry.coordinates.length - 1]!;
      setConfirmedPois([
        { name: "Start", poi_type: "start", geometry: { type: "Point", coordinates: first }, source: "inferred" },
        { name: "Exit", poi_type: "exit", geometry: { type: "Point", coordinates: last }, source: "inferred" },
      ]);
    } else {
      setConfirmedPois([]);
    }
  }, []);

  const updatePoiName = (idx: number, name: string) => {
    setConfirmedPois((prev) => prev.map((p, i) => (i === idx ? { ...p, name } : p)));
  };

  const updatePoiType = (idx: number, poi_type: WaypointRole) => {
    setConfirmedPois((prev) => prev.map((p, i) => (i === idx ? { ...p, poi_type } : p)));
  };

  const removePoi = (idx: number) => {
    setConfirmedPois((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPoi = () => {
    if (!userGeometry) return;
    const mid = along(lineString(userGeometry.coordinates), routeLengthKm ? routeLengthKm / 2 : 0, {
      units: "kilometers",
    });
    setConfirmedPois((prev) => [
      ...prev,
      {
        name: "New point",
        poi_type: "poi",
        geometry: { type: "Point", coordinates: mid.geometry.coordinates as [number, number] },
        source: "contributor",
      },
    ]);
  };

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
    if (submittedBy.trim()) formData.append("submitted_by", submittedBy.trim());
    if (confirmedPois.length > 0) formData.append("pois", JSON.stringify(confirmedPois));

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
          submitted_by: submittedBy.trim() || null,
          pois: confirmedPois.length > 0 ? confirmedPois : undefined,
        });
        setSuccess(true);
        onSubmitted?.();
        window.dispatchEvent(new CustomEvent("smnt-map-refresh"));
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
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your route has been submitted and is <strong>pending SMNT review</strong>. It will appear
            on the map after an admin approves it.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded bg-[#F79F17] px-4 py-2.5 text-sm font-bold text-[#2C2626] hover:bg-[#2C2626] hover:text-white"
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
                ? "border-[#F79F17] bg-amber-50"
                : "border-[#E5E5E5] bg-[#FAFAFA] hover:border-[#F79F17]"
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
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:border-[#F79F17] focus:outline-none focus:ring-2 focus:ring-[#F79F17]/20"
            />
          </div>

          <div>
            <label htmlFor="submitted-by" className="mb-1 block text-sm font-medium text-[#0A0A0A]">
              Your name or organization
            </label>
            <input
              id="submitted-by"
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="e.g. UP Mountaineers"
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:border-[#F79F17] focus:outline-none focus:ring-2 focus:ring-[#F79F17]/20"
            />
            <p className="mt-1 text-xs text-[#525252]">
              Shown as credit on the map once your route is approved.
            </p>
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

          {userGeometry && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0A0A0A]">Confirm points</span>
                <button
                  type="button"
                  onClick={addPoi}
                  className="text-xs font-semibold text-[#F79F17] hover:underline"
                >
                  + Add point
                </button>
              </div>
              <p className="text-xs text-[#525252]">
                {confirmedPois.some((p) => p.source === "inferred")
                  ? "No waypoints found in your GPX — start/exit were guessed from the track's endpoints. Confirm or correct them below."
                  : "Detected from your GPX file. Adjust names/types or remove any that aren't useful."}
              </p>
              {gpxWarnings.length > 0 && (
                <ul className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {gpxWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              {confirmedPois.length === 0 ? (
                <p className="text-xs text-[#78716c]">No points yet — add one if useful.</p>
              ) : (
                <ul className="space-y-2">
                  {confirmedPois.map((poi, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-2"
                    >
                      <input
                        type="text"
                        value={poi.name}
                        onChange={(e) => updatePoiName(idx, e.target.value)}
                        className="min-w-0 flex-1 rounded border border-[#E5E5E5] bg-white px-2 py-1 text-sm focus:border-[#F79F17] focus:outline-none"
                      />
                      <select
                        value={poi.poi_type}
                        onChange={(e) => updatePoiType(idx, e.target.value as WaypointRole)}
                        className="rounded border border-[#E5E5E5] bg-white px-2 py-1 text-sm focus:border-[#F79F17] focus:outline-none"
                      >
                        {(Object.keys(POI_TYPE_LABELS) as WaypointRole[]).map((role) => (
                          <option key={role} value={role}>
                            {POI_TYPE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removePoi(idx)}
                        aria-label={`Remove ${poi.name}`}
                        className="shrink-0 rounded px-2 py-1 text-sm text-[#991B1B] hover:bg-red-50"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
              className="flex-1 rounded bg-[#F79F17] px-4 py-2.5 text-sm font-bold text-[#2C2626] hover:bg-[#2C2626] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
