import { RecipeBrowser } from "@/components/recipe-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAllRecipes } from "@/lib/recipes";

const siteUrl = "https://danio-cooks.netlify.app";

type HomeProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const recipes = getAllRecipes();
  const { q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Danio Cooks",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/#recipe-collection`,
        name: "Ricette da esplorare | Danio Cooks",
        description: "Ricette tecniche, tempi chiari e cucina ragionata.",
        url: siteUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: recipes.length,
          itemListElement: recipes.map((recipe, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: recipe.title,
            url: `${siteUrl}/recipes/${recipe.slug}`,
          })),
        },
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <RecipeBrowser recipes={recipes} initialQuery={initialQuery} />
      </main>
      <SiteFooter />
    </>
  );
}