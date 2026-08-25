# Danio Cooks Web App

Web app Next.js per esplorare le ricette Markdown nella directory `recipes/` e le guide tematiche nella directory `guides/`.

## Navigazione e landing page

La home del sito e' una landing page editoriale con presentazione personale, ricerca e filtri. Il catalogo completo delle ricette e' disponibile in `/ricettario`, dove si mantiene la ricerca, i tag e la griglia delle ricette come esperienza dedicata al browsing. La pagina `/guides` replica la stessa struttura del ricettario ma usa i file Markdown della cartella `guides/` e include navigazione, ricerca, filtri e chat ai contestuale.

## Cronologia locale (sezione "Recenti")

La sezione "Recenti" (ancorata a `/#recenti` sulla home, raggiungibile dal menu di navigazione desktop, dal menu hamburger mobile e da un'icona orologio nella bottom bar mobile) mostra le ultime ricette e guide aperte su quel dispositivo, dalla più recente, fino a un massimo di 10 elementi.

La cronologia e' interamente client-side: ogni pagina di dettaglio ricetta o guida registra la visita in `localStorage` (chiave `danio-cooks:recent-items`) al montaggio, senza alcuna chiamata server. Se una ricetta o guida gia' presente viene riaperta, la voce precedente viene rimossa e reinserita in cima, cosi' da evitare duplicati e riportare sempre l'elemento più recente in testa. La sezione risolve gli slug salvati con l'elenco completo di ricette e guide letto lato server; le voci che non corrispondono più a un contenuto esistente (es. rinominato o rimosso) vengono scartate silenziosamente, e dati non validi o corrotti in `localStorage` vengono ignorati senza errori. Finche' la lettura di `localStorage` non e' completata (o se la cronologia e' vuota), la sezione mostra rispettivamente uno stato di caricamento o uno stato vuoto che invita ad aprire una ricetta o una guida.

## Chat AI contestuale

Ogni pagina di dettaglio ricetta o guida include un assistente AI accessibile dal pulsante chat. La chat riceve il Markdown del contenuto visualizzato come contesto: risponde in italiano a domande su ingredienti, tecnica e sicurezza, senza attribuire al contenuto informazioni che non contiene.

Il browser invia slug, `kind` (`recipe` o `guide`), messaggio e cronologia a `POST /api/chat`. L'endpoint risolve il contenuto corretto dal filesystem, costruisce il prompt lato server e inoltra la richiesta in streaming a `${AI_GATEWAY_URL}/chat`; `AI_GATEWAY_TOKEN` non viene mai inviato al client. Le risposte assistant sono mostrate progressivamente tramite Server-Sent Events e renderizzate come Markdown nella modale, quindi grassetto, liste, link, blockquote e tabelle non restano piu' come testo letterale.

Per contenere il contesto e l'input, l'endpoint accetta messaggi fino a 4.000 caratteri e include al massimo 18.000 caratteri del Markdown della ricetta dopo aver escluso il frontmatter YAML e la nota editoriale immediatamente sotto il titolo. Il prompt server-side chiede inoltre di restare intorno a 1.600 caratteri per risposta; se il tema non entra bene in una sola risposta, il modello deve dare prima una risposta completa e autosufficiente e poi chiudere con una domanda del tipo `Vuoi che continui con <argomento successivo>?`.

Se l'invio di un messaggio fallisce, la stessa bolla utente resta visibile con stato fallito e con un pulsante di retry accanto, senza creare duplicati dello stesso fallimento. Se il retry riesce, la bolla torna nello stato normale e la risposta arriva come per un invio riuscito al primo tentativo.

