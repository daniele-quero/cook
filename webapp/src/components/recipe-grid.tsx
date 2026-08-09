import { ArrowUpRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { RecipeSummary } from "@/lib/recipes";
import { formatDuration } from "@/lib/durations";

type RecipeGridProps = {
  recipes: RecipeSummary[];
};

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (!recipes.length) {
    return (
      <div className="empty-state">
        <Clock3 size={28} aria-hidden="true" />
        <h3>Nessuna ricetta trovata</h3>
        <p>Prova un ingrediente, una tecnica o un tag diverso.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <article className="recipe-card" key={recipe.slug}>
          <Link className="recipe-image" href={`/recipes/${recipe.slug}`} aria-label={`Apri ${recipe.title}`}>
            {recipe.thumbnail ? (
              <Image
                src={recipe.thumbnail}
                alt={recipe.title}
                fill
                sizes="(min-width: 960px) 24vw, (min-width: 800px) 50vw, 100vw"
              />
            ) : null}
          </Link>
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
  );
}