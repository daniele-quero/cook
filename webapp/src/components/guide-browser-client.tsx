"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import type { GuideSummary } from "@/lib/guides";
import { GuideGrid } from "@/components/guide-grid";
import { createGuideSearch, getVisibleGuides } from "@/components/guide-search";

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
  const groupedGuides = useMemo(() => {
    const buckets = new Map<string, GuideSummary[]>();

    for (const guide of visibleGuides) {
      const groupTags = selectedTag ? [selectedTag] : guide.tags.length ? guide.tags : ["Altro"];
      for (const tag of groupTags) {
        const bucket = buckets.get(tag) ?? [];
        bucket.push(guide);
        buckets.set(tag, bucket);
      }
    }

    return [...buckets.entries()].sort(([first], [second]) => first.localeCompare(second, "it"));
  }, [selectedTag, visibleGuides]);

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
            groupedGuides.map(([tag, guides]) => (
              <div className="tag-group" key={tag}>
                <div className="tag-group-header">
                  <h3>{tag}</h3>
                  <span>{guides.length}</span>
                </div>
                <GuideGrid guides={guides} />
              </div>
            ))
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
