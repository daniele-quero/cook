import type { RecipeSummary } from "@/lib/recipes";
import { RecipeBrowserClient } from "@/components/recipe-browser-client";
import { RecipeGrid } from "@/components/recipe-grid";
import { getVisibleRecipes } from "@/components/recipe-search";

type RecipeBrowserProps = {
  recipes: RecipeSummary[];
  initialQuery: string;
};

export function RecipeBrowser({ recipes, initialQuery }: RecipeBrowserProps) {
  const initialRecipes = getVisibleRecipes(recipes, initialQuery, null);

  return (
    <RecipeBrowserClient key={initialQuery} recipes={recipes} initialQuery={initialQuery}>
      <RecipeGrid recipes={initialRecipes} />
    </RecipeBrowserClient>
  );
}