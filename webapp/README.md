# Danio Cooks Web App

Web app Next.js per esplorare le ricette Markdown nella directory `../recipes`.

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) per provare l'app.

## Deploy su Netlify

La configurazione e in `../netlify.toml`: Netlify deve clonare l'intero repository perche l'app e in `webapp/`, mentre il corpus di ricette e nella directory fratella `recipes/`.

1. Collega il repository a Netlify con **Import an existing project**.
2. Netlify rileva automaticamente la configurazione:
   - Base directory: `webapp`
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Plugin: `@netlify/plugin-nextjs`
   - Node.js: `24`
3. Per la futura chat, configura in **Project configuration > Environment variables**:
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
