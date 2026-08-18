import { ArrowLeft, Clock3, Flame, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { ChatPanel } from "@/components/chat-panel";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { SiteHeader } from "@/components/site-header";
import { formatDuration } from "@/lib/durations";
import { getAllGuides, getGuide } from "@/lib/guides";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllGuides().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return {};
  }

  const title = guide.title;
  const description = guide.description ?? guide.excerpt;
  const url = `/guides/${guide.slug}`;
  const image = guide.thumbnail ? [guide.thumbnail] : undefined;

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
      card: guide.thumbnail ? "summary_large_image" : "summary",
      title,
      description,
      images: image,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const duration = formatDuration(guide.totalTime) ?? formatDuration(guide.cookTime) ?? formatDuration(guide.prepTime);

  return (
    <>
      <SiteHeader />
      <main className="recipe-page">
        <Link className="back-link" href="/guides">
          <ArrowLeft size={18} aria-hidden="true" />
          Tutte le guide
        </Link>
        <section className="recipe-hero">
          <div className="recipe-hero-image" style={{ backgroundImage: guide.thumbnail ? `url(${guide.thumbnail})` : undefined }} />
          <div className="recipe-hero-content">
            <div className="card-tags">
              {guide.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <h1>{guide.title}</h1>
            <p>{guide.excerpt}</p>
            <dl className="quick-stats">
              {duration && <div><dt><Clock3 size={16} aria-hidden="true" /> Tempo</dt><dd>{duration}</dd></div>}
              {guide.difficulty && <div><dt><Flame size={16} aria-hidden="true" /> Difficoltà</dt><dd>{guide.difficulty}</dd></div>}
              {guide.mainIngredient && <div><dt><ShieldCheck size={16} aria-hidden="true" /> Ingrediente</dt><dd>{guide.mainIngredient}</dd></div>}
            </dl>
          </div>
        </section>
        <ChatPanel key={guide.slug} recipeSlug={guide.slug} recipeTitle={guide.title} kind="guide" />
        <article className="markdown-content">
          <MarkdownRenderer content={guide.content} variant="recipe" />
        </article>
      </main>
    </>
  );
}
