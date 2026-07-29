# Cook Web App — Piano di sviluppo

## Stack
- **FE**: Next.js (App Router, SSG dove possibile) — generato via Stitch MCP
- **Ricerca**: Fuse.js client-side sull'index JSON
- **Chat LLM**: API Route Next.js → AI Gateway REST esterno
- **Deploy**: Netlify + `@netlify/plugin-nextjs`
- **Dati**: file `recipes/*.md` nel repo (nessun DB, nessun blob storage)

## Architettura

```
recipes/*.md
    │  build step (generate-index.js)
    ▼
public/recipes-index.json   ← { slug, title, date, tags, difficulty, prep_time, cook_time, excerpt }
    │
    ▼
Next.js (Stitch-generated)
├── /                     → lista ricette + ricerca Fuse.js client-side
├── /recipes/[slug]       → render MD + chat panel
└── /api/chat             → Netlify Function → AI Gateway REST
```

---

## Fase 0 — Prerequisiti dati (~30 min, blocca Fase 1)

1. Fix YAML misposizionato in `recipes/uovo-sous-vide.md` e `recipes/cardoncelli-sous-vide.md` (il blocco `---` deve stare prima dell'H1)
2. Normalizzazione tag: decidere se gestire gli alias (es. "sotto-vide" → "sous-vide") nel file MD o nell'index generator
3. Scrivi `scripts/generate-index.js`: legge tutti `recipes/*.md`, estrae frontmatter + excerpt 150 chars, scrive `public/recipes-index.json`

**Verifica**: `node scripts/generate-index.js` → JSON valido con 27 entry, nessun campo `null` su title/slug/tags

---

## Fase 1 — FE via Stitch MCP (dipende da Fase 0)

4. Usa Stitch MCP per creare il progetto Next.js dal prototipo esistente
5. Pagina `/`:
   - fetch di `recipes-index.json` (statico, servito da CDN)
   - lista ricette con card (title, tags, difficulty, tempi)
   - ricerca client-side con **Fuse.js** su `title`, `tags`, `excerpt`
   - filtro per tag (click su tag → filtra lista)
6. Pagina `/recipes/[slug]`:
   - fetch del file `.md` (raw o pre-renderizzato a build time con `fs`)
   - render con `react-markdown` + `remark-gfm` (gestisce tabelle temperature)
   - sezione `Sicurezza Alimentare` evidenziata visivamente
7. Chat panel in `/recipes/[slug]`:
   - UI messaggi (user/assistant)
   - chiama `POST /api/chat`
   - context automatico: titolo + excerpt della ricetta aperta

**Verifica**: `next dev` → lista visibile, ricerca funzionante, rendering corretto di una ricetta con tabella

---

## Fase 2 — Chat API Route (parallela a Fase 1)

8. `app/api/chat/route.ts`:
   - input: `{ slug, message, history[] }`
   - compone system prompt con snippet ricetta (max ~800 token)
   - chiama AI Gateway via `fetch` con `Authorization: Bearer $AI_GATEWAY_TOKEN`
   - ritorna risposta in streaming (`ReadableStream`)
9. Env vars necessarie:
   - `AI_GATEWAY_URL` — URL base del gateway (non esposta al client)
   - `AI_GATEWAY_TOKEN` — secret, mai nel bundle JS

**Verifica**: `curl -X POST /api/chat -d '{"slug":"salmone-sous-vide","message":"Posso usare salmone d'allevamento?","history":[]}' -H "Content-Type: application/json"` → risposta coerente

---

## Fase 3 — Deploy Netlify

10. `netlify.toml`:
    ```toml
    [build]
      command = "node scripts/generate-index.js && next build"
      publish = ".next"

    [[plugins]]
      package = "@netlify/plugin-nextjs"
    ```
11. Aggiungi `@netlify/plugin-nextjs` al `package.json`
12. Set env vars su Netlify dashboard: `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN`
13. Deploy preview automatico su ogni PR; produzione su merge su `main`

**Verifica**: deploy preview Netlify funzionante end-to-end (lista → ricetta → chat)

---

## Decisioni prese

| Domanda | Scelta | Motivazione |
|---|---|---|
| DB o file MD? | File MD nel repo | Corpus piccolo, contenuto curato, versionabile |
| Ricerca | Fuse.js client-side | Nessun server necessario, corpus < 500 file |
| MD render | react-markdown + remark-gfm | Gestisce tabelle, liste, codice |
| Chat backend | API Route (non Edge) | Compatibilità Netlify Functions garantita |
| Sync Notion | Invariato (script PS esistenti) | Fuori scope, già funzionante |

## Scope escluso

- Autenticazione utenti
- Salvataggio preferiti / note personali
- Generazione ricette via LLM
- Modifica ricette dalla UI

## Note aperte

- [ ] Mappa di alias tag (es. "sotto-vide" → "sous-vide") da decidere prima della Fase 0
- [ ] Contratto API del gateway AI da verificare (endpoint, formato request/response, streaming support)
- [ ] Stitch MCP: capire se esporta direttamente Next.js App Router o Pages Router
