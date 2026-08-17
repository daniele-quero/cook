# Danio Cooks

Danio Cooks e' un ricettario in italiano composto da documenti Markdown e da una webapp Next.js per esplorarli. Il repository contiene ricette, guide tecniche e SOP con metadati editoriali, tempi e indicazioni operative.

## 1. Overview e componenti

La struttura principale e':

- [webapp/recipes/](webapp/recipes/): sorgente dei contenuti, con ricette e guide in file `.md`.
- [webapp/](webapp/): applicazione Next.js che legge i Markdown e presenta landing page, ricettario e dettaglio.
- [webapp/src/lib/recipes.ts](webapp/src/lib/recipes.ts): filesystem, front matter e normalizzazione dei dati.
- [webapp/src/app/page.tsx](webapp/src/app/page.tsx): landing page editoriale con presentazione del sito e ricerca.
- [webapp/src/app/ricettario/page.tsx](webapp/src/app/ricettario/page.tsx): pagina dedicata all'elenco completo delle ricette.
- [webapp/src/components/recipe-browser.tsx](webapp/src/components/recipe-browser.tsx): browser client-side con ricerca e filtro tag.
- [webapp/src/app/recipes/[slug]/page.tsx](webapp/src/app/recipes/[slug]/page.tsx): pagina di dettaglio della ricetta.
- [webapp/src/components/chat-panel.tsx](webapp/src/components/chat-panel.tsx): pannello di chat contestuale per ogni ricetta.
- [webapp/src/app/api/chat/route.ts](webapp/src/app/api/chat/route.ts): endpoint server-side che inoltra le richieste all'AI Gateway.
- [webapp/public/](webapp/public/): asset statici e service worker.
- [netlify.toml](netlify.toml): configurazione del deploy Netlify.
- [AGENTS.md](AGENTS.md): convenzioni editoriali e istruzioni operative.

La webapp non usa un database o un'API per le ricette: i Markdown in `webapp/recipes/` sono la fonte dati.

## 2. Architettura e flusso dati

```text
webapp/recipes/*.md
    | fs.readFileSync + gray-matter
    v
webapp/src/lib/recipes.ts
    | getAllRecipes()                 | getRecipe(slug)
    v                                  v
app/page.tsx                        app/recipes/[slug]/page.tsx
    |                                  | ReactMarkdown + remark-gfm
    v                                  v
RecipeBrowser (client)              pagina Markdown della ricetta
    | Fuse.js, filtro tag, query URL
    v
Link /recipes/[slug]
```

`recipes.ts` costruisce il percorso con `path.join(process.cwd(), "recipes")`. I comandi della webapp devono essere eseguiti da `webapp/`, dove si trovano direttamente i Markdown. `getAllRecipes()` legge solo i file `.md`, li trasforma in riepiloghi e li ordina per titolo con `localeCompare(..., "it")`. `getRecipe(slug)` risolve `${slug}.md` e restituisce `undefined` se non esiste.

La home esegue `getAllRecipes()` sul server e passa i dati a `RecipeBrowser`. La pagina di dettaglio espone `generateStaticParams()` dagli slug disponibili, cerca la ricetta richiesta e chiama `notFound()` per uno slug inesistente.

Sulle pagine di dettaglio, `ChatPanel` invia domanda, slug e cronologia a `POST /api/chat`. L'endpoint recupera nuovamente la ricetta dal filesystem, costruisce il contesto server-side e inoltra una richiesta streaming a `${AI_GATEWAY_URL}/chat`. Il token resta esclusivamente sul server. La risposta SSE viene passata al browser e mostrata progressivamente nel pannello.

## 3. Formato delle ricette

Il front matter YAML e' opzionale e supporta `title`, `date`, `tags`, `difficulty`, `prep_time` e `cook_time`:

```yaml
---
title: "Cacio e pepe sous-vide"
date: "2026-07-29"
tags:
  - sous-vide
  - pasta
difficulty: "Media"
prep_time: "15 min"
cook_time: "45 min"
---

# Cacio e pepe sous-vide

Descrizione e contenuto della ricetta in Markdown.
```

- `title`: titolo mostrato nell'indice e nel dettaglio.
- `date`: data editoriale, conservata come stringa.
- `tags`: elenco di tag testuali usati anche dal filtro.
- `difficulty`: difficolta' mostrata nel dettaglio.
- `prep_time` e `cook_time`: tempi esposti nel modello come `prepTime` e `cookTime`.

Il parser usa `gray-matter`. Se `title` non e' una stringa, il titolo viene dal primo heading di livello 1 (`# Titolo`); se manca anche quello, viene usato lo slug del file con i trattini trasformati in spazi. Lo slug e' il nome del file senza `.md`: `cacio-e-pepe-sous-vide.md` diventa `/recipes/cacio-e-pepe-sous-vide`.

`tags` viene accettato solo come array e conserva solo elementi stringa. L'estratto viene ricavato dal contenuto, rimuovendo heading e parte della formattazione e limitandolo a 155 caratteri circa.

## 4. Funzionalita' frontend

### Home e ricerca

