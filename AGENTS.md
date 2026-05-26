# AGENTS.md — Istruzioni per agenti AI

Scopo
- Fornire indicazioni concise e azionabili per agenti AI che lavorano su questo repository.

Breve descrizione del repository
- Contenuto: raccolta di ricette, guide tecniche e SOP in formato Markdown (sous-vide, emulsioni, sicurezza alimentare).
- Linguaggio principale: italiano.
- Non è un progetto software: non ci sono build, script o test automatici.

Cosa cercare prima di modificare
- File chiave: [2026-05-15_maionese-artigianale-frullatore-immersione.md](2026-05-15_maionese-artigianale-frullatore-immersione.md), [pesto_rucola_frutta_secca_guida_completa_2026.md](pesto_rucola_frutta_secca_guida_completa_2026.md), [SOP_chips_croccanti_no-Maillard_20260523_0001.md](SOP_chips_croccanti_no-Maillard_20260523_0001.md).
- Preferire il principio “link, non copiare”: se una sezione esiste, linkala invece di duplicarla.

Convenzioni di repository
- Nomi file: spesso includono una data o un suffisso (es. `YYYY-MM-DD_*` o `*_<YYYY>.md`) e parole chiave (SOP_, *_sousvide, etc.).
- Struttura dei documenti: le note di sicurezza appaiono come `Sicurezza Alimentare` o `## Sicurezza Alimentare` — mantienile intatte.
- Metadati raccomandati: aggiungi front-matter YAML minimo quando crei nuovi file:

```yaml
---
title: "Titolo"
date: 2026-05-25
authors: ["tuo-nome"]
tags: ["sous-vide","verdura"]
---
```

Linee guida per agenti
- Manutenibilità: fare modifiche atomiche (una modifica logica per PR).
- Revisione umana: qualsiasi modifica che impatti raccomandazioni di sicurezza (temperature, tempi, pH, conservazione) richiede approvazione esplicita dell'autore umano.
- Citazioni: quando suggerisci cambiamenti scientifici o igienico-sanitari, includi fonti o nota "verificare con esperto".
- Linguaggio: mantenere l'italiano; se traduci o normalizzi, conserva l'originale e crea una copia con suffisso `.en.md` o `.normalized.md`.

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

Fine
- Per creare nuovi agenti/prompts: aggiungi file in `agents/` o `prompts/` rispettando i formati sopra e apri una PR.
