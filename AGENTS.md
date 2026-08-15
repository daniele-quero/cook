# AGENTS.md — Istruzioni per agenti AI

Scopo
- Fornire indicazioni concise e azionabili per agenti AI che lavorano su questo repository.

Breve descrizione del repository
- Contenuto: raccolta di ricette, guide tecniche e SOP in formato Markdown (sous-vide, emulsioni, sicurezza alimentare).
- Linguaggio principale: italiano.
- La webapp in `webapp/` e' un progetto Next.js: dopo modifiche a codice o metadati delle ricette eseguire `npm run lint` e `npm run build` dalla directory `webapp/`.

Cosa cercare prima di modificare
- File chiave: [webapp/recipes/maionese-frullatore-immersione.md](webapp/recipes/maionese-frullatore-immersione.md), [webapp/recipes/pesto-rucola-frutta-secca.md](webapp/recipes/pesto-rucola-frutta-secca.md), [webapp/recipes/chips-croccanti-no-maillard.md](webapp/recipes/chips-croccanti-no-maillard.md).
- Preferire il principio “link, non copiare”: se una sezione esiste, linkala invece di duplicarla.

Convenzioni di repository
- Le ricette vivono in `webapp/recipes/`; i file usano parole chiave italiane in kebab-case.
- Regola nomenclatura file: usare nomi in italiano, minuscoli, parole-separate-con-trattini; essere sintetici ma esplicativi (ingrediente principale e/o tecnica), evitare date, numeri di serie, modelli di apparecchi e suffissi ridondanti come `guida_completa` o l'anno. Esempi: `salmone-sous-vide.md`, `fusi-pollo-friggitrice-aria.md`.
- Nota per agenti: le rinomine automatiche sono permesse solo se l'agente aggiorna anche tutti i riferimenti interni nei file Markdown e richiede approvazione umana quando il documento contiene sezioni `Sicurezza Alimentare` o altre indicazioni di rischio.
- Struttura dei documenti: le note di sicurezza appaiono come `Sicurezza Alimentare` o `## Sicurezza Alimentare` — mantienile intatte.
- Metadati obbligatori per ogni ricetta:

```yaml
---
title: "Titolo"
description: "Sintesi SEO italiana unica, fattuale e di circa 120-160 caratteri"
thumbnail: "/gourmet/immagine-gourmet.jpg"
main_ingredient: "Ingrediente principale"
tags: ["sous-vide","verdura"]
prep_time: "PT10M"
cook_time: "PT20M"
total_time: "PT30M"
difficulty: "facile"
---
```

Linee guida per agenti
- Manutenibilità: fare modifiche atomiche (una modifica logica per PR).
- Revisione umana: qualsiasi modifica che impatti raccomandazioni di sicurezza (temperature, tempi, pH, conservazione) richiede approvazione esplicita dell'autore umano.
- Citazioni: quando suggerisci cambiamenti scientifici o igienico-sanitari, includi fonti o nota "verificare con esperto".
- Linguaggio: mantenere l'italiano; se traduci o normalizzi, conserva l'originale e crea una copia con suffisso `.en.md` o `.normalized.md`.
- SEO editoriale: la description deve essere originale e coerente con la ricetta. Il grassetto e' ammesso solo su richiesta esplicita, al massimo due frasi gia' presenti nella prosa ordinaria, per migliorare la scansione; non usarlo in titoli, tabelle, link, codice, sicurezza, valori o affermazioni mediche.

Cartelle per personalizzazioni AI (create)
- `agents/`: file di definizione agenti (es. `cook-safety.agent.md`) e script di automazione per gli agenti.
- `prompts/`: template di prompt e prompt-rules (es. `recipe-summarize.prompt.md`, `safety-check.prompt.md`).

Formato raccomandato per agenti e prompt
- Agent file: Markdown con sezione `## Intent`, `## Example prompts`, `## Constraints`.
- Prompt file: testo puro o Markdown, con esempi di input/expected output.

Esempi di task utili per agenti
- Estrarre ingredienti, allergeni e tempi di preparazione da un file Markdown.
- Generare indici o un sommario tematico (per tag e ingredienti).
- Verificare la presenza di sezioni `Sicurezza Alimentare` e segnalare eventuali mancanze.
- Creare versioni ‘short’ per social (tweet/Instagram caption) mantenendo le note di sicurezza.

Workflow consigliato per le modifiche
- Crea una branch dedicata: `agent/<breve-descrizione>`.
- Commit piccoli e descrittivi; PR con descrizione e checklist (includere verifica sicurezza se applicabile).

Esempi rapidi
- Link utili: [cook_workspace.code-workspace](cook_workspace.code-workspace) — impostazione VS Code.

Contatti e richieste di revisione
- Per cambiamenti di sicurezza: chiedere esplicitamente conferma all'autore o al maintainer.
- Se incerti, apri una issue descrivendo i rischi e suggerimenti.

Ogni nuova feature o modifica di una feature esistente deve essere documentata nel README del repository; se esiste già una sezione dedicata all'argomento, va aggiornata o sostituita con la nuova documentazione in modo da riflettere correttamente il comportamento attuale.

Fine
- Per creare nuovi agenti/prompts: aggiungi file in `agents/` o `prompts/` rispettando i formati sopra e apri una PR.
