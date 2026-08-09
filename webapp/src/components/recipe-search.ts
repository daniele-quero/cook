import Fuse from "fuse.js";
import type { RecipeSummary } from "@/lib/recipes";

export function createRecipeSearch(recipes: RecipeSummary[]) {
  return new Fuse(recipes, {
    keys: ["title", "tags", "excerpt"],
    threshold: 0.35,
    ignoreLocation: true,
  });
}

export function getVisibleRecipes(
  recipes: RecipeSummary[],
  query: string,
  selectedTag: string | null,
  search = createRecipeSearch(recipes),
) {
  const normalizedQuery = query.trim();
  const searchedRecipes = normalizedQuery
    ? search.search(normalizedQuery).map((result) => result.item)
    : recipes;

  return selectedTag
    ? searchedRecipes.filter((recipe) => recipe.tags.includes(selectedTag))
    : searchedRecipes;
}