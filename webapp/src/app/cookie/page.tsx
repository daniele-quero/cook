import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookie | Danio Cooks",
  description: "Informativa cookie di Danio Cooks.",
};

export default function CookiePage() {
  return (
    <LegalPage eyebrow="Informazioni legali" title="Cookie e memoria locale" updatedAt="4 agosto 2026">
      <p>Danio Cooks non utilizza attualmente cookie di profilazione, analytics o pubblicita. Per questo non viene mostrato un banner di consenso cookie.</p>
      <h2>Memoria locale della chat</h2>
      <p>Quando usi l&apos;assistente ricetta, il sito salva nel <em>localStorage</em> del browser i messaggi e le risposte per la ricetta aperta. La chiave tecnica usa il formato <code>danio-cooks-chat:[slug-ricetta]</code>.</p>
      <p>Questi dati restano sul tuo dispositivo finche non cancelli i dati del sito dal browser. Non sono cookie e non vengono usati per tracciarti tra siti o servizi diversi.</p>
      <h2>Cache della PWA</h2>
      <p>La PWA puo usare una cache tecnica del browser per rendere disponibili pagine e risorse gia visitate anche con connettivita limitata. La cache contiene risorse pubbliche del sito, non i messaggi della chat.</p>
      <h2>Come eliminare i dati locali</h2>
      <p>Puoi eliminare cronologia della chat e cache aprendo le impostazioni del browser, cercando i dati del sito per <strong>danio-cooks.netlify.app</strong> e selezionando la cancellazione di dati del sito, archiviazione locale o cache. La procedura varia in base a browser e dispositivo.</p>
      <h2>Futuri cookie</h2>
      <p>Prima di introdurre pubblicita, analytics o altri strumenti non tecnici, questa pagina sara aggiornata e verra richiesto il consenso quando necessario.</p>
    </LegalPage>
  );
}