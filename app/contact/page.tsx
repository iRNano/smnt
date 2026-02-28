import Link from "next/link";
import { SMNTHeader, SMNTFooter } from "../components/SMNTLayout";

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
        <p className="text-[#525252] leading-relaxed mb-6">
          Get in touch with the SMNT team. Contact form coming soon.
        </p>
        <p className="text-[#525252]">
          <a href="mailto:contact@example.com" className="text-[#0D9488] hover:underline">
            contact@example.com
          </a>
        </p>
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
