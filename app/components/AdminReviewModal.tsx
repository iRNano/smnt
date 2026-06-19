"use client";

import { useEffect, useMemo, useState } from "react";
import length from "@turf/length";
import { lineString } from "@turf/helpers";

import { Modal } from "./Modal";
import { RoutePreviewMap } from "./RoutePreviewMap";
import { normalizeMapApiResponse } from "@/lib/normalizeMapApiResponse";
import { matchSubmissionToSections } from "@/lib/sectionUtils";
import type { PoiRow, SectionRow } from "@/lib/mapTypes";
import type { RouteSubmission } from "@/lib/submissionTypes";

type Props = {
  submission: RouteSubmission | null;
  open: boolean;
  onClose: () => void;
  onDecided: (updated: RouteSubmission) => void;
  reviewAction: (id: string, status: "approved" | "rejected", notes: string) => Promise<void>;
};

export function AdminReviewModal({
  submission,
  open,
  onClose,
  onDecided,
  reviewAction,
}: Props) {
  const [proposedMain, setProposedMain] = useState<GeoJSON.LineString | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [entryExitPois, setEntryExitPois] = useState<PoiRow[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNotes(submission?.reviewer_notes ?? "");
    setError(null);
    fetch("/api/map")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const data = normalizeMapApiResponse(json as Record<string, unknown>);
        setProposedMain(data.proposedMain?.geometry ?? null);
        setSections(data.sections);
        setEntryExitPois(data.entryExitPoisSuggested);
      });
  }, [open, submission?.reviewer_notes]);

  const matchedSections = useMemo(() => {
    if (!submission?.geometry || sections.length === 0) return [];
    return matchSubmissionToSections(submission.geometry, sections);
  }, [submission?.geometry, sections]);

  if (!submission) return null;

  const routeLengthKm = length(lineString(submission.geometry.coordinates), {
    units: "kilometers",
  });

  const decide = async (status: "approved" | "rejected") => {
    setBusy(true);
    setError(null);
    try {
      await reviewAction(submission.id, status, notes);
      onDecided({ ...submission, status, reviewer_notes: notes || null });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Review route submission" maxWidth="xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[#0A0A0A]">{submission.name}</h3>
            <p className="text-xs text-[#525252]">
              Submitted {new Date(submission.submitted_at).toLocaleString()} ·{" "}
              {routeLengthKm.toFixed(1)} km ·{" "}
              <span
                className={
                  submission.status === "pending"
                    ? "text-amber-700"
                    : submission.status === "approved"
                      ? "text-green-700"
                      : "text-red-700"
                }
              >
                {submission.status}
              </span>
            </p>
            {matchedSections.length > 0 && (
              <p className="mt-1 text-xs text-[#525252]">
                Sections: {matchedSections.map((s) => s.name).join("; ")}
              </p>
            )}
          </div>
        </div>

        <RoutePreviewMap
          proposedMain={proposedMain}
          userRoute={submission.geometry}
          sections={sections}
          matchedSections={matchedSections}
          entryExitPois={entryExitPois}
          className="h-[320px] w-full"
        />

        <div>
          <label htmlFor="reviewer-notes" className="mb-1 block text-sm font-medium">
            Reviewer notes (optional)
          </label>
          <textarea
            id="reviewer-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Aligns with km 38–50 of proposed main"
            className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {submission.status === "pending" && (
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide("rejected")}
              className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide("approved")}
              className="flex-1 rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F766E] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Approve"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
