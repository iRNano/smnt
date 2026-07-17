"use client";

import { useState } from "react";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";
import { SubmitRouteModal } from "../components/SubmitRouteModal";

const ROUTE_MAKER_TOOLS = [
  { name: "Google Maps", href: "https://www.google.com/maps" },
  { name: "AllTrails", href: "https://www.alltrails.com" },
  { name: "Osmand", href: "https://osmand.net" },
];

export default function Explore() {
  const [submitOpen, setSubmitOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-[#2C2626] mb-4">
          Submit Your Route
        </h1>
        <p className="text-[#525252] leading-relaxed mb-10">
          Share your GPX track with SMNT. Submissions stay pending until an admin completes ocular
          verification (~1 month), then appear on the map with credit to your name or organization.
        </p>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-[#2C2626] mb-3">
            Submit a GPX route
          </h2>
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E5E5E5] bg-white px-4 py-10 text-center transition-colors hover:border-[#F79F17]"
          >
            <span className="text-sm font-bold text-[#2C2626]">Drop GPX or click to submit</span>
            <span className="mt-1 text-xs text-[#525252]">
              Opens the submit form with a live preview against the proposed main trail.
            </span>
          </button>
        </section>

        <section className="mb-10">
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-[#2C2626] mb-3">
            Active Expedition Locator
          </h2>
          <div className="flex items-center gap-3 rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 opacity-60">
            <span
              aria-hidden
              className="inline-flex h-5 w-9 items-center rounded-full bg-[#E5E5E5] px-0.5"
            >
              <span className="h-4 w-4 rounded-full bg-white shadow" />
            </span>
            <span className="text-sm text-[#525252]">
              Share my location on map — <span className="font-semibold">Coming soon</span>
            </span>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-[#2C2626] mb-3">
            Route maker tools
          </h2>
          <div className="flex flex-wrap gap-3">
            {ROUTE_MAKER_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-[#E5E5E5] px-5 py-3 text-sm font-bold text-[#2C2626] transition-colors hover:border-[#F79F17] hover:text-[#F79F17]"
              >
                {tool.name}
              </a>
            ))}
          </div>
        </section>
      </main>
      <SMNTFooter />
      <SubmitRouteModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </div>
  );
}
