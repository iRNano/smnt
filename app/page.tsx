import { SMNTHeader, SMNTFooter } from "./components/SMNTLayout";
import { SMNTMapDynamic } from "./components/SMNTMapDynamic";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
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
          <a
            href="/about"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors"
          >
            Submit route
          </a>
          <a
            href="/donors"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#E5E5E5] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
          >
            Explorer&apos;s Kit
          </a>
        </div>
      </div>
      <div className="h-[60vh] w-full relative shrink-0">
        <SMNTMapDynamic />
      </div>
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
      <SMNTFooter />
    </div>
  );
}
