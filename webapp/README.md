# Danio Cooks Web App

Web app Next.js per esplorare le ricette Markdown nella directory `../recipes`.

## Chat AI contestuale

Ogni pagina di dettaglio ricetta include un assistente AI accessibile dal pulsante chat. La chat riceve il Markdown della ricetta visualizzata come contesto: risponde in italiano a domande su ingredienti, tecnica e sicurezza, senza attribuire alla ricetta informazioni che non contiene.

Il browser invia slug, messaggio e cronologia a `POST /api/chat`. L'endpoint legge la ricetta dal filesystem, costruisce il prompt lato server e inoltra la richiesta in streaming a `${AI_GATEWAY_URL}/chat`; `AI_GATEWAY_TOKEN` non viene mai inviato al client. Le risposte sono mostrate progressivamente tramite Server-Sent Events. La cronologia viene conservata soltanto nel `localStorage` del browser ed e' separata per ricetta.

Per contenere il contesto e l'input, l'endpoint accetta messaggi fino a 4.000 caratteri e include al massimo 18.000 caratteri del Markdown della ricetta. Le istruzioni dell'assistente richiedono di distinguere le informazioni della ricetta dalle indicazioni generali e di usare cautela per conservazione, allergeni e sicurezza alimentare.

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

La configurazione e in `../netlify.toml`: Netlify deve clonare l'intero repository perche l'app e in `webapp/`, mentre il corpus di ricette e nella directory fratella `recipes/`.

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
