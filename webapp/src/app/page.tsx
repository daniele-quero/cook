import { Suspense } from "react";
import { RecipeBrowser } from "@/components/recipe-browser";
import { SiteHeader } from "@/components/site-header";
import { getAllRecipes } from "@/lib/recipes";

export default function Home() {
  const recipes = getAllRecipes();

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <Suspense fallback={null}>
          <RecipeBrowser recipes={recipes} />
        </Suspense>
      </main>
    </>
  );
}