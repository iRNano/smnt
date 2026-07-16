import { getMapApiResponse } from "@/lib/mapApiService";
import type { MapApiResponse, SectionRow } from "@/lib/mapTypes";

/**
 * Looks up a section by slug from the same live data the map renders
 * (GPX-derived sections in file mode, DB-derived sections otherwise).
 * Pass `preloaded` to avoid a duplicate getMapApiResponse() call when
 * the caller already has it.
 */
export async function getSectionBySlug(
  slug: string,
  preloaded?: MapApiResponse
): Promise<SectionRow | null> {
  const data = preloaded ?? (await getMapApiResponse());
  return data.sections.find((s) => s.slug === slug) ?? null;
}

export async function getAllSectionSlugs(): Promise<string[]> {
  const data = await getMapApiResponse();
  return data.sections.map((s) => s.slug);
}
