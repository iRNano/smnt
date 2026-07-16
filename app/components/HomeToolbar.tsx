"use client";

import { useEffect, useState } from "react";

import { SubmitRouteModal } from "./SubmitRouteModal";

export function HomeToolbar() {
  const [submitOpen, setSubmitOpen] = useState(false);

  useEffect(() => {
    const onOpenSubmit = () => setSubmitOpen(true);
    window.addEventListener("smnt-open-submit-route", onOpenSubmit);
    return () => window.removeEventListener("smnt-open-submit-route", onOpenSubmit);
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2">
          <span className="px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5] bg-[#F5F5F5]">
            Routes
          </span>
          <span className="px-4 py-2 rounded-lg text-sm font-medium border border-[#E5E5E5]">
            POIs
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors"
          >
            Submit route
          </button>
          <a
            href="/donors"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#E5E5E5] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
          >
            Explorer&apos;s Kit
          </a>
        </div>
      </div>
      <SubmitRouteModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
}