- La home mostra l'elenco ordinato per titolo.
- La ricerca usa Fuse.js sui campi `title`, `tags` ed `excerpt`.
- Fuse.js usa `threshold: 0.35` e `ignoreLocation: true`.
- `useDeferredValue` mantiene reattiva l'interfaccia mentre cambia la query.
- La query viene letta dall'URL tramite il parametro `q`, per esempio `/?q=pesto`.
- Il filtro tag e' applicato dopo la ricerca e permette un solo tag selezionato alla volta.
- Ogni risultato collega a `/recipes/[slug]`.

### Rendering delle ricette

Il contenuto viene renderizzato con `ReactMarkdown` e `remark-gfm`, comprese le tabelle GFM. Le tabelle sono racchiuse in un contenitore con scorrimento orizzontale. I titoli `Sicurezza Alimentare` ricevono la classe CSS `safety-heading`; il primo heading del contenuto viene reso come `h2` nella pagina.

### Chat AI sulla ricetta

- Ogni pagina `/recipes/[slug]` include il pulsante che apre l'assistente contestuale alla ricetta visualizzata.
- L'assistente risponde in italiano e usa il Markdown della ricetta come fonte primaria per ingredienti, dosi, strumenti, passaggi, tempi e temperature.
- Le conversazioni sono salvate nel `localStorage` del browser, separate per slug della ricetta; non sono archiviate dal repository o in un database applicativo.
- Le risposte sono ricevute in streaming dal gateway, appaiono progressivamente nell'interfaccia e sono renderizzate come Markdown nella modale chat.
- Se l'invio di un messaggio utente fallisce, la stessa bolla mostra uno stato di errore con pulsante di retry; un retry riuscito riusa quella bolla invece di crearne una nuova.
- L'endpoint accetta messaggi fino a 4.000 caratteri, filtra la cronologia e limita il Markdown inviato al modello a 18.000 caratteri.
- Il prompt server-side chiede inoltre di mantenere la risposta intorno a 1.600 caratteri; se serve piu spazio, il modello deve prima chiudere una risposta completa e poi proporre `Vuoi che continui con <argomento successivo>?`.
- Le istruzioni server-side richiedono cautela su sicurezza alimentare, conservazione, allergeni e cotture a bassa temperatura: il modello deve distinguere le informazioni presenti nella ricetta dalle indicazioni generali e dichiarare i limiti del contesto.
- Alla chiusura della chat il client prova a sintetizzare i messaggi non ancora analizzati via `POST /api/complete`; in caso di errore, effettua fino a 3 retry aggiuntivi distanziati di 15 secondi e interrompe il ciclo al primo successo.

### Chat-traces editoriali

- Con la condivisione sessioni attiva, `POST /api/complete` puo scrivere JSON sotto [webapp/recipes/chat-traces/](webapp/recipes/chat-traces/) per trasformare le conversazioni in segnali editoriali riusabili.
- I file usano `schema_version: "2"` e includono `recipe_slug`, `date_bucket`, `has_pii_risk`, `redaction_notes` e `signals`.
- Ogni signal espone:
  - `gap_type`: tipo di lacuna (`missing_info`, `ambiguous_info`, `conflicting_info`, `not_a_gap`);
  - `answer_source`: se la risposta era gia' nella ricetta, richiedeva conoscenza generale o restava insufficiente;
  - `confidence`: numero tra `0` e `1` che esprime quanta evidenza c'e' nel trascritto e nella ricetta per quel topic;
  - `recipe_scope`: descrive se il signal e' direttamente utile alla ricetta corrente (`current_recipe`) oppure se ha valore applicativo piu' generale per ricette future (`new_recipe`);
  - `origin`: oggetto con `source` (`user` oppure `assistant`) e `model`, utile per distinguere topic emersi dalle domande utente da topic suggeriti dalle risposte del modello.
- I signal `not_a_gap` restano nella risposta HTTP per debug, ma non vengono persistiti nei file GitHub.

### Revisione agentica dei chat-traces

L'agente `Cook-signals-reviewer` (prompt `/review-chat-signals`) legge i chat-traces non ancora processati, li valuta con i sub-agenti culinari pertinenti e decide se modificare una ricetta esistente o crearne una nuova ispirata ad essa. E' una funzionalità del team Cook, non del ciclo ACE: agisce solo sul contenuto delle ricette. Ogni segnale puo' essere scartato (bassa confidence, non azionabile, rischio di alterare contenuti di sicurezza senza fonte solida) e ogni esecuzione produce un log in `webapp/recipes/chat-traces/reviews/`; i trace valutati vengono spostati in `webapp/recipes/chat-traces/processed/<date_bucket>/` tramite gli script deterministici in `webapp/scripts/chat-signals/`.

### PWA e disponibilita' offline

Il layout configura metadati, icone e il riferimento al manifest e include `PwaRegistrar`. Il componente registra `/sw.js` **solo quando `NODE_ENV` e' `production`** e quando il browser supporta i service worker; in sviluppo non effettua la registrazione. Il service worker mantiene una cache dell'app shell e usa una strategia network-first per le navigazioni, con fallback alla cache quando la rete non e' disponibile. Questo abilita un comportamento offline limitato alle risorse e alle navigazioni gia' messe in cache, non una sincronizzazione completa dei contenuti.

