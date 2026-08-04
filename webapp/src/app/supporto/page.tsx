import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Supporto | Danio Cooks",
  description: "Supporto e contatti di Danio Cooks.",
};

export default function SupportPage() {
  return (
    <LegalPage eyebrow="Danio Cooks" title="Supporto" updatedAt="4 agosto 2026">
      <h2>Contatti</h2>
      <p>Per assistenza, segnalazioni su una ricetta o richieste relative ai dati personali, scrivi a <a href="mailto:danio.cooks.info@gmail.com">danio.cooks.info@gmail.com</a>.</p>
      <h2>Chat e dati locali</h2>
      <p>La cronologia dell&apos;assistente viene salvata localmente nel browser per ogni ricetta. Per eliminarla, cancella i dati del sito dalle impostazioni del browser. Consulta la pagina <a href="/cookie">Cookie e memoria locale</a> per i dettagli.</p>
      <h2>Segnalare un problema</h2>
      <p>Quando scrivi, indica la pagina o la ricetta interessata, il browser e il dispositivo usati, oltre a una breve descrizione del problema. Non includere password, dati di pagamento o informazioni personali non necessarie.</p>
    </LegalPage>
  );
}