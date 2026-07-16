import Link from "next/link";
import { notFound } from "next/navigation";
import { SMNTHeader, SMNTFooter } from "@/app/components/SMNTLayout";
import { SectionDetail } from "@/app/components/SectionDetail";
import { getSectionBySlug } from "@/lib/getSectionBySlug";
import { getMapApiResponse } from "@/lib/mapApiService";

type Props = { params: Promise<{ slug: string }> };

export default async function SectionPage({ params }: Props) {
  const { slug } = await params;
  const mapData = await getMapApiResponse();
  const section = await getSectionBySlug(slug, mapData);
  if (!section) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#0A0A0A]">
      <SMNTHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">{section.name}</h1>
        <SectionDetail section={section} mainLine={mapData.proposedMain?.geometry ?? null} />
        <p className="mt-6 text-[#525252] leading-relaxed">
          <Link href="/" className="text-[#0D9488] hover:underline">
            ← Back to map
          </Link>
        </p>
      </main>
      <SMNTFooter />
    </div>
  );
}
