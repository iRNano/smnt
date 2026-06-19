"use client";

import { useCallback, useEffect, useState } from "react";

import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";
import { AdminReviewModal } from "../components/AdminReviewModal";
import {
  adminFetch,
  clearAdminSecret,
  getAdminSecret,
  setAdminSecret,
} from "@/lib/adminClient";
import {
  loadPendingSubmissions,
  updatePendingSubmission,
} from "@/lib/pendingSubmissionsStorage";
import type { RouteSubmission } from "@/lib/submissionTypes";

type Tab = "pending" | "all";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [submissions, setSubmissions] = useState<RouteSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingLocalQueue, setUsingLocalQueue] = useState(false);
  const [selected, setSelected] = useState<RouteSubmission | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setAuthenticated(Boolean(getAdminSecret()));
  }, []);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    const statusParam = tab === "pending" ? "?status=pending" : "";
    const res = await adminFetch(`/api/routes/submissions${statusParam}`);

    if (res.ok) {
      const data = (await res.json()) as { submissions: RouteSubmission[] };
      setSubmissions(data.submissions);
      setUsingLocalQueue(false);
      setLoading(false);
      return;
    }

    if (res.status === 503) {
      const local = loadPendingSubmissions().filter(
        (s) => tab === "all" || s.status === "pending"
      );
      setSubmissions(local);
      setUsingLocalQueue(true);
      setLoading(false);
      return;
    }

    if (res.status === 401) {
      clearAdminSecret();
      setAuthenticated(false);
      setAuthError("Invalid admin secret.");
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (authenticated) void loadSubmissions();
  }, [authenticated, loadSubmissions]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAdminSecret(passwordInput.trim());
    const res = await adminFetch("/api/routes/submissions?status=pending");
    if (res.status === 401) {
      clearAdminSecret();
      setAuthError("Invalid admin secret.");
      return;
    }
    setAuthenticated(true);
    setPasswordInput("");
  };

  const reviewAction = async (
    id: string,
    status: "approved" | "rejected",
    notes: string
  ) => {
    if (usingLocalQueue || id.startsWith("local-")) {
      const updated = updatePendingSubmission(id, {
        status,
        reviewer_notes: notes || null,
      });
      if (!updated) throw new Error("Submission not found in local queue.");
      return;
    }

    const res = await adminFetch(`/api/routes/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewer_notes: notes || undefined }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Failed to update submission.");
    }
  };

  const handleDecided = (updated: RouteSubmission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (updated.status === "approved") {
      window.dispatchEvent(new CustomEvent("smnt-map-refresh"));
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
        <SMNTHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <form
            onSubmit={(e) => void handleLogin(e)}
            className="w-full max-w-sm rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm"
          >
            <h1 className="text-xl font-semibold text-[#0A0A0A]">SMNT Admin</h1>
            <p className="mt-1 text-sm text-[#525252]">
              Enter the admin secret to review route submissions.
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin secret"
              className="mt-4 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm"
              autoComplete="current-password"
            />
            {authError && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#0D9488] py-2.5 text-sm font-medium text-white hover:bg-[#0F766E]"
            >
              Sign in
            </button>
          </form>
        </main>
        <SMNTFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <SMNTHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A]">Route reviews</h1>
            <p className="text-sm text-[#525252]">
              Approve or reject user-submitted GPX tracks.
              {usingLocalQueue && " (Showing local dev queue — set DATABASE_URL for production.)"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAdminSecret();
              setAuthenticated(false);
            }}
            className="text-sm text-[#525252] hover:text-[#0A0A0A]"
          >
            Sign out
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {(["pending", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                tab === t
                  ? "bg-[#0D9488] text-white"
                  : "border border-[#E5E5E5] bg-white text-[#525252] hover:border-[#0D9488]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#525252]">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-8 text-center text-sm text-[#525252]">
            No {tab === "pending" ? "pending " : ""}submissions.
          </p>
        ) : (
          <ul className="divide-y divide-[#E5E5E5] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
            {submissions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[#FAFAFA]"
                  onClick={() => {
                    setSelected(s);
                    setReviewOpen(true);
                  }}
                >
                  <div>
                    <p className="font-medium text-[#0A0A0A]">{s.name}</p>
                    <p className="text-xs text-[#525252]">
                      {new Date(s.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : s.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SMNTFooter />
      <AdminReviewModal
        submission={selected}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onDecided={handleDecided}
        reviewAction={reviewAction}
      />
    </div>
  );
}
