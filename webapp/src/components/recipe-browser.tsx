import type { ReactNode } from "react";
import type { RecipeSummary } from "@/lib/recipes";
import { RecipeBrowserClient } from "@/components/recipe-browser-client";
import { RecipeGrid } from "@/components/recipe-grid";
import { getVisibleRecipes } from "@/components/recipe-search";

type RecipeBrowserProps = {
  recipes: RecipeSummary[];
  initialQuery: string;
  intro?: ReactNode;
  recent?: ReactNode;
};

export function RecipeBrowser({ recipes, initialQuery, intro, recent }: RecipeBrowserProps) {
  const initialRecipes = getVisibleRecipes(recipes, initialQuery, null);

  return (
    <RecipeBrowserClient key={initialQuery} recipes={recipes} initialQuery={initialQuery} intro={intro} recent={recent}>
      <RecipeGrid recipes={initialRecipes} />
    </RecipeBrowserClient>
  );
}