import { ArrowLeft, Clock3, Flame, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/site-header";
import { ChatPanel } from "@/components/chat-panel";
import { formatDuration } from "@/lib/durations";
import { getAllRecipes, getRecipe } from "@/lib/recipes";
import { recipeImage } from "@/lib/recipe-visuals";

type RecipePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllRecipes().map(({ slug }) => ({ slug }));
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = getRecipe(slug);
  if (!recipe) {
    notFound();
  }

  const duration = formatDuration(recipe.cookTime) ?? formatDuration(recipe.prepTime);

  return (
    <>
      <SiteHeader />
      <main className="recipe-page">
        <Link className="back-link" href="/">
          <ArrowLeft size={18} aria-hidden="true" />
          Tutte le ricette
        </Link>
        <section className="recipe-hero">
          <div className="recipe-hero-image" style={{ backgroundImage: `url(${recipeImage(recipe.slug)})` }} />
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
        <ChatPanel recipeSlug={recipe.slug} recipeTitle={recipe.title} />
        <article className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2>{children}</h2>,
              h2: ({ children }) => (
                <h2 className={String(children).includes("Sicurezza Alimentare") ? "safety-heading" : undefined}>
                  {children}
                </h2>
              ),
              table: ({ children }) => (
                <div className="table-scroll" tabIndex={0}>
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {recipe.content}
          </ReactMarkdown>
        </article>
      </main>
    </>
  );
}