Alla chiusura della chat, il browser invia a `POST /api/complete` solo i messaggi non ancora sintetizzati per ricetta. L'endpoint accetta al massimo 40 messaggi per sessione (role `user` o `assistant`, contenuto fino a 4.000 caratteri ciascuno); per sessioni più lunghe il client seleziona gli ultimi 40 messaggi prima dell'invio. La risposta include `trace_persistence`, con `status` uguale a `persisted` (trace scritto su GitHub), `skipped` (scrittura intenzionalmente non necessaria) o `failed` (scrittura non riuscita). Gli skip intenzionali per rischio PII, assenza di segnali persistibili (inclusi i soli `not_a_gap`) o GitHub non configurato sono risposte `200`. Un valore `failed` restituisce invece `502`, con `trace_persistence` nel corpo: una risposta `200` indica quindi soltanto `persisted` o `skipped`, mai un trace non scritto.

Quando la condivisione è attiva, accanto al pulsante di invio compare anche un pulsante **Salva sessione** (icona database) che permette di inviare manualmente i messaggi correnti a `POST /api/complete` senza attendere la chiusura della chat. Il pulsante è disabilitato se non ci sono messaggi oppure se è già in corso un invio; dopo un invio riuscito aggiorna il puntatore interno per evitare duplicati alla successiva chiusura automatica e mostra il numero di segnali effettivamente persistiti. Per uno skip intenzionale mostra `0`; un errore di scrittura su GitHub resta esplicito e retriable dal pulsante, senza essere trattato come un salvataggio riuscito.

## Chat-traces editoriali

Quando la condivisione e' attiva, `POST /api/complete` analizza l'estratto di sessione e puo scrivere un file JSON in [recipes/chat-traces/](recipes/chat-traces/). I file persistiti usano `schema_version: "2"` e contengono:

- `recipe_slug`: slug della ricetta a cui appartiene la sessione.
- `date_bucket`: data UTC (`YYYY-MM-DD`) usata anche per la cartella di output.
- `has_pii_risk`: flag prudenziale; se `true`, i segnali non vengono scritti su GitHub.
- `redaction_notes`: breve nota sulle omissioni fatte per privacy, oppure `null`.
- `signals`: massimo 5 topic editoriali estratti dalla chat.

Ogni elemento di `signals` contiene:

- `topic_key`: chiave stabile in kebab-case.
- `gap_type`: `missing_info`, `ambiguous_info`, `conflicting_info` oppure `not_a_gap`.
- `answer_source`: indica se la risposta alla domanda era gia' nella ricetta (`recipe`), richiedeva conoscenza generale (`general_knowledge`) oppure restava insufficiente (`insufficient`).
- `topic_summary`: parafrasi breve e non identificativa del topic.
- `confidence`: numero tra `0` e `1` che rappresenta quanto il modello ritiene affidabile il signal. Valori alti significano che il topic e il suo inquadramento sono ben supportati dal trascritto e dal Markdown della ricetta; valori piu bassi indicano maggiore ambiguita', contesto incompleto o inferenza piu debole.
- `recipe_scope`: dice quanto il signal e' utile alla ricetta corrente o a nuove ricette:
  - `current_recipe` quando il topic e' direttamente utile a migliorare la ricetta in corso o a rispondere a domande sul suo comportamento;
  - `new_recipe` quando la stessa idea o tecnica puo' essere riutilizzata in una ricetta diversa, in una variante futura o in una preparazione di nuova generazione.
- `origin`: oggetto che dice da dove emerge il topic:
  - `source: "user"` se il topic nasce soprattutto dai messaggi utente;
  - `source: "assistant"` se emerge soprattutto dalle risposte del modello;
  - `model`: `null` per `source="user"`; per `source="assistant"` contiene, quando disponibile, l'identificatore di modello esposto da `/api/chat` (o il suo alias di richiesta), altrimenti `null`.

I `signals` con `gap_type: "not_a_gap"` restano nella risposta HTTP per debug/trasparenza, ma non vengono persistiti su GitHub.

### Revisione agentica dei chat-traces

Un agente dedicato del team Cook (`Cook-signals-reviewer`, invocabile con il prompt `/review-chat-signals`) legge periodicamente i chat-traces non ancora processati, li valuta con i sub-agenti culinari pertinenti (chef, chimico, biosicurezza, fisico) e decide se usarli per modificare una ricetta esistente o crearne una nuova ispirata ad essa. Questa funzionalità e' distinta dal ciclo ACE del repository: i chat-traces sono segnali sul contenuto delle ricette, non trace di comportamento agentico.

