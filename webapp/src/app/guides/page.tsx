import Link from "next/link";
import { GuideBrowser } from "@/components/guide-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Tooltip } from "@/components/tooltip";
import { getAllGuides } from "@/lib/guides";

type GuidesPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function GuidesIntro() {
  return (
    <div className="landing-intro-copy">
      <p id="mi-chiamo-danio">
        Le guide tematiche sono il lato “perché” della cucina: qui trovi le logiche dietro tempi, temperature, macinature,
        emulsioni, cotture e lavorazioni. Più che una semplice lista di passaggi, sono un archivio di principi pratici da
        ricordare quando vuoi capire davvero come si comporta un ingrediente o una tecnica.
      </p>
      <p>
        Ogni tema usa le stesse logiche del ricettario: filtri, ricerca e approfondimenti per passare da una spiegazione
        generale a un caso concreto senza perdere il contesto. Il punto non è solo saper fare, ma capire quando e perché
        certe scelte funzionano davvero.
      </p>
      <p>
        In questa sezione trovi guide su tecniche e processi come mantecatura, cotture a temperatura controllata, collo,
        emulsioni, conservazione e accessori. Lo scopo è rendere la cucina meno casuale e più controllata, senza
        trasformare ogni passo in un formalismo inutile.
      </p>
      <div className="landing-intro-actions">
        <Tooltip content="Vai all’archivio per esplorare tutte le guide tematiche.">
          <Link className="landing-primary" href="/guides#esplora">
            Esplora le guide
          </Link>
        </Tooltip>
        <Tooltip content="Porta il cursore alla ricerca delle guide.">
          <Link className="landing-secondary" href="/guides#cerca">
            Cerca subito
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const guides = getAllGuides();
  const { q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Danio Cooks Guide Tematiche",
        url: "https://danio-cooks.netlify.app/guides",
        description:
          "Guide tematiche di cucina: tecniche, logiche di cottura, emulsioni, conservazione e approfondimenti pratici.",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://danio-cooks.netlify.app/guides?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "CollectionPage",
        name: "Guide tematiche Danio Cooks",
        description:
          "Guide tematiche di cucina: tecniche, logiche di cottura, emulsioni, conservazione e approfondimenti pratici.",
        url: "https://danio-cooks.netlify.app/guides",
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
      <SiteHeader />
      <main className="page-shell">
        <GuideBrowser guides={guides} initialQuery={initialQuery} intro={<GuidesIntro />} />
      </main>
      <SiteFooter />
    </>
  );
}
