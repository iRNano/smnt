import Link from "next/link";
import { notFound } from "next/navigation";
import { SMNTHeader, SMNTFooter } from "@/app/components/SMNTLayout";
import { getSectionBySlug } from "@/lib/getSectionBySlug";

type Props = { params: Promise<{ slug: string }> };

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const section = getSectionBySlug(slug);
  if (!section) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">{section.name}</h1>
        <p className="text-[#525252] leading-relaxed mb-2">
          <span className="font-medium text-[#0A0A0A]">From:</span> {section.from_poi}
          {" · "}
          <span className="font-medium text-[#0A0A0A]">To:</span> {section.to_poi}
        </p>
        {section.description && (
          <p className="text-[#525252] leading-relaxed mb-6">{section.description}</p>
        )}
        <p className="text-[#525252] leading-relaxed mb-6">
          <Link href="/" className="text-[#0D9488] hover:underline">
            ← Back to map
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
