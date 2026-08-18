import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

const faqSections = [
  {
    title: "Come nascono le ricette",
    items: [
      {
        question: "Da dove arrivano le ricette di Danio Cooks?",
        answer:
          "Le ricette nascono da un problema concreto: un gusto, una tecnica, un ingrediente da valorizzare, un errore da correggere o una situazione pratica da risolvere. In molti casi parte da un’esperienza reale in cucina: un pollo troppo asciutto, una base troppo dolce, un contorno senza croccantezza, un metodo che richiede troppi passaggi. Poi vengono finite, testate e raccontate in modo utile: ingredienti, proporzioni, tempi, temperatura e passaggi chiave.",
      },
      {
        question: "Le ricette sono sempre testate prima di essere pubblicate?",
        answer:
          "In generale sì: il sito cerca di pubblicare ricette con una logica verificabile e con dettagli che aiutano a riprodurle. Non tutte le varianti sono state replicate 20 volte in laboratorio, ma la scelta dei tempi, delle temperature e delle proporzioni è comunque guidata da osservazioni pratiche e da un confronto tra diversi risultati. Se un passaggio o un ingrediente cambia il risultato in modo decisivo, viene scritto in modo esplicito.",
      },
      {
        question: "Le ricette cambiano nel tempo?",
        answer:
          "Sì, possono cambiare. Una ricetta può essere aggiornata perché una tecnica si è rivelata migliore, un ingrediente è stato sostituito con una versione più affidabile o la spiegazione è diventata più chiara. La revisione è utile quando serve rendere la ricetta più coerente con il risultato pratico, non per cambiare il contenuto senza motivo.",
      },
      {
        question: "Perché alcune ricette sono molto tecniche?",
        answer:
          "Perché il sito combina cucina e metodo. Quando la tecnica influisce sul risultato, non si può limitarsi a dare una lista di ingredienti: serve sapere perché si cuoce a 72 °C, come si asciuga una superficie, come si gestisce un fondo, come si controlla la temperatura del cibo. Questo è il punto di forza del ricettario: informazioni pratiche, non solo ingredienti.",
      },
      {
        question: "Cosa significa che una ricetta è “ripetibile”?",
        answer:
          "Significa che, con lo stesso strumento e le stesse condizioni, il passaggio chiave è abbastanza chiaro da farsi capire anche a distanza. Non vuol dire che sia identica in ogni cucina: forno, padella, forno ventilato, spessori diversi o ingredienti con resa diversa possono cambiare i tempi. La ripetibilità è un obiettivo, non una promessa di identità perfetta.",
      },
    ],
  },
  {
    title: "Come usare ricette e guide",
    items: [
      {
        question: "Questa app è solo un ricettario o anche un archivio di guide?",
        answer:
          "È entrambe le cose. Le ricette sono il “cosa fare e come farlo” in una situazione concreta, mentre le guide aiutano a capire la tecnica o il principio generale: temperatura, taglio, riduzione, equilibrio, cotture e ingredienti. Se una ricetta ha bisogno di contesto, la guida offre quel contesto.",
      },
      {
        question: "Devo leggere sempre la guida prima di una ricetta?",
        answer:
          "No. La guida è utile quando serve un chiarimento, una spiegazione o un confronto tra tecniche. In una ricetta, invece, il punto chiave è il metodo: ingredienti, tempi, passaggi e controllo del risultato. Se la ricetta è semplice e la tecnica è familiare, puoi partire direttamente da essa.",
      },
      {
        question: "Come faccio a scegliere tra ricette simili?",
        answer:
          "Guardando la tecnica, i tempi, gli strumenti e gli ingredienti principali. Se una ricetta è più lunga ma più precisa, magari è la scelta giusta per un piatto complesso; se vuoi qualcosa di rapido, puoi filtrare per tag, ingredienti o metodo. Il ricettario è costruito per confrontare i casi reali, non solo per sfogliare immagini.",
      },
      {
        question: "Qual è la differenza tra ingrediente, tag e categoria?",
        answer:
          "L’ingrediente è il materiale del piatto; il tag è un’etichetta che aiuta a trovare ricette per tecnica, vocazione o uso; la categoria è un macro-raggruppamento. Ad esempio, un piatto può contenere l’ingrediente “uova”, ma il tag potrebbe essere “sous-vide”, “pranzo”, “veloce”, “contorno” o “riso”, a seconda del criterio di ricerca.",
      },
      {
        question: "Le guide vengono usate come fonti di riferimento oppure come letture secondarie?",
        answer:
          "Entrambe. Sono un punto di riferimento per capire un principio o comparare method. In cucina, però, la ricetta ha sempre la precedenza se vuoi preparare un piatto in modo pratico. Le guide rispondono a domande del tipo “come funziona questo passaggio?” o “perché è importante la temperatura?”",
      },
    ],
  },
  {
    title: "Chat AI e assistenza",
    items: [
      {
        question: "Cos’è la chat AI di Danio Cooks?",
        answer:
          "È un assistente di supporto legato alla ricetta o alla guida che stai leggendo. Può aiutare a chiarire ingredienti, passaggi, tempi, sostituzioni o interpretare un dubbio specifico; non è un contenuto separato dal ricettario, ma un aiuto contestuale. La risposta viene generata tenendo conto del titolo della ricetta e del contesto di lettura che hai aperto.",
      },
      {
        question: "La chat sostituisce la ricetta?",
        answer:
          "No. La chat non sostituisce il testo della ricetta: serve a chiarire, integrare e aiutare a valutare un passaggio. Se la ricetta ha già tutte le informazioni che ti servono, la chat va usata in modo mirato, non come alternativa al metodo scritto.",
      },
      {
        question: "I messaggi della chat sono salvati?",
        answer:
          "Nella maggior parte dei casi, i messaggi si salvano localmente nel browser per la ricetta o la guida aperta, per mantenerne la cronologia nel tempo. La loro durata è limitata e, se la navigazione o la cronologia vengono pulite, la chat può essere eliminata. L’obiettivo è avere un contesto utile senza creare un profilo permanente dell’utente.",
      },
      {
        question: "Posso dare dati personali alla chat?",
        answer:
          "Meglio evitare. Non inserire dati sanitari, informazioni bancarie, password, indirizzi di domicilio o contenuti personali riservati. La chat è pensata per domande sulla ricetta o sul metodo, non per trattare informazioni sensibili. Se hai dubbi sul contenuto di un ingrediente o di un allergene, affidati a fonti specifiche e al buon senso.",
      },
      {
        question: "Cosa significa il consenso alla chat?",
        answer:
          "Significa che, prima di usare la chat, hai confermato che i messaggi e il contesto della ricetta possono essere inviati al servizio AI per ottenere una risposta. Questo è un requisito di trasparenza. Se non vuoi che i messaggi siano usati per migliorare il servizio, puoi gestire le impostazioni della chat o consultare la privacy del sito.",
      },
      {
        question: "Che relazione c’è tra la chat e la condivisione dei dati?",
        answer:
          "La condivisione è una scelta separata dal consenso alla chat. Può essere attivata per condividere estratti anonimi di sessioni e domande per migliorare le ricette e i contenuti, aiutando a individuare dubbi ricorrenti. Puoi disattivarla dall’interfaccia della chat, e la scelta ha effetto sulle prossime sessioni.",
      },
    ],
  },
  {
    title: "Privacy, dati locali e sicurezza",
    items: [
      {
        question: "Danio Cooks usa cookie?",
        answer:
          "Non usa cookie di profilazione o analytics pubblicitari. La memoria locale del browser viene usata per scopi funzionali: salvare la cronologia della chat e, in alcuni casi, lo stato del sito. In pratica, non esiste un monitoraggio invasivo fra sito e sito: i dati usati sono quelli strettamente necessari al funzionamento del servizio.",
      },
      {
        question: "Dove sono salvati i messaggi della chat?",
        answer:
          "Nel localStorage del browser, per la ricetta o la guida aperta. Questi dati rimangono sul tuo dispositivo e possono essere eliminati dalle impostazioni del browser o dal reset dei dati del sito. Non sono un database centrale del sito.",
      },
      {
        question: "Cosa succede ai dati della chat dopo 10 giorni?",
        answer:
          "Se non vengono usati, la cronologia locale può essere considerata scaduta e quindi rigettata. L’obiettivo è evitare accumuli inutili e mantenere il comportamento trasparente senza creare una memoria permanente dei messaggi del browser. Se vuoi conservarli meno a lungo, puoi cancellare i dati del sito in qualsiasi momento.",
      },
      {
        question: "I messaggi della chat vengono condivisi con terzi?",
        answer:
          "Il flusso è sempre orientato a un servizio AI o a un gateway configurato dal sito per la risposta. In relazione a sessioni e feedback, possono essere condivisi estratti anonimi di domande e risposte per migliorare il ricettario, ma non vengono usati come profilo personale. La condivisione di questi estratti è controllata e può essere disattivata.",
      },
      {
        question: "Che differenza c’è tra la cronologia locale e la condivisione dei segnali?",
        answer:
          "La cronologia locale è un archivio personale del browser. La condivisione è un processo di analisi minima sui contenuti di una sessione per capire se ci sono domande ricorrenti o problemi di chiarezza. I segnali condivisi sono estratti, sintetizzati e controllati di nuovo per evitare dato personale o testo identificabile. Non si tratta di una copia completa della cronologia.",
      },
    ],
  },
  {
    title: "Ricerca, tag e filtri",
    items: [
      {
        question: "Come funziona la ricerca?",
        answer:
          "La ricerca cerca tra ingredienti, tecniche, parole chiave e tag. Puoi cercare una frase breve precisa come “uova” o “microonde”, oppure un criterio più ampio come “contorno”, “sottovuoto”, “dolce” o “pranzo”. È pensata per aiutarci a trovare un risultato concreto senza scorrere tutto il ricettario a mano.",
      },
      {
        question: "Che differenza c’è tra cercare e filtrare per tag?",
        answer:
          "La ricerca è un campo libero; i filtri per tag sono selezioni semantiche. In pratica, la ricerca ti aiuta a trovare “quello che pensi” o “cosa ti viene in mente”, mentre i tag aiutano a chiudere il campo e a portare insieme ricette simili: tecniche, ingredienti, occasioni d’uso, consistenze, cotture, piatti di stagione o ingredienti principali.",
      },
      {
        question: "Posso usare più tag insieme?",
        answer:
          "Il comportamento del sito punta a un filtro semplice e leggibile: selezioni un tag o un insieme di risultati, e poi derivano i risultati. In alcune scelte visive, la selezione di un tag può anche spostare la vista in modalità semplice o raggruppata per evitare di rallentare la lettura. L’idea è mantenere l’interfaccia chiara, non sovraccaricare il ricettario.",
      },
      {
        question: "Che significa “Raggruppa per tag”?",
        answer:
          "È una vista che organizza le ricette in gruppi tematici. In questo modo puoi trovare subito tutte le ricette collegate a una certa tecnica o categoria, senza perdere il contesto. È utilissimo quando ti serve un confronto rapido: ad esempio tutte le ricette con tag “uova” o “verdure”, oppure tutte quelle con una tecnica simile.",
      },
      {
        question: "Perché ci sono bottoni di filtro?",
        answer:
          "Per ridurre la fatica di ricerca. In molte pagine, i pulsanti di filtro aiutano a isolare rapidamente le ricette che hanno le proprietà che ti servono: un ingrediente, una tecnica, una categoria, una stagione o un risultato. Sono strumenti di navigazione, non una sostituzione del criterio di lettura.",
      },
      {
        question: "Cosa succede se la ricerca non trova nulla?",
        answer:
          "Il sito mostra un messaggio di nessun risultato e suggerisce di provare un ingrediente, una tecnica o un tag diverso. È un comportamento normale: un risultato vuoto non significa un problema, ma un’indicazione chiara che la ricerca è troppo stretta o troppo specifica. La soluzione più rapida è cambiare una parola chiave o annullare il filtro.",
      },
    ],
  },
  {
    title: "Navigazione desktop e mobile",
    items: [
      {
        question: "Il menu desktop e quello mobile sono uguali?",
        answer:
          "Hanno lo stesso obiettivo ma layout diversi. Sul desktop trovi una navigazione a sinistra con Home, Ricettario, Guide, Cerca e i link di supporto. Sul mobile trovi un menu a tendina e un nav inferiore semplice con le voci principali. In entrambi i casi, il percorso di base resta costante per aiutare a orientarsi in modo rapido.",
      },
      {
        question: "Perché il pulsante Cerca è sempre visibile?",
        answer:
          "Per evitare di perdere il contesto mentre si sfoglia il sito. La ricerca è uno strumento veloce e pratico, soprattutto quando vuoi passare da un’idea all’altra senza ricaricare la pagina o perdere il posto su cui stavi facendo attenzione.",
      },
      {
        question: "Posso passare direttamente da una ricetta alla sua tabella?",
        answer:
          "Sì: dove presente, il bottoncino “Vai alla tabella” permette di scorrere rapidamente verso la sezione con la tabella di ingredienti o il contenuto tabellare della ricetta. È utile quando la ricetta è lunga e vuoi saltare direttamente ai dati pratici senza scorrere il metodo.",
      },
      {
        question: "Cosa significa “visualizzazione semplice” e “raggruppata”?",
        answer:
          "La visualizzazione semplice mostra l’elenco delle ricette come lista di risultati. La visualizzazione raggruppata le ordina in blocchi per tag, con un approccio più esplorativo e più facile da confrontare. La scelta dipende da come vuoi navigare: trovare una singola ricetta oppure osservare un set di ricette simili.",
      },
    ],
  },
  {
    title: "Condivisione e supporto",
    items: [
      {
        question: "Perché il sito chiede di condividere sessioni o segnali di chat?",
        answer:
          "Per migliorare il ricettario e capire quali domande ricorrenti non sono ancora ben coperte. Se un dubbio spinge più persone a chiedere la stessa cosa, il contenuto può essere migliorato. La condivisione è opzionale e gestita in modo esplicito, con un controllo sempre visibile in chat o nell’interfaccia.",
      },
      {
        question: "Chi può contattare per supporto?",
        answer:
          "Tramite il canale di supporto attivo del sito, indicando la ricetta, la pagina e la problematica. È utile descrivere il browser e il dispositivo usati, perché molte volte un problema è legato a un layout o a un comportamento specifico del dispositivo. Non serve includere dati personali non necessari.",
      },
      {
        question: "Il sito è mobile-friendly?",
        answer:
          "Sì, la navigazione e le pagine sono progettate per essere usate anche su mobile. Il menu, la ricerca e le principali interazioni sono pensati per adattarsi a schermi piccoli senza perdere chiarezza di lettura o accessibilità funzionale.",
      },
      {
        question: "Il sito è adatto anche a chi cerca tecniche avanzate?",
        answer:
          "Sì, ma senza perdere leggibilità. Le ricette possono essere tecniche, ma la struttura del contenuto cerca di mantenere una lettura semplice: ingredienti, cottura, passaggi e osservazioni. Abbiamo voluto un approccio pratico e tecnico, ma accessibile, per chi vuole migliorare davvero la propria cucina senza dover diventare un esperto di laboratorio.",
      },
    ],
  },
];

export const metadata: Metadata = {
  title: "FAQ | Danio Cooks",
  description: "Domande frequenti su ricette, chat AI, privacy e navigazione di Danio Cooks.",
};

export default function FaqPage() {
  return (
    <LegalPage eyebrow="Supporto" title="FAQ" updatedAt="18 agosto 2026">
      <p>
        Qui trovi risposte rapide e pratiche su come funziona Danio Cooks: come nascono le ricette, come leggere un
        metodo, come usate la chat, i tag, la ricerca e i controlli di privacy. Se hai un dubbio su una pagina specifica,
        la risposta più utile è spesso nella funzione che stai usando in quel momento.
      </p>

      <h2>Indice rapido</h2>
      <ul>
        {faqSections.map((section) => (
          <li key={section.title}>
            <a href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{section.title}</a>
          </li>
        ))}
      </ul>

      {faqSections.map((section) => (
        <section key={section.title}>
          <h2 id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>{section.title}</h2>
          {section.items.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      ))}
    </LegalPage>
  );
}
