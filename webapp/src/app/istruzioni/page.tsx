import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Istruzioni | Danio Cooks",
  description: "Istruzioni e riferimenti pratici di Danio Cooks.",
};

export default function IstruzioniPage() {
  return (
    <LegalPage eyebrow="Supporto" title="Istruzioni" updatedAt="17 agosto 2026">
      <p>
        Qui trovi gli orientamenti pratici di Danio Cooks: come usare il ricettario, come leggere tempi e temperature,
        come filtrare per tecnica e come usare i tool di supporto senza perdere il contesto della ricetta.
      </p>

      <h2>Come leggere una ricetta</h2>
      <p>
        In ogni scheda partiamo da ingredienti, tempi e tecnica. Prima di cucinare, guarda sempre il metodo: se una ricetta
        usa una temperatura precisa o una tecnica specifica, la sequenza di esecuzione è più importante della sola lista
        degli ingredienti.
      </p>

      <h2>Come usare la ricerca</h2>
      <p>
        Puoi cercare per ingrediente, tecnica, categoria o parola chiave. Se vuoi restringere la ricerca, combina la ricerca
        con i tag del ricettario: ad esempio <em>uova</em>, <em>microonde</em>, <em>sous-vide</em> o <em>contorno</em>.
      </p>

      <h2>Come valutare risultati e tempi</h2>
      <p>
        Le ricette sono progettate per essere pratiche, ma non sono “ricette da libretti”: ogni tecnica ha un contesto.
        Se devi adattare le quantità, cambia sempre le proporzioni e valuta anche tempi e spessori degli ingredienti.
      </p>

      <h2>Quando usare i tool del sito</h2>
      <p>
        I calcoli e i filtri sono strumenti di supporto. Sono utili per confrontare porzioni, capire le varianti di cottura
        oppure trovare subito una ricetta simile a quella che vuoi preparare.
      </p>
    </LegalPage>
  );
}
