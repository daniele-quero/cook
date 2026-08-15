---
description: 'Legge i chat-traces (segnali sul contenuto delle ricette raccolti dalla chat della webapp) e decide se usarli per modificare o creare ricette'
agent: "Cook-signals-reviewer"
---

Analizza i chat-traces non ancora processati in `webapp/recipes/chat-traces/` (usa lo script deterministico `webapp/scripts/chat-signals/list-unprocessed.mjs` per scoprirli, non enumerarli a memoria). Per ciascun gruppo per `recipe_slug`: valuta ogni segnale, scarta quelli inutili o dannosi secondo i tuoi criteri, coinvolgi i sub-agenti culinari pertinenti per validare le ipotesi rimaste, e decide se modificare una ricetta esistente o crearne una nuova ispirata ad essa. Scrivi sempre il log di valutazione e archivia i trace processati.

Se l'utente indica ricette o date specifiche nel prompt, limita l'analisi a quelle; altrimenti processa tutti i gruppi restituiti dallo script.

${input:Vuoi limitare la revisione a ricette o date specifiche? (lascia vuoto per processare tutto)}
