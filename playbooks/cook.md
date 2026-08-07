# Playbook — cook (orchestratore)

Bullet specifici per l'**orchestratore** `cook`: logica di selezione dei
subagenti, validazione/riconciliazione delle loro risposte, sintesi
finale. Vedi [Cook.agent.md](../.github/agents/Cook.agent.md) per la
costituzione (ruolo/tool/permessi), separata da questo file.

Distinto da [_global.md](_global.md): `_global.md` contiene lezioni che
servono a tutti i subagenti mentre rispondono nel proprio dominio; questo
file contiene lezioni su decisioni che solo l'orchestratore prende (es.
quali subagenti coinvolgere, come riconciliare risposte in tensione tra
loro), che non avrebbe senso iniettare nel contesto di un subagente
che non può comunque agire su quella decisione.

## P-001 — active — used:0 helped:0 hurt:0

Quando il procedimento descritto dipende da un elettrodomestico o contenitore specifico (piastra a induzione, microonde, barattolo chiuso, roner, ecc.), coinvolgi sempre cook-physicist anche se la domanda dell'utente non contiene parole chiave esplicite di fisica o sicurezza.

tags: []
provenance: source_trace_ids=[2026-08-07-salsa-limone-roux, 2026-08-07-condimento-egg-fried-rice-microonde, 2026-08-07-lo-mein-verdure]; created_at=2026-08-07T00:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-1

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


