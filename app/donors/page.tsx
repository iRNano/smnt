import Link from "next/link";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";

export default function Donors() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Support SMNT</h1>
        <p className="text-[#525252] leading-relaxed mb-6">
          Your support helps increase SMNT capabilities tenfold. Donate to fund trail maintenance,
          explorer kits, and training.
        </p>
        <div className="border-2 border-dashed border-[#E5E5E5] rounded-lg p-8 text-center mb-8">
          <a
            href="https://gofundme.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg text-sm font-medium bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors"
          >
            GoFundMe
          </a>
        </div>
        <p className="text-sm text-[#525252]">Donors list — Coming soon.</p>
        <p className="mt-6">
          <Link href="/" className="text-[#0D9488] hover:underline">
            Back to map
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
