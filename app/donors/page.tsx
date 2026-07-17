import Link from "next/link";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";

export default function Donors() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-[#2C2626] mb-4">
          Support SMNT
        </h1>
        <p className="text-[#525252] leading-relaxed mb-6">
          Your support helps increase SMNT capabilities tenfold. Donate to fund trail maintenance,
          explorer kits, and training.
        </p>
        <div className="border-2 border-dashed border-[#E5E5E5] rounded-lg p-8 text-center mb-8">
          <a
            href="https://gofundme.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded px-6 py-3 text-sm font-bold bg-[#F79F17] text-[#2C2626] hover:bg-[#2C2626] hover:text-white transition-colors"
          >
            GoFundMe
          </a>
        </div>
        <p className="text-sm text-[#525252]">Donors list — Coming soon.</p>
        <p className="mt-6">
          <Link href="/" className="text-[#F79F17] font-semibold hover:underline">
            Back to map
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
