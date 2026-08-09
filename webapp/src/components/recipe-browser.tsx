"use client";

import Fuse from "fuse.js";
import { ArrowUpRight, Clock3, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import type { RecipeSummary } from "@/lib/recipes";
import { formatDuration } from "@/lib/durations";

type RecipeBrowserProps = {
  recipes: RecipeSummary[];
};

export function RecipeBrowser({ recipes }: RecipeBrowserProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  return <RecipeBrowserContent key={urlQuery} recipes={recipes} initialQuery={urlQuery} />;
}

type RecipeBrowserContentProps = RecipeBrowserProps & {
  initialQuery: string;
};

function RecipeBrowserContent({ recipes, initialQuery }: RecipeBrowserContentProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const tags = useMemo(
    () => [...new Set(recipes.flatMap((recipe) => recipe.tags))].sort((first, second) => first.localeCompare(second, "it")),
    [recipes],
  );
  const search = useMemo(
    () => new Fuse(recipes, { keys: ["title", "tags", "excerpt"], threshold: 0.35, ignoreLocation: true }),
    [recipes],
  );
  const searchedRecipes = deferredQuery.trim()
    ? search.search(deferredQuery).map((result) => result.item)
    : recipes;
  const visibleRecipes = selectedTag
    ? searchedRecipes.filter((recipe) => recipe.tags.includes(selectedTag))
    : searchedRecipes;

  return (
    <>
      <section className="search-intro" id="cerca" aria-labelledby="recipe-heading">
        <p className="eyebrow">Il tuo ricettario</p>
        <h1 id="recipe-heading">Cosa cucini oggi?</h1>
        <p>Ricette tecniche, tempi chiari e passaggi da seguire senza fretta.</p>
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

      <section id="esplora" aria-live="polite" aria-labelledby="recipe-list-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Archivio</p>
            <h2 id="recipe-list-heading">Ricette da esplorare</h2>
          </div>
          <span>{visibleRecipes.length} ricette</span>
        </div>
        {visibleRecipes.length ? (
          <div className="recipe-grid">
            {visibleRecipes.map((recipe) => (
              <article className="recipe-card" key={recipe.slug}>
                <Link
                  className="recipe-image"
                  href={`/recipes/${recipe.slug}`}
                  aria-label={`Apri ${recipe.title}`}
                  style={{ backgroundImage: recipe.thumbnail ? `url(${recipe.thumbnail})` : undefined }}
                />
                <div className="recipe-card-content">
                  <div className="card-tags">
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <h3>{recipe.title}</h3>
                  <p>{recipe.excerpt}</p>
                  <div className="recipe-card-footer">
                    <span>{formatDuration(recipe.cookTime) ?? formatDuration(recipe.prepTime) ?? "Tecnica"}</span>
                    <Link href={`/recipes/${recipe.slug}`} aria-label={`Apri ${recipe.title}`}>
                      <ArrowUpRight size={19} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Clock3 size={28} aria-hidden="true" />
            <h3>Nessuna ricetta trovata</h3>
            <p>Prova un ingrediente, una tecnica o un tag diverso.</p>
          </div>
        )}
      </section>
    </>
  );
}