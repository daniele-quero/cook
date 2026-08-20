import { ArrowLeft, Clock3, Flame, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { SiteHeader } from "@/components/site-header";
import { ChatPanel } from "@/components/chat-panel";
import { IngredientTableView } from "@/components/ingredient-table";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { SousVideEggCalculator } from "@/components/sous-vide-egg-calculator";
import { TableJumpButton } from "@/components/table-jump-button";
import { Tooltip } from "@/components/tooltip";
import { formatDuration } from "@/lib/durations";
import { splitRecipeContent, type IngredientTableScaleConfig } from "@/lib/ingredient-tables";
import { getAllRecipes, getRecipe } from "@/lib/recipes";

type RecipePageProps = {
  params: Promise<{ slug: string }>;
};

const PIADINE_INGREDIENT_SCALE = {
  kind: "yield",
  yieldLabel: "piadine",
  baseYield: 6,
  baseMainQuantity: 140,
  baseMainUnit: "g",
} satisfies IngredientTableScaleConfig;

export function generateStaticParams() {
  return getAllRecipes().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = getRecipe(slug);

  if (!recipe) {
    return {};
  }

  const title = recipe.title;
  const description = recipe.description ?? recipe.excerpt;
  const url = `/recipes/${recipe.slug}`;
  const image = recipe.thumbnail ? [recipe.thumbnail] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      locale: "it_IT",
      title,
      description,
      url,
      images: image,
    },
    twitter: {
      card: recipe.thumbnail ? "summary_large_image" : "summary",
      title,
      description,
      images: image,
    },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    notFound();
  }

  const duration = formatDuration(recipe.cookTime) ?? formatDuration(recipe.prepTime);
  const contentParts = splitRecipeContent(recipe.content);
  const ingredientScaleConfig = recipe.slug === "piadine-senza-glutine-water-roux"
    ? PIADINE_INGREDIENT_SCALE
    : undefined;

  return (
    <>
      <SiteHeader />
      <main className="recipe-page">
        <Tooltip content="Torna all’elenco delle ricette per scegliere un altro piatto.">
          <Link className="back-link" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            Tutte le ricette
          </Link>
        </Tooltip>
        <section className="recipe-hero">
          <div className="recipe-hero-image" style={{ backgroundImage: recipe.thumbnail ? `url(${recipe.thumbnail})` : undefined }} />
          <div className="recipe-hero-content">
            <div className="card-tags">
              {recipe.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <h1>{recipe.title}</h1>
            <p>{recipe.excerpt}</p>
            <dl className="quick-stats">
              {duration && <div><dt><Clock3 size={16} aria-hidden="true" /> Tempo</dt><dd>{duration}</dd></div>}
              {recipe.difficulty && <div><dt><Flame size={16} aria-hidden="true" /> Difficoltà</dt><dd>{recipe.difficulty}</dd></div>}
              <div><dt><ShieldCheck size={16} aria-hidden="true" /> Sicurezza</dt><dd>Indicazioni incluse</dd></div>
            </dl>
          </div>
        </section>
        <ChatPanel key={recipe.slug} recipeSlug={recipe.slug} recipeTitle={recipe.title} />
        <TableJumpButton key={`table-jump-${recipe.slug}`} />
        <article className="markdown-content">
          {contentParts.map((part, index) => {
            if (part.type === "ingredient-table") {
              return (
                <IngredientTableView
                  key={`ingredients-${index}`}
                  table={part.table}
                  scaleConfig={ingredientScaleConfig}
                />
              );
            }

            if (part.type === "recalc-table") {
              return <SousVideEggCalculator key={`recalc-${index}`} table={part.table} />;
            }

            return (
              <MarkdownRenderer
                key={`markdown-${index}`}
                content={part.content}
                variant="recipe"
              />
            );
          })}
        </article>
      </main>
    </>
  );
}