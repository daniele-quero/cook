import type { MetadataRoute } from "next";
import { getAllRecipes } from "@/lib/recipes";

const siteUrl = "https://danio-cooks.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getAllRecipes();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...recipes.map((recipe) => ({
      url: `${siteUrl}/recipes/${recipe.slug}`,
      lastModified: recipe.date ? new Date(recipe.date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/cookie`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/termini`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/supporto`,
      lastModified: new Date("2026-08-04"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}