Il layout imposta inoltre `lang="it"`, i metadati applicativi di Danio Cooks e i font Google Libre Caslon Text e Plus Jakarta Sans.

## 5. Stack e dipendenze

- Next.js `16.2.12` con App Router.
- React e React DOM `19.2.4`.
- TypeScript `^5`.
- `gray-matter` per il front matter YAML.
- `fuse.js` per la ricerca fuzzy lato client.
- `react-markdown` e `remark-gfm` per il rendering Markdown/GFM.
- `lucide-react` per le icone.
- ESLint e `eslint-config-next` per il linting.
- Tailwind CSS 4 e `@tailwindcss/postcss` per lo styling.
- `@netlify/plugin-nextjs` per l'integrazione Netlify.

In [webapp/next.config.ts](webapp/next.config.ts) il root di Turbopack e' impostato esplicitamente sulla directory `webapp`.

## 6. Prerequisiti e sviluppo locale

Prerequisiti:

- Node.js 24, coerente con la configurazione Netlify.
- npm.
- Una directory `recipes/` popolata con file Markdown validi.

I comandi vanno eseguiti dalla directory `webapp`, non dalla root, perche' il loader costruisce il percorso a partire da `process.cwd()`:

```bash
cd webapp
npm install
npm run dev
```

Per lint, build e avvio in produzione:

```bash
cd webapp
npm run lint
npm run build
npm run start
```

`npm run start` richiede un build completato con successo. Il comando `build` deve poter leggere `../recipes` rispetto a `webapp`; se la directory e' vuota o non raggiungibile, l'indice e la generazione delle pagine possono fallire o risultare privi di contenuti.

## 7. Deploy su Netlify

Il file [netlify.toml](netlify.toml) configura base `webapp`, comando `npm run build`, publish `.next`, plugin `@netlify/plugin-nextjs` e Node `24`. La build deve avere accesso ai contenuti in `recipes/`, letti dal filesystem durante la build.

La chat AI richiede queste variabili d'ambiente sia in locale sia su Netlify:

- `AI_GATEWAY_URL`: URL base del gateway, senza dover includere il percorso `/chat`.
- `AI_GATEWAY_TOKEN`: token Bearer usato esclusivamente dall'endpoint server-side.

In assenza di una delle due variabili, `POST /api/chat` restituisce `503` e la UI mostra che la chat non e' configurata. Non inserire valori reali nel README, nel codice o nei file versionati; il token non deve mai essere una variabile `NEXT_PUBLIC_*`.

## 8. Manutenzione e troubleshooting

### Ricetta non visibile

Controllare che il file sia direttamente in `recipes/`, abbia estensione `.md` e sia raggiungibile da `webapp/../recipes`. Il loader ignora ogni altro tipo di file. Dopo modifiche locali, riavviare il server se il contenuto non viene ricaricato.

### Metadati non letti

Verificare la sintassi YAML, i nomi esatti (`prep_time` e `cook_time`, non camelCase) e i tipi. `tags` deve essere un array; valori non stringa vengono ignorati. Se `title` non e' una stringa, controllare il primo `#` oppure il nome del file, che diventera' il fallback.

### Slug o link non funzionante

Lo slug coincide con il nome del file senza `.md`: `/recipes/nome-file` richiede `recipes/nome-file.md`. Il valore deve corrispondere a maiuscole, minuscole e trattini del file; uno slug non trovato porta a `notFound()`.

### Build o deploy falliti

Eseguire i comandi da `webapp`, verificare `npm install`, Node 24, la presenza di `recipes/` nel checkout e `base = "webapp"` su Netlify. Per problemi Markdown, provare prima un file minimo con front matter valido e testo semplice, poi aggiungere tabelle o GFM.

### Chat AI non disponibile

Verificare che `AI_GATEWAY_URL` e `AI_GATEWAY_TOKEN` siano configurate nel processo che esegue Next.js o nelle variabili d'ambiente di Netlify, quindi effettuare un nuovo deploy o riavviare il server locale. Un `502` indica che il gateway non e' raggiungibile; lo status restituito dal gateway segnala invece un errore a monte. Non esporre il token nel browser per diagnosticare il problema.

## 9. Convenzioni editoriali e sicurezza

I contenuti sono mantenuti in italiano. Usare nomi file sintetici e descrittivi, preferibilmente minuscoli e con parole separate da trattini; mantenere front matter coerente e sezioni leggibili. Quando una spiegazione esiste gia', preferire un link invece di duplicarla.

Le sezioni `Sicurezza Alimentare` devono rimanere intatte. Ogni modifica a temperature, tempi, pH, conservazione, allergeni, contaminazione o altre raccomandazioni di sicurezza richiede revisione e approvazione umana esplicita. Per i dettagli consultare [AGENTS.md](AGENTS.md).

## 10. Licenza

Nel repository non e' presente una licenza dedicata.
