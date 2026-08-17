import Link from "next/link";
import { RecipeBrowser } from "@/components/recipe-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getAllRecipes } from "@/lib/recipes";

type HomeProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function LandingIntro() {
  return (
    <div className="landing-intro-copy">
      <p id="mi-chiamo-danio">
        Mi chiamo Danio. Ho un background scientifico e, quando qualcosa mi appassiona, mi ci butto fino in fondo.
        È successo anche con la cucina: ho iniziato quando mia moglie aveva la nausea durante la gravidanza, e da
        allora non ho più smesso di cucinare, studiare, testare e migliorare.
      </p>
      <p>
        Ho passato anni a sperimentare tecniche, temperature e ingredienti per capire davvero come funzionano le cose in
        cucina. Ora mi aiuto con l&apos;intelligenza artificiale per trasformare le idee più o meno pazze in ricette
        concrete, ma anche per portare un rigore scientifico a quello che già conosco e per migliorare ogni dettaglio.
      </p>
      <p>
        Ho creato questa web app per avere tutto a portata di mano, come un archivio personale di strumenti, ricette,
        tempi, tecniche e osservazioni. L&apos;ho resa utile anche per chi ama entrare nel dettaglio: chi vuole capire
        davvero una ricetta, verificare una tecnica, confrontare ingredienti, usare un calcolatore o chiedere un
        chiarimento all&apos;AI senza perdere tempo.
      </p>
      <p>
        Qui trovi ricette, dati, strumenti pratici e domande rapide per approfondire e migliorare. Se vuoi, le
        conversazioni con l&apos;AI possono anche diventare un ottimo materiale per correggere una ricetta o inventarne
        una nuova.
      </p>
      <div className="landing-intro-actions">
        <Link className="landing-primary" href="/#esplora">
          Vai al ricettario
        </Link>
        <Link className="landing-secondary" href="/#esplora">
          Cerca subito
        </Link>
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const recipes = getAllRecipes();
  const { q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <RecipeBrowser recipes={recipes} initialQuery={initialQuery} intro={<LandingIntro />} />
      </main>
      <SiteFooter />
    </>
  );
}