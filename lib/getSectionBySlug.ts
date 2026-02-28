import { mockMapData } from "./mockMapData";
import type { SectionRow } from "./mockMapData";

export function getSectionBySlug(slug: string): SectionRow | null {
  const section = mockMapData.sections.find((s) => s.slug === slug) ?? null;
  return section;
}

export function getAllSectionSlugs(): string[] {
  return mockMapData.sections.map((s) => s.slug);
}
