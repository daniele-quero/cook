import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

const instructionsSections = [
  { title: "Navigazione principale", slug: "navigazione-principale" },
  { title: "Tooltip dei controlli interattivi", slug: "tooltip-dei-controlli-interattivi" },
  { title: "Ricettario e ricerca", slug: "ricettario-e-ricerca" },
  { title: "Tag, filtri e vista raggruppata", slug: "tag-filtri-e-vista-raggruppata" },
  { title: "Come leggere una ricetta", slug: "come-leggere-una-ricetta" },
  { title: "Rescale delle tabelle ingredienti", slug: "rescale-tabelle-ingredienti" },
  { title: "Guide e approfondimenti", slug: "guide-e-approfondimenti" },
  { title: "Chat AI e consenso", slug: "chat-ai-e-consenso" },
  { title: "Salvare manualmente la sessione chat", slug: "salvare-manualmente-la-sessione-chat" },
  { title: "Pulsanti utili e trigger", slug: "pulsanti-utili-e-trigger" },
  { title: "Privacy, condivisione dati e supporto", slug: "privacy-condivisione-dati-e-supporto" },
];

export const metadata: Metadata = {
  title: "Istruzioni | Danio Cooks",
  description: "Manuale pratico per usare il ricettario, la ricerca, i tag e la chat AI di Danio Cooks.",
};

