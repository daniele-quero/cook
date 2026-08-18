"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import type { GuideSummary } from "@/lib/guides";
import { GuideGrid } from "@/components/guide-grid";
import { createGuideSearch, getVisibleGuides } from "@/components/guide-search";
import { TagBucketGrid, buildTagBuckets } from "@/components/tag-groups";

type GuideBrowserClientProps = {
  guides: GuideSummary[];
  initialQuery: string;
  children: ReactNode;
  intro?: ReactNode;
};

type ViewMode = "simple" | "grouped";

export function GuideBrowserClient({ guides, initialQuery, children, intro }: GuideBrowserClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const deferredQuery = useDeferredValue(query);
  const tags = useMemo(
    () => [...new Set(guides.flatMap((guide) => guide.tags))].sort((first, second) => first.localeCompare(second, "it")),
    [guides],
  );
  const search = useMemo(() => createGuideSearch(guides), [guides]);
  const visibleGuides = getVisibleGuides(guides, deferredQuery, selectedTag, search);
  const isInitialResult = query === initialQuery && selectedTag === null;
  const groupedGuides = useMemo(() => buildTagBuckets(visibleGuides, selectedTag), [selectedTag, visibleGuides]);
  const handleTagGroupSelect = (tag: string) => {
    setSelectedTag((currentTag) => (currentTag === tag ? null : tag));
    setViewMode("simple");
  };

  return (
    <>
      <section className="search-intro" id="cerca" aria-labelledby="guide-heading">
        <p className="eyebrow">Guide tematiche</p>
        <h1 id="guide-heading">Quale tema vuoi approfondire?</h1>
        <p>
          Scopri tecniche, procedure e logiche di cottura per capire davvero i fondamenti della cucina: dal risotto alla
          mantecatura, fino alla scelta dei tempi e dei gesti corretti per ottenere risultati coerenti.
        </p>
        <label className="search-field">
          <Search size={20} aria-hidden="true" />
          <span className="sr-only">Cerca guide tematiche, ingredienti o tecniche</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca guide tematiche, ingredienti o tecniche"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Cancella la ricerca">
              <X size={17} aria-hidden="true" />
            </button>
          )}
        </label>
      </section>

      <section className="tag-section" aria-label="Filtra per tag">
        <div className="tag-list">
          <button className={!selectedTag ? "tag tag-active" : "tag"} type="button" onClick={() => setSelectedTag(null)}>
            Tutte
          </button>
          {tags.map((tag) => (
            <button
              className={selectedTag === tag ? "tag tag-active" : "tag"}
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {intro ? <section className="landing-intro">{intro}</section> : null}

      <section id="esplora" aria-live="polite" aria-labelledby="guide-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Archivio</p>
            <h2 id="guide-list-heading">Guide da esplorare</h2>
          </div>
          <div className="section-actions">
            <span>{visibleGuides.length} guide</span>
            {selectedTag ? (
              <button
                type="button"
                className="filter-clear"
                onClick={() => setSelectedTag(null)}
                aria-label={`Cancella filtro ${selectedTag}`}
              >
                <X size={14} aria-hidden="true" />
                Cancella filtro
              </button>
            ) : null}
            <div className="result-view-toggle" aria-label="Modalita di visualizzazione">
              <button type="button" className={viewMode === "simple" ? "is-selected" : ""} onClick={() => setViewMode("simple")}>
                Elenco semplice
              </button>
              <button type="button" className={viewMode === "grouped" ? "is-selected" : ""} onClick={() => setViewMode("grouped")}>
                Raggruppa per tag
              </button>
            </div>
          </div>
        </div>

        {isInitialResult && viewMode === "simple" ? (
          children
        ) : viewMode === "grouped" ? (
          groupedGuides.length ? (
            <TagBucketGrid
              buckets={groupedGuides}
              selectedTag={selectedTag}
              onSelect={handleTagGroupSelect}
            />
          ) : (
            <div className="empty-state">
              <Search size={28} aria-hidden="true" />
              <h3>Nessuna guida trovata</h3>
              <p>Prova un tema, un ingrediente o un tag diverso.</p>
            </div>
          )
        ) : (
          <GuideGrid guides={visibleGuides} />
        )}
      </section>
    </>
  );
}
