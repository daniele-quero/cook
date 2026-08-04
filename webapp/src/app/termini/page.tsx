import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Termini d'uso | Danio Cooks",
  description: "Termini d'uso di Danio Cooks.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Informazioni legali" title="Termini d&apos;uso" updatedAt="4 agosto 2026">
      <h2>Uso del servizio</h2>
      <p>Danio Cooks offre contenuti editoriali e strumenti di consultazione per ricette. Puoi usare il sito per finalita personali e non commerciali, nel rispetto della legge e di questi termini.</p>
      <h2>Contenuti e sicurezza alimentare</h2>
      <p>Tempi, temperature e indicazioni presenti nelle ricette sono contenuti informativi. Devi valutare ingredienti, attrezzature, allergie, condizioni di conservazione e caratteristiche delle persone che consumeranno il cibo. Per dubbi su sicurezza alimentare, allergeni o condizioni personali, consulta fonti autorevoli o un professionista competente.</p>
      <h2>Assistente ricetta</h2>
      <p>L&apos;assistente AI e una funzione di supporto e puo generare risposte inesatte o incomplete. Non sostituisce valutazioni professionali, mediche o nutrizionali. Verifica sempre le informazioni importanti e non inviare dati personali, sanitari o riservati nella chat.</p>
      <h2>Proprieta intellettuale</h2>
      <p>Testi, immagini, marchi e altri contenuti di Danio Cooks sono protetti dalle norme applicabili. Non e consentito riprodurli, distribuirli o sfruttarli commercialmente senza autorizzazione del titolare, salvo quanto consentito dalla legge.</p>
      <h2>Disponibilita e modifiche</h2>
      <p>Il servizio puo essere modificato, sospeso o aggiornato. Il titolare si impegna a mantenere contenuti accurati, ma non garantisce disponibilita continua o assenza di errori.</p>
      <h2>Contatti</h2>
      <p>Per segnalazioni o richieste relative al servizio scrivi a <a href="mailto:danio.cooks.info@gmail.com">danio.cooks.info@gmail.com</a>.</p>
    </LegalPage>
  );
}