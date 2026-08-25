import { ArrowUpRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { GuideSummary } from "@/lib/guides";
import type { RecipeSummary } from "@/lib/recipes";
import { formatDuration } from "@/lib/durations";
import { Tooltip } from "@/components/tooltip";

export type RecentCardEntry =
  | { kind: "recipe"; visitedAt: number; recipe: RecipeSummary }
  | { kind: "guide"; visitedAt: number; guide: GuideSummary };

type RecentGridProps = {
  entries: RecentCardEntry[];
};

export function RecentGrid({ entries }: RecentGridProps) {
  if (!entries.length) {
    return (
      <div className="empty-state">
        <Clock3 size={28} aria-hidden="true" />
        <h3>Nessun elemento recente</h3>
        <p>Apri una ricetta o una guida per iniziare a costruire il tuo elenco personale.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {entries.map((entry) => {
        const item = entry.kind === "recipe" ? entry.recipe : entry.guide;
        const href = entry.kind === "recipe" ? `/recipes/${item.slug}` : `/guides/${item.slug}`;
        const kindLabel = entry.kind === "recipe" ? "ricetta" : "guida";
        const footerLabel =
          entry.kind === "recipe"
            ? formatDuration(entry.recipe.cookTime) ?? formatDuration(entry.recipe.prepTime) ?? "Tecnica"
            : entry.guide.difficulty
              ? `Difficoltà: ${entry.guide.difficulty}`
              : "Guida tematica";

        return (
          <article className="recipe-card" key={`${entry.kind}-${item.slug}`}>
            <Tooltip content={`Apri la ${kindLabel} “${item.title}” visitata di recente.`}>
              <Link className="recipe-image" href={href} aria-label={`Apri ${item.title}`}>
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="(min-width: 960px) 24vw, (min-width: 800px) 50vw, 100vw"
                  />
                ) : null}
              </Link>
            </Tooltip>
            <div className="recipe-card-content">
              <div className="card-tags">
                <span className="recent-kind-tag">{entry.kind === "recipe" ? "Ricetta" : "Guida"}</span>
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <div className="recipe-card-footer">
                <span>{footerLabel}</span>
                <Tooltip content={`Apri la ${kindLabel} “${item.title}”.`}>
                  <Link href={href} aria-label={`Apri ${item.title}`}>
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </Link>
                </Tooltip>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
