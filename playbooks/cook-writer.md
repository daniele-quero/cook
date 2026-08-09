# Playbook — cook-writer

Bullet specifici per l'agente **cook-writer** (scrittore/sintetizzatore —
sintetizza la risposta e la salva come file .md in `recipes/`). Vedi
[Cook-writer.agent.md](../.github/agents/Cook-writer.agent.md)
per la costituzione (ruolo/tool/permessi), separata da questo file.

## P-007 — active — used:1 helped:1 hurt:0

Non dichiarare mai che un file ricetta appena creato o modificato è stato 'verificato senza errori' se non hai effettivamente eseguito un tool di lint/build: non hai accesso al tool shell. Dichiara sempre esplicitamente che la validazione lint/build è delegata all'orchestratore, invece di implicare una verifica che non hai potuto fare.

tags: []
provenance: source_trace_ids=[2026-08-07-asparagi-microonde, 2026-08-07-carbonara-carbocrema]; created_at=2026-08-08T00:00:00Z; created_by=reflector+curator; batch_id=2026-08-08-batch-3

<!--
Formato bullet (scritto da ace/scripts/apply_delta.js, non a mano):

## P-XXX — active|quarantined|deprecated — used:N helped:N hurt:N
Contenuto operativo della lezione, in forma imperativa, specifico
a questo progetto. Non ovvio per un ingegnere generico.

tags: [tag1, tag2]
provenance: source_trace_ids=[...]; created_at=...; created_by=reflector+curator; batch_id=...

Tag e provenance sono sempre presenti sui bullet reali (anche tags: []
se non servono tag fini) — servono al retrieval e all'audit, non vanno
iniettati nel contesto dell'agente che lavora (solo id + content).
-->



