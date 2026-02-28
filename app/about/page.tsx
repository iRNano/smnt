import Link from "next/link";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">About SMNT</h1>
        <p className="text-[#525252] leading-relaxed mb-6">
          SMNT is our next Everest. The Impossible is Always Doable.
        </p>
        <p className="text-[#525252] leading-relaxed mb-6">
          This site is an info hub for trekkers and explorers, with an interactive map of routes,
          jump-offs, and points of interest. Every Manila university-based mountaineer can leave a
          mark on SMNT as their trophy.
        </p>
        <p className="text-[#525252] leading-relaxed">
          <Link href="/" className="text-[#0D9488] hover:underline">
            View the map
          </Link>
          {" · "}
          <Link href="/contact" className="text-[#0D9488] hover:underline">
            Contact us
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
