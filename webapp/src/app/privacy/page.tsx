import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy | Danio Cooks",
  description: "Informativa privacy di Danio Cooks.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Informazioni legali" title="Informativa privacy" updatedAt="4 agosto 2026">
      <p className="legal-notice"><strong>Da completare prima della pubblicazione commerciale:</strong> inserire nome e cognome o ragione sociale e indirizzo del titolare del trattamento.</p>
      <h2>Titolare e contatti</h2>
      <p>Il titolare del trattamento dei dati personali relativi a Danio Cooks e <strong>[nome e cognome o ragione sociale da inserire]</strong>. Per richieste su privacy, dati personali o assistenza puoi scrivere a <a href="mailto:danio.cooks.info@gmail.com">danio.cooks.info@gmail.com</a>.</p>
      <h2>Dati trattati e finalita</h2>
      <p>Danio Cooks permette di consultare ricette senza creare un account. Il sito non integra attualmente pubblicita, analytics, profilazione o strumenti di session replay.</p>
      <ul>
        <li><strong>Dati tecnici di navigazione:</strong> il provider di hosting puo trattare dati tecnici necessari a erogare e proteggere il servizio, come indirizzo IP, richieste e log di sicurezza.</li>
        <li><strong>Cronologia della chat:</strong> messaggi e risposte vengono salvati localmente nel browser, separati per ricetta. Restano sul dispositivo fino a quando cancelli i dati del sito o la cronologia del browser.</li>
        <li><strong>Messaggi alla chat:</strong> quando invii una domanda, trasmettiamo al servizio AI il messaggio, fino a otto messaggi recenti della conversazione e il contenuto della ricetta aperta, per generare la risposta.</li>
      </ul>
      <h2>Base giuridica</h2>
      <p>Il trattamento dei dati tecnici necessari al funzionamento e alla sicurezza del sito si basa sul legittimo interesse del titolare. Prima di usare la chat, ti chiediamo una conferma esplicita dell&apos;inoltro dei contenuti al gateway AI. Non usare la chat per comunicare dati personali, sanitari o altre informazioni riservate.</p>
      <h2>Destinatari e conservazione</h2>
      <p>Il sito e ospitato su Netlify. Le richieste alla chat sono inoltrate a un gateway AI configurato dal titolare. In base alla configurazione dichiarata dal titolare, il gateway non conserva le richieste per finalita proprie; questa informazione deve essere riesaminata se il fornitore o la sua configurazione cambiano.</p>
      <p>Danio Cooks non conserva una cronologia chat nel proprio database. La cronologia locale resta sul tuo dispositivo finche non la elimini. I tempi di conservazione dei log tecnici dipendono dalle impostazioni e dai contratti dei fornitori e devono essere verificati dal titolare.</p>
      <h2>I tuoi diritti</h2>
      <p>Nei casi previsti dalla normativa puoi chiedere accesso, rettifica, cancellazione, limitazione, opposizione e portabilita dei dati, scrivendo a <a href="mailto:danio.cooks.info@gmail.com">danio.cooks.info@gmail.com</a>. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali.</p>
      <h2>Modifiche</h2>
      <p>Questa informativa puo essere aggiornata quando cambiano funzionalita, fornitori o trattamenti. La data di aggiornamento e indicata all&apos;inizio della pagina.</p>
    </LegalPage>
  );
}