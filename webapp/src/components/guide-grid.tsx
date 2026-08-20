import { ArrowUpRight, BookOpenText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { GuideSummary } from "@/lib/guides";
import { Tooltip } from "@/components/tooltip";

type GuideGridProps = {
  guides: GuideSummary[];
};

export function GuideGrid({ guides }: GuideGridProps) {
  if (!guides.length) {
    return (
      <div className="empty-state">
        <BookOpenText size={28} aria-hidden="true" />
        <h3>Nessuna guida trovata</h3>
        <p>Prova un tema, un ingrediente o un tag diverso.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {guides.map((guide) => (
        <article className="recipe-card" key={guide.slug}>
          <Tooltip content={`Apri la guida “${guide.title}” per leggere la spiegazione completa.`}>
            <Link className="recipe-image" href={`/guides/${guide.slug}`} aria-label={`Apri ${guide.title}`}>
              {guide.thumbnail ? (
                <Image
                  src={guide.thumbnail}
                  alt={guide.title}
                  fill
                  sizes="(min-width: 960px) 24vw, (min-width: 800px) 50vw, 100vw"
                />
              ) : null}
            </Link>
          </Tooltip>
          <div className="recipe-card-content">
            <div className="card-tags">
              {guide.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <h3>{guide.title}</h3>
            <p>{guide.excerpt}</p>
            <div className="recipe-card-footer">
              <span>{guide.difficulty ? `Difficoltà: ${guide.difficulty}` : "Guida tematica"}</span>
              <Tooltip content={`Apri la guida “${guide.title}”.`}>
                <Link href={`/guides/${guide.slug}`} aria-label={`Apri ${guide.title}`}>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </Tooltip>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
