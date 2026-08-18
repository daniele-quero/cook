# Danio Cooks Web App

Web app Next.js per esplorare le ricette Markdown nella directory `recipes/`.

## Navigazione e landing page

La home del sito e' una landing page editoriale con presentazione personale, ricerca e filtri. Il catalogo completo delle ricette e' disponibile in `/ricettario`, dove si mantiene la ricerca, i tag e la griglia delle ricette come esperienza dedicata al browsing.

## Chat AI contestuale

Ogni pagina di dettaglio ricetta include un assistente AI accessibile dal pulsante chat. La chat riceve il Markdown della ricetta visualizzata come contesto: risponde in italiano a domande su ingredienti, tecnica e sicurezza, senza attribuire alla ricetta informazioni che non contiene.

Il browser invia slug, messaggio e cronologia a `POST /api/chat`. L'endpoint legge la ricetta dal filesystem, costruisce il prompt lato server e inoltra la richiesta in streaming a `${AI_GATEWAY_URL}/chat`; `AI_GATEWAY_TOKEN` non viene mai inviato al client. Le risposte assistant sono mostrate progressivamente tramite Server-Sent Events e renderizzate come Markdown nella modale, quindi grassetto, liste, link, blockquote e tabelle non restano piu' come testo letterale.

Per contenere il contesto e l'input, l'endpoint accetta messaggi fino a 4.000 caratteri e include al massimo 18.000 caratteri del Markdown della ricetta dopo aver escluso il frontmatter YAML e la nota editoriale immediatamente sotto il titolo. Il prompt server-side chiede inoltre di restare intorno a 1.600 caratteri per risposta; se il tema non entra bene in una sola risposta, il modello deve dare prima una risposta completa e autosufficiente e poi chiudere con una domanda del tipo `Vuoi che continui con <argomento successivo>?`.

Se l'invio di un messaggio fallisce, la stessa bolla utente resta visibile con stato fallito e con un pulsante di retry accanto, senza creare duplicati dello stesso fallimento. Se il retry riesce, la bolla torna nello stato normale e la risposta arriva come per un invio riuscito al primo tentativo.

Alla chiusura della chat, il browser invia a `POST /api/complete` solo i messaggi non ancora sintetizzati per ricetta. Se la richiesta fallisce, il client effettua fino a 3 retry aggiuntivi a distanza di 15 secondi e interrompe il ciclo al primo successo.

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

Non inserire segreti in `.env.example`, nel repository o in variabili `NEXT_PUBLIC_*`.

## PWA e offline

In produzione il service worker registra una cache iniziale per home, manifest e icone. Le pagine ricetta vengono memorizzate solo dopo una visita riuscita e sono usate come fallback quando la rete non e disponibile. Ogni deploy aggiorna il service worker e invalida le vecchie cache.

## Verifica

```bash
npm run lint
npm run build
```
