import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}): Promise<Metadata> {
  const { view } = await searchParams;

  if (view === "faq") {
    return {
      title: "FAQ | Danio Cooks",
      description: "Domande frequenti su Danio Cooks.",
    };
  }

  if (view === "istruzioni") {
    return {
      title: "Istruzioni | Danio Cooks",
      description: "Istruzioni e guide di Danio Cooks.",
    };
  }

  return {
    title: "Supporto | Danio Cooks",
    description: "Supporto e contatti di Danio Cooks.",
  };
}

type SupportPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const { view } = await searchParams;

  if (view === "faq") {
    return (
      <LegalPage eyebrow="Danio Cooks" title="FAQ" updatedAt="4 agosto 2026">
        <p>Pagina in costruzione. Torna presto per trovare risposte rapide alle domande più frequenti.</p>
      </LegalPage>
    );
  }

  if (view === "istruzioni") {
    return (
      <LegalPage eyebrow="Danio Cooks" title="Istruzioni" updatedAt="4 agosto 2026">
        <p>Pagina in costruzione. Qui saranno raccolte le istruzioni principali per usare il sito e i suoi strumenti.</p>
      </LegalPage>
    );
  }
  return (
    <LegalPage eyebrow="Danio Cooks" title="Supporto" updatedAt="4 agosto 2026">
      <h2>Contatti</h2>
      <p>Per assistenza, segnalazioni su una ricetta o richieste relative ai dati personali, scrivi a <a href="mailto:danio.cooks.info@gmail.com">danio.cooks.info@gmail.com</a>.</p>
      <h2>Chat e dati locali</h2>
      <p>La cronologia dell&apos;assistente viene salvata localmente nel browser per ogni ricetta. Per eliminarla, cancella i dati del sito dalle impostazioni del browser. Consulta la pagina <a href="/cookie">Cookie e memoria locale</a> per i dettagli.</p>
      <h2>Segnalare un problema</h2>
      <p>Quando scrivi, indica la pagina o la ricetta interessata, il browser e il dispositivo usati, oltre a una breve descrizione del problema. Non includere password, dati di pagamento o informazioni personali non necessarie.</p>

      <h2 id="chi-siamo">Chi sono / Metodologia</h2>
      <p>Mi chiamo Danio. Ho un background scientifico e, quando qualcosa mi appassiona, mi ci butto fino in fondo. È successo anche con la cucina: ho iniziato quando mia moglie aveva la nausea durante la gravidanza, e da allora non ho più smesso di cucinare, studiare, testare e migliorare.</p>
      <p>La cucina non è stata per me soltanto un bisogno pratico, ma un modo per capire come funzionano davvero gli ingredienti, le temperature e i tempi. Ho passato anni a sperimentare tecniche e ricette per osservare cosa cambia tra un risultato buono e uno davvero buono: croccantezza, resa, succosità, consistenza, equilibrio di sale, acidità e dolcezza.</p>

      <h3>Come lavoro</h3>
      <ul>
        <li><strong>Idea:</strong> parto da un gusto, una tecnica, una sensazione o un problema concreto: un pollo troppo asciutto, una pasta troppo soda, un contorno che non si sviluppa bene.</li>
        <li><strong>Test:</strong> verifico tempi, cotture, ingredienti e dettagli tecnici, con più di una prova prima di giudicare una ricetta.</li>
        <li><strong>Misura:</strong> controllo le quantità, gli strumenti e le variabili: forno, padella, tegame, temperatura del cibo, tempi e finitura.</li>
        <li><strong>Correzione:</strong> se il risultato non convince, la ricetta cambia: più sale, meno tempo, più forno, meno fondo, un passaggio aggiornato o un ingrediente diverso.</li>
        <li><strong>Documentazione:</strong> scrivo istruzioni chiare, pratiche e verificabili, senza lasciare dubbi su passaggi, tempi e fine cottura.</li>
        <li><strong>Strumenti e AI:</strong> mi aiuto con strumenti e con l&apos;intelligenza artificiale per ordinare idee, accelerare la revisione e raffinare il testo, ma il giudizio finale resta sempre il mio.</li>
      </ul>

      <h3>I nostri criteri editoriali</h3>
      <ul>
        <li><strong>Niente copia/incolla:</strong> non pubblico ricette che sembrano solo un passaggio da un altro sito. Le idee vengono trasformate, testate e spesso ridisegnate in modo personale.</li>
        <li><strong>Dettagli pratici:</strong> ogni ricetta deve essere utile in cucina reale, non solo bella a leggere. Se un passaggio è importante, lo spiego in modo chiaro.</li>
        <li><strong>Ingredienti misurati:</strong> peso, quantità e proporzioni contano. Quando serve, li uso come riferimento per rendere la ricetta ripetibile.</li>
        <li><strong>Strumenti, temperatura e tempo:</strong> scrivo anche le variabili che cambiano il risultato: forno, padella, tegame, vasocottura, microonde, ventola, temperatura del cibo e durata precisa.</li>
        <li><strong>Trasparenza:</strong> se una ricetta è un compromesso, lo dico; se un passaggio dipende da uno strumento specifico, lo segnalo; se un risultato è soggetto a variazioni, lo spiego.</li>
        <li><strong>Risultati verificati:</strong> prima di pubblicare, una ricetta viene valutata sulla base del gusto, della consistenza e della ripetibilità, non solo del principio teorico.</li>
      </ul>

      <p>Ho creato Danio Cooks per avere un archivio personale di strumenti, ricette, tempi, tecniche e osservazioni. Un luogo dove poter tornare sempre con un&apos;idea chiara e un metodo coerente: sapere cosa stiamo facendo, perché lo stiamo facendo e come valutare il risultato. È una cucina fatta di precisione, curiosità e pazienza, ma senza mai perdere la gioia di cucinare.</p>
    </LegalPage>
  );
}