import type { RouteSubmission } from "./submissionTypes";

const PENDING_SUBMISSIONS_KEY = "smnt-pending-submissions";

export function loadPendingSubmissions(): RouteSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is RouteSubmission =>
        !!s &&
        typeof s === "object" &&
        typeof (s as RouteSubmission).id === "string" &&
        (s as RouteSubmission).geometry?.type === "LineString"
    );
  } catch {
    return [];
  }
}

export function savePendingSubmission(submission: RouteSubmission): void {
  const existing = loadPendingSubmissions();
  window.localStorage.setItem(
    PENDING_SUBMISSIONS_KEY,
    JSON.stringify([submission, ...existing])
  );
}

export function updatePendingSubmission(
  id: string,
  patch: Partial<Pick<RouteSubmission, "status" | "reviewer_notes">>
): RouteSubmission | null {
  const existing = loadPendingSubmissions();
  const idx = existing.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...existing[idx], ...patch };
  existing[idx] = updated;
  window.localStorage.setItem(PENDING_SUBMISSIONS_KEY, JSON.stringify(existing));
  return updated;
}

export { PENDING_SUBMISSIONS_KEY };
