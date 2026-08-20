"use client";

import { Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import type { RecipeSummary } from "@/lib/recipes";
import { RecipeGrid } from "@/components/recipe-grid";
import { createRecipeSearch, getVisibleRecipes } from "@/components/recipe-search";
import { TagBucketGrid, buildTagBuckets } from "@/components/tag-groups";
import { Tooltip } from "@/components/tooltip";

type RecipeBrowserClientProps = {
  recipes: RecipeSummary[];
  initialQuery: string;
  children: ReactNode;
  intro?: ReactNode;
};

type ViewMode = "simple" | "grouped";

export function RecipeBrowserClient({ recipes, initialQuery, children, intro }: RecipeBrowserClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const deferredQuery = useDeferredValue(query);
  const search = useMemo(() => createRecipeSearch(recipes), [recipes]);
  const visibleRecipes = getVisibleRecipes(recipes, deferredQuery, selectedTag, search);
  const isInitialResult = query === initialQuery && selectedTag === null;
  const groupedRecipes = useMemo(() => buildTagBuckets(visibleRecipes, selectedTag), [selectedTag, visibleRecipes]);
  const handleTagGroupSelect = (tag: string) => {
    setSelectedTag((currentTag) => (currentTag === tag ? null : tag));
    setViewMode("simple");
  };

  return (
    <>
      <section className="search-intro" id="cerca" aria-labelledby="recipe-heading">
        <p className="eyebrow">Il tuo ricettario</p>
        <h1 id="recipe-heading">Quale ricetta cucini oggi?</h1>
        <p>
          Ricette tecniche, tempi chiari e passaggi da seguire senza fretta. Dal sous-vide al microonde, dalle salse ai
          contorni, qui trovi ricette ordinate per tecnica, tempi e passaggi essenziali. Per chi vuole capire cosa fa in
          cucina, senza aggiungere complicazioni inutili.
        </p>
        <Tooltip content="Cerca ricette per ingrediente, tecnica o titolo. I risultati si aggiornano mentre scrivi.">
          <label className="search-field">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">Cerca ricette, ingredienti o tecniche</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca ricette, ingredienti o tecniche"
            />
            {query && (
              <Tooltip content="Cancella il testo della ricerca e mostra nuovamente tutte le ricette.">
                <button type="button" onClick={() => setQuery("")} aria-label="Cancella la ricerca">
                  <X size={17} aria-hidden="true" />
                </button>
              </Tooltip>
            )}
          </label>
        </Tooltip>
      </section>

      {intro ? <section className="landing-intro">{intro}</section> : null}

      <section id="esplora" aria-live="polite" aria-labelledby="recipe-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Archivio</p>
            <h2 id="recipe-list-heading">Ricette da esplorare</h2>
          </div>
          <div className="section-actions">
            <span>{visibleRecipes.length} ricette</span>
            {selectedTag ? (
              <Tooltip content={`Rimuovi il filtro “${selectedTag}” e torna a vedere tutte le ricette.`}>
                <button
                  type="button"
                  className="filter-clear"
                  onClick={() => setSelectedTag(null)}
                  aria-label={`Cancella filtro ${selectedTag}`}
                >
                  <X size={14} aria-hidden="true" />
                  Cancella filtro
                </button>
              </Tooltip>
            ) : null}
            <div className="result-view-toggle" aria-label="Modalita di visualizzazione">
              <Tooltip content="Mostra le ricette in un elenco ordinato e diretto.">
                <button type="button" className={viewMode === "simple" ? "is-selected" : ""} onClick={() => setViewMode("simple")}>
                  Elenco semplice
                </button>
              </Tooltip>
              <Tooltip content="Organizza le ricette in gruppi per tag per esplorare un tema.">
                <button type="button" className={viewMode === "grouped" ? "is-selected" : ""} onClick={() => setViewMode("grouped")}>
                  Raggruppa per tag
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {isInitialResult && viewMode === "simple" ? (
          children
        ) : viewMode === "grouped" ? (
          groupedRecipes.length ? (
            <TagBucketGrid
              buckets={groupedRecipes}
              selectedTag={selectedTag}
              onSelect={handleTagGroupSelect}
            />
          ) : (
            <div className="empty-state">
              <Search size={28} aria-hidden="true" />
              <h3>Nessuna ricetta trovata</h3>
              <p>Prova un ingrediente, una tecnica o un tag diverso.</p>
            </div>
          )
        ) : (
          <RecipeGrid recipes={visibleRecipes} />
        )}
      </section>
    </>
  );
}