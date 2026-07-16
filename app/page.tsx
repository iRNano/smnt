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
      <SMNTFooter />
    </div>
  );
}