export default function IstruzioniPage() {
  return (
    <LegalPage eyebrow="Supporto" title="Istruzioni" updatedAt="21 agosto 2026">
      <p>
        Questa pagina raccoglie il manuale pratico di Danio Cooks: come muoversi tra le pagine, usare il ricettario,
        leggere le ricette, sfruttare la ricerca e i tag, interagire con la chat AI e gestire i dati personali in modo
        consapevole. Il sito è pensato per essere chiaro sul metodo, non solo sulla lista di ingredienti.
      </p>

      <h2>Indice rapido</h2>
      <ul>
        {instructionsSections.map((section) => (
          <li key={section.slug}>
            <a href={`#${section.slug}`}>{section.title}</a>
          </li>
        ))}
      </ul>

      <h2 id="navigazione-principale">Navigazione principale</h2>
      <p>
        In desktop, la navigazione principale è una barra laterale. Trovi il brand di Danio Cooks, i collegamenti a
        Home, Ricettario e Guide, il pulsante di ricerca e i link ai contenuti di supporto e metodologia. Il punto chiave
        è che il sito punta a mantenere il contesto della cucina, non a far perdere il lettore in una navigazione frammentata.
      </p>
      <p>
        In mobile, la navigazione è più compatta: il menu a tendina riunisce le stesse voci principali e i link di supporto,
        mentre il nav inferiore mantiene accessibili le aree più importanti (Home, Ricettario, Guide, Cerca). Questi due
        layout servono allo stesso scopo: permetterti di passare rapidamente da una ricetta a un confronto, da una guida a
        una ricerca o da un supporto a una risorsa utile.
      </p>
      <p>
        Il migliore modo di usare la navigazione è sempre quello di partire da una domanda concreta: “cosa cucino oggi?”,
        “ho ingredienti simili?”, “voglio capire una tecnica” o “voglio leggere una guida”. La pagina giusta cambia in base
        al problema, non al percorso che si preferisce usare.
      </p>

      <h2 id="tooltip-dei-controlli-interattivi">Tooltip dei controlli interattivi</h2>
      <p>
        Ogni tasto, link o altro controllo azionabile mostra un tooltip esplicativo. Su desktop compare dopo circa 1,5
        secondi quando passi il mouse sul controllo o lo raggiungi con il focus da tastiera; su mobile compare dopo circa
        1,5 secondi di pressione prolungata sullo stesso controllo.
      </p>
      <p>
        Il tooltip serve a chiarire l&apos;azione senza sostituire l&apos;etichetta accessibile del controllo e senza impedire il
        click o il tap. Può aiutarti a riconoscere, per esempio, il menu e il comando per chiudere, i collegamenti Home,
        Ricettario e Guide, la ricerca, le tab, la chat e il pulsante di invio, oltre ai controlli per il salvataggio dei
        segnali, ai filtri e alle tabelle.
      </p>
      <p>
        Questa è una regola di progettazione costante: ogni nuovo controllo interattivo deve adottare lo stesso
        comportamento e avere una descrizione breve, comprensibile e coerente con l&apos;azione che esegue.
      </p>

      <h2 id="ricettario-e-ricerca">Ricettario e ricerca</h2>
      <p>
        Il ricettario è il centro dell’esperienza. È un archivio pratico, non solo un elenco di foto: la sua forza è la
        combinazione di tecnica, ingredienti e chiarezza. Nella parte superiore trovi il campo di ricerca. È abbastanza
        semplice da usare: inserisci un ingrediente, una tecnica, un termine come “uova”, “microonde”, “sottovuoto”,
        “contorno” o “pranzo”. La ricerca prende in considerazione parole chiave, ingredienti, tecniche e tag.
      </p>
      <p>
        Se la ricerca è troppo ampia, puoi restringere i risultati usando tag o un filtro di pagina. Il corretto uso è
        combinare il testo libero con il contesto semantico: ad esempio “uova” + “sous-vide”, oppure “verdure” +
        “microonde”. Se il risultato è incompleto, la soluzione più pratica è cambiare una parola chiave o annullare il
        filtro, invece di forzare una ricerca specifica e troppo stretta.
      </p>
      <p>
        Il numero di ricette visibili e il messaggio “Nessuna ricetta trovata” sono indicatori utili: non indicano un bug,
        ma un filtro o un termine troppo selettivo. Nella pratica, questa interfaccia è progettata per aiutare a fare
        un confronto rapido tra ricette simili, piuttosto che costringere a leggere tutto il ricettario.
      </p>

      <h2 id="tag-filtri-e-vista-raggruppata">Tag, filtri e vista raggruppata</h2>
      <p>
        I tag sono l’elemento più importante per orientarsi nel ricettario. In molti casi rappresentano una combinazione di
        tecnica, ingredienti principali o uso pratico del piatto. Ad esempio, un tag può definire un ingrediente, una
        famiglia di piatti, una cottura specifica o una categoria di ricetta.
      </p>
      <p>
        È possibile cambiare la visualizzazione tra “Elenco semplice” e “Raggruppa per tag”. Nella vista semplice trovi un
        elenco lineare di risultati. Nella vista raggruppata, le ricette sono separate per tema o tag, e puoi osservare
        rapidamente i gruppi più vicini al tuo bisogno. Questo è molto utile quando vuoi confrontare varianti di un insieme
        di ricette, ad esempio “uova”, “patate”, “verdure”, “salse” o “ricette veloci”.
      </p>
      <p>
        I pulsanti di filtro sono una scorciatoia: danno un accesso diretto ai gruppi più frequenti. Se vuoi evitare di
        perdere il contesto, usa prima la ricerca, poi il filtro, e infine la vista raggruppata. In altre parole: ricerca
        per parola, filtra per tema, confronta con la vista raggruppata.
      </p>

      <h2 id="come-leggere-una-ricetta">Come leggere una ricetta</h2>
      <p>
        In Danio Cooks una ricetta non è solo una lista di ingredienti. Prima ancora di cucinare, guarda l’idea generale:
        che tipo di risultato vuoi ottenere, quale tecnica usa, quali strumenti richiede, quale temperatura o fase è critica.
      </p>
      <p>
        Il metodo ha precedenza sulla semplice lista. Se la ricetta usa un metodo particolare, una temperatura precisa,
        un fondamento basilare o una tecnica di finitura, i passaggi sono più importanti della sola quantità di ingredienti.
        Se un passaggio è critico, di solito viene evidenziato per tecnica: è il punto in cui un risultato ottimo si
        distingue da un risultato mediocre.
      </p>
      <p>
        Quando adatti una ricetta, non cambiare solo la dose: valuta la tecnica, il volume, lo spessore e il tipo di pentola.
        Per esempio, un pollo più grande richiede tempi diversi, una padella più calda cambia il risultato e una base con
        più liquido non si comporta come una base asciutta. L’idea è capire il principio, non limitarsi a seguire un numero
        senza senso.
      </p>
      <p>
        Se stai cucinando per più persone, guarda sempre anche le proporzioni e il contesto di servizio. Le ricette del sito
        sono costruite per essere pratiche e ripetibili, ma ogni cucina e ogni ingrediente ha una propria variabilità. Il
        metodo ti aiuta a riconoscere quando bisogna adattare il tempo o la temperatura, invece di “seguire il testo” senza
        capire.
      </p>

      <h2 id="rescale-tabelle-ingredienti">Rescale delle tabelle ingredienti</h2>
      <p>
        Le tabelle ingredienti dosabili mostrano i controlli sotto l&apos;etichetta “Dosi proporzionate”. Il pulsante
        dell&apos;ingrediente principale permette di inserire una nuova quantità: le quantità numeriche scalabili della
        stessa tabella vengono moltiplicate in proporzione, mentre valori descrittivi, temperature e tempi restano invariati.
        Ogni tabella ha il proprio calcolo, quindi modificare una tabella non cambia le altre.
      </p>
      <p>
        Nella ricetta delle piadine senza glutine puoi scegliere anche il numero di piadine da ottenere. Il riferimento è
        sempre 140 g di farina per 6 piadine; inserendo un numero maggiore o minore di piadine vengono scalate le quantità
        numeriche sia nelle tabelle verticali sia in quelle orizzontali. Il controllo per la quantità di farina resta
        sincronizzato con quello per il numero di piadine. Sono accettati solo valori maggiori di zero e il messaggio
        indica come correggere un dato non valido.
      </p>
      <p>
        I profili di cottura delle uova sous-vide sono un caso diverso: la tabella dedicata non scala gli ingredienti, ma
        viene ricalcolata dal calcolatore “Profili di cottura ricalcolati”. Inserisci peso dell&apos;uovo e temperatura
        iniziale; il tempo viene stimato per il profilo selezionato solo nei limiti dichiarati. Fuori dai limiti vengono
        mostrati i tempi standard e un avviso; i profili 6-7 restano esclusi per i soggetti a rischio, indipendentemente
        dai parametri inseriti.
      </p>

      <h2 id="guide-e-approfondimenti">Guide e approfondimenti</h2>
      <p>
        Le guide non sono secondarie alla ricetta: sono il contesto. Servono a spiegare la tecnica, il principio, la
        differenza tra cotture e i dettagli che non sempre ritrovi in una singola ricetta. Se vuoi capire perché una
        temperatura è importante, perché un ingrediente richiede una riduzione, oppure che funzione ha il sale nella
        consistenza finale, la guida è il posto giusto.
      </p>
      <p>
        Un buon modo di usarle è: cerca la ricetta giusta, poi apri la guida se il metodo o la tecnica ti servono come
        supporto. Non è necessario leggere tutta la teoria prima di cucinare: basta leggere il punto che ti fa comodo. Il
        ricettario è progettato per essere pratico e diretto, mentre le guide sono utili per costruire la competenza.
      </p>

      <h2 id="chat-ai-e-consenso">Chat AI e consenso</h2>
      <p>
        La chat AI si apre in contesto: ti aiuta a chiarire passaggi, a verificare una sostituzione, a capire se la ricetta
        è adatta a un determinato strumento o un certo numero di porzioni. Non sostituisce la ricetta, ma la integra. È
        utile quando hai un dubbio specifico e vuoi una risposta contestuale invece di sfogliare tutto l’archivio.
      </p>
      <p>
        Prima di usarla, il sito chiede un consenso esplicito. Questo è importante per trasparenza: vuoi capire che il
        contenuto della domanda e del contesto della ricetta può essere inviato al servizio AI per generare la risposta.
        Se non vuoi usare il servizio in quel momento, puoi interompere il flusso e tornare alla lettura.
      </p>
      <p>
        La cronologia della chat viene salvata localmente nel browser per la ricetta o la guida aperta, con un limite di
        durata. In pratica, questo serve a mantenere il contesto della conversazione senza creare un database permanente del
        tuo profilo. Per questo motivo è buona pratica non inserire dati personali, sanitari o sensibili nella chat.
      </p>
      <p>
        La chat è uno strumento di supporto, non un sostituto della responsabilità nella cucina. Se hai dubbi su allergeni,
        temperatura di sicurezza o condizioni personali, verifica con una fonte specializzata e con buon senso.
      </p>

      <h2 id="salvare-manualmente-la-sessione-chat">Salvare manualmente la sessione chat</h2>
      <p>
        Nella chat puoi trovare il pulsante con l&apos;icona Database, chiamato “Salva sessione”. È disponibile solo dopo il
        consenso alla chat e quando la condivisione delle sessioni è attiva. Se disattivi la condivisione dall&apos;intestazione
        della chat, il pulsante non viene mostrato.
      </p>
      <p>
        Il pulsante invia manualmente gli ultimi 40 messaggi della conversazione. Al termine mostra quanti segnali sono
        stati realmente salvati per l&apos;analisi. Il numero può essere 0: accade quando non ci sono segnali da salvare e la
        sessione viene ignorata intenzionalmente, senza che questo indichi un problema.
      </p>
      <p>
        Se il salvataggio incontra un errore reale, la chat lo segnala e puoi premere di nuovo il pulsante per riprovare.
        Anche se scegli di non usare il pulsante manuale, il salvataggio automatico della sessione alla chiusura della chat
        resta disponibile quando la condivisione è attiva.
      </p>

      <h2 id="pulsanti-utili-e-trigger">Pulsanti utili e trigger</h2>
      <p>
        In alcune ricette trovi trigger e pulsanti di navigazione utili. Il più evidente è il pulsante “Vai alla tabella”,
        che ti permette di scorrere rapidamente alla sezione tabellare della ricetta, dove spesso trovi ingredienti,
        quantità, tempi o misure. È una funzionalità pensata per ridurre la fatica di scorrere il metodo quando vuoi
        verificare subito una quantità o un dettaglio di misura.
      </p>
      <p>
        Altri trigger aiutano a far partire la chat, a filtrare i risultati, a cancellare il filtro applicato o a passare
        tra la vista semplice e quella raggruppata per tag. In pratica, i trigger non aggiungono complessità: servono a
        fare un lavoro concreto in modo più veloce. Se trovi un bottone che non è immediatamente chiaro, conviene chiedersi
        “cosa mi serve adesso?”; spesso la risposta è proprio nel nome del trigger.
      </p>

      <h2 id="privacy-condivisione-dati-e-supporto">Privacy, condivisione dati e supporto</h2>
      <p>
        Danio Cooks non usa profilazione invasiva o pubblicità basata su dati personali. I dati tecnici necessari al
        funzionamento del sito e la cronologia locale della chat sono gestiti in modo limitato. La condivisione dei dati
        avviene solo in casi espliciti, con l’obiettivo di migliorare la qualità del contenuto e individuare domande
        ricorrenti. Non è un tracking continuo di navigazione e non è pensata per creare un profilo commerciale.
      </p>
      <p>
        Se attivi la condivisione della sessione, stai decidendo di condividere estratti anonimi di domande e risposte per
        migliorare le ricette future. Puoi disattivarla in qualsiasi momento dall’interfaccia della chat. La scelta è
        importante perché riguarda il trattamento dei segnali di feedback e la qualità del servizio, ma è sempre seguita da
        un controllo chiaro e un’esperienza utente trasparente.
      </p>
      <p>
        Per supporto o segnalazioni, puoi usare il canale del sito e specificare la pagina o la ricetta interessata, il
        browser, il dispositivo e una breve descrizione del problema. Questo aiuta a risolvere il caso con più precisione,
        senza dover creare un database di informazioni personali non necessarie.
      </p>
    </LegalPage>
  );
}
