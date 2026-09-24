"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
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
  recent?: ReactNode;
};

type ViewMode = "simple" | "grouped";

export function RecipeBrowserClient({ recipes, initialQuery, children, intro, recent }: RecipeBrowserClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const search = useMemo(() => createRecipeSearch(recipes), [recipes]);
  const visibleRecipes = useMemo(
    () => getVisibleRecipes(recipes, initialQuery, selectedTag, search),
    [initialQuery, recipes, search, selectedTag],
  );
  const isInitialResult = selectedTag === null;
  const groupedRecipes = useMemo(() => buildTagBuckets(visibleRecipes, selectedTag), [selectedTag, visibleRecipes]);
  const handleTagGroupSelect = (tag: string) => {
    setSelectedTag((currentTag) => (currentTag === tag ? null : tag));
    setViewMode("simple");
  };

  return (
    <>
      {intro ? <section className="landing-intro">{intro}</section> : null}

      {recent ? <>{recent}</> : null}

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