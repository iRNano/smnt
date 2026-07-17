import Link from "next/link";

/**
 * HiFi design preview — Home (Map) screen.
 * Tokens from docs/DESIGN_HIFI.md
 */
export default function DesignPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      {/* Ad slot — premium */}
      <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] h-[90px] flex items-center justify-center">
        <span className="text-sm text-[#A3A3A3]">Ad space — premium</span>
      </div>

      {/* Header */}
      <header className="h-14 border-b border-[#E5E5E5] bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-heading text-xl font-bold uppercase tracking-wide text-[#2C2626]">
            SMNT
          </Link>
          <nav className="hidden md:flex gap-6 font-heading text-sm font-semibold uppercase tracking-wide text-[#525252]">
            <Link href="/design" className="text-[#2C2626]">Home</Link>
            <Link href="/wireframes/explore" className="hover:text-[#F79F17]">Explore</Link>
            <Link href="/wireframes/resources" className="hover:text-[#F79F17]">Resources</Link>
            <Link href="/wireframes/operations" className="hover:text-[#F79F17]">Operations</Link>
            <Link href="/wireframes/support" className="hover:text-[#F79F17]">Support</Link>
            <Link href="/wireframes/about" className="hover:text-[#F79F17]">About</Link>
          </nav>
        </div>
      </header>

      {/* Layer toggles + CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2">
          {["Routes", "POIs", "Gradient", "Flora/Fauna", "Live"].map((layer) => (
            <button
              key={layer}
              type="button"
              className="rounded px-4 py-2 text-sm font-bold border border-[#E5E5E5] hover:border-[#F79F17] hover:text-[#F79F17] transition-colors"
            >
              {layer}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Link
            href="/wireframes/explore"
            className="rounded px-5 py-2.5 text-sm font-bold bg-[#F79F17] text-[#2C2626] hover:bg-[#2C2626] hover:text-white transition-colors"
          >
            Submit route
          </Link>
          <Link
            href="/wireframes/resources"
            className="rounded px-5 py-2.5 text-sm font-bold border border-[#E5E5E5] hover:border-[#F79F17] hover:text-[#F79F17] transition-colors"
          >
            Explorer&apos;s Kit
          </Link>
        </div>
      </div>

      {/* Map canvas — horizontal, full-width */}
      <div
        className="flex-1 min-h-[60vh] relative bg-[#0F1419] flex items-center justify-center"
        aria-label="Map canvas"
      >
        {/* Placeholder map content: route colors + POI hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full max-w-4xl opacity-30" viewBox="0 0 800 300" fill="none">
            <path
              d="M 50 150 Q 200 100 400 150 T 750 140"
              stroke="#22C55E"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 200 150 L 250 200 L 300 180"
              stroke="#F97316"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="150" cy="150" r="12" fill="#2DD4BF" />
            <circle cx="450" cy="140" r="12" fill="#2DD4BF" />
            <circle cx="600" cy="160" r="12" fill="#2DD4BF" />
          </svg>
        </div>
        <p className="relative text-[#A3A3A3] text-sm">Map canvas — routes and POIs</p>
      </div>

      {/* Legend */}
      <div className="bg-[#1A1F26] border-t border-[#2D3748] px-6 py-4 flex flex-wrap items-center gap-6 text-sm">
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#22C55E]" aria-hidden /> Main route
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#F97316]" aria-hidden /> Exit
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]" aria-hidden /> Not passable
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#A78BFA]" aria-hidden /> User input
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#2DD4BF]" aria-hidden /> Existing trail
        </span>
      </div>

      {/* Footer */}
      <footer className="bg-[#181818] px-6 py-5 text-sm text-[#999999]">
        Contact · Financial Report · Participating Orgs
      </footer>

      {/* Design system link */}
      <div className="fixed bottom-4 right-4 text-xs text-[#A3A3A3]">
        <Link href="/wireframes" className="underline hover:text-[#F79F17]">LoFi wireframes</Link>
      </div>
    </div>
  );
}
