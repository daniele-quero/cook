import Fuse from "fuse.js";
import type { GuideSummary } from "@/lib/guides";

export function createGuideSearch(guides: GuideSummary[]) {
  return new Fuse(guides, {
    keys: ["title", "tags", "description", "excerpt"],
    threshold: 0.35,
    ignoreLocation: true,
  });
}

export function getVisibleGuides(
  guides: GuideSummary[],
  query: string,
  selectedTag: string | null,
  search = createGuideSearch(guides),
) {
  const normalizedQuery = query.trim();
  const searchedGuides = normalizedQuery
    ? search.search(normalizedQuery).map((result) => result.item)
    : guides;

  return selectedTag
    ? searchedGuides.filter((guide) => guide.tags.includes(selectedTag))
    : searchedGuides;
}
