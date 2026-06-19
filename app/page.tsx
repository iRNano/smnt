import { SMNTHeader, SMNTFooter } from "./components/SMNTLayout";
import { HomeToolbar } from "./components/HomeToolbar";
import { SMNTMapDynamic } from "./components/SMNTMapDynamic";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <HomeToolbar />
      <div className="relative w-full shrink-0 px-4 py-4 md:px-6 md:py-5">
        <div className="w-full max-w-[1600px] mx-auto min-h-[calc(60vh+240px+1rem)]">
          <SMNTMapDynamic />
        </div>
      </div>
      <div className="bg-[#1A1F26] border-t border-[#2D3748] px-6 py-4 flex flex-wrap items-center gap-6 text-sm">
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#6B7280]" aria-hidden /> Main route
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#F97316]" aria-hidden /> Exit
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]" aria-hidden /> Not passable
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#7C3AED]" aria-hidden /> User input
        </span>
        <span className="flex items-center gap-2 text-[#F5F5F5]">
          <span className="w-3 h-3 rounded-full bg-[#2DD4BF]" aria-hidden /> Existing trail
        </span>
      </div>
      <SMNTFooter />
    </div>
  );
}
