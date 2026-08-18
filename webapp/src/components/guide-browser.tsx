import type { ReactNode } from "react";
import type { GuideSummary } from "@/lib/guides";
import { GuideBrowserClient } from "@/components/guide-browser-client";
import { GuideGrid } from "@/components/guide-grid";
import { getVisibleGuides } from "@/components/guide-search";

type GuideBrowserProps = {
  guides: GuideSummary[];
  initialQuery: string;
  intro?: ReactNode;
};

export function GuideBrowser({ guides, initialQuery, intro }: GuideBrowserProps) {
  const initialGuides = getVisibleGuides(guides, initialQuery, null);

  return (
    <GuideBrowserClient key={initialQuery} guides={guides} initialQuery={initialQuery} intro={intro}>
      <GuideGrid guides={initialGuides} />
    </GuideBrowserClient>
  );
}