- La scoperta dei file non processati e l'archiviazione sono deterministiche, tramite gli script `webapp/scripts/chat-signals/list-unprocessed.mjs` e `webapp/scripts/chat-signals/archive-trace.mjs`.
- Ogni segnale puo' essere scartato (confidence troppo bassa, topic non azionabile, ipotesi non corroborata, o rischio di alterare contenuti di sicurezza senza fonte solida) invece di essere usato automaticamente.
- Ogni esecuzione produce un log JSON in `webapp/recipes/chat-traces/reviews/` con i segnali usati/scartati e il motivo.
- I trace gia' valutati vengono spostati in `webapp/recipes/chat-traces/processed/<date_bucket>/`, preservando la struttura per data.
- Le modifiche che toccano la sezione "Sicurezza Alimentare" richiedono sempre conferma umana esplicita prima di essere applicate.

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) per provare l'app.

Per usare la chat AI, configura queste variabili nell'ambiente che avvia Next.js:

```bash
AI_GATEWAY_URL=https://gateway.example
AI_GATEWAY_TOKEN=token-del-gateway
```

`AI_GATEWAY_URL` e' l'URL base del gateway: l'app aggiunge automaticamente `/chat`. Le variabili non sono necessarie per esplorare le ricette, ma senza entrambe l'endpoint chat restituisce `503`. Non usare il prefisso `NEXT_PUBLIC_` e non salvare token reali nel repository.

Per rendere persistenti i chat-traces, configura inoltre solo lato server `GITHUB_CONTENT_PAT` e `GITHUB_CONTENT_REPO` (per esempio `owner/repository`). Un errore di scrittura emette nei log della Function Netlify un evento `api.complete.trace_persistence_failure` con stato e classificazione dell'errore, senza messaggi della chat, PII o segreti.

## Deploy su Netlify

La configurazione e in `../netlify.toml`. La base directory `webapp/` contiene sia l'applicazione sia il corpus `recipes/`, quindi Netlify include automaticamente le ricette nel bundle server-side.

1. Collega il repository a Netlify con **Import an existing project**.
2. Netlify rileva automaticamente la configurazione:
   - Base directory: `webapp`
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs`
   - Node.js: `24`
3. Per abilitare la chat AI, configura in **Project configuration > Environment variables**:
   - `AI_GATEWAY_URL`
   - `AI_GATEWAY_TOKEN`
   - `GITHUB_CONTENT_PAT` e `GITHUB_CONTENT_REPO` se vuoi persistere i chat-traces

Non inserire segreti in `.env.example`, nel repository o in variabili `NEXT_PUBLIC_*`.

## PWA e offline

In produzione il service worker registra una cache iniziale per home, manifest e icone. Le pagine ricetta vengono memorizzate solo dopo una visita riuscita e sono usate come fallback quando la rete non e disponibile. Ogni deploy aggiorna il service worker e invalida le vecchie cache.

## Tabelle ingredienti e rescaling

Le tabelle ingredienti riconosciute come dosabili offrono un rescale locale per quantità dell'ingrediente principale: le quantità numeriche supportate vengono proporzionate nella singola tabella, senza modificare tempi, temperature o testo descrittivo. La pagina della ricetta passa esplicitamente la configurazione dei casi speciali, così le altre ricette mantengono il comportamento generale.

La ricetta `piadine-senza-glutine-water-roux` espone inoltre il controllo del numero di piadine. La base è 140 g di farina = 6 piadine; il controllo per il numero di piadine e quello per la quantità principale aggiornano lo stesso fattore, indipendentemente per ogni tabella verticale o orizzontale. Gli input accettano solo valori maggiori di zero (il numero di piadine deve essere intero).

## Verifica

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```
