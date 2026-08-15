# Playbook — cook-orchestrator

Bullet specifici per l'**orchestratore** `cook-orchestrator`: logica di
selezione dei subagenti, validazione/riconciliazione delle loro risposte,
sintesi finale. Vedi [Cook-orchestrator.agent.md](../.github/agents/Cook-orchestrator.agent.md)
per la costituzione (ruolo/tool/permessi), separata da questo file.
L'identificativo interno (scope in bullet/trace schema) ora coincide col
nome del file agente `Cook-orchestrator.agent.md` — non sono più due cose
distinte come in una versione precedente di questo progetto.

Distinto da [_global.md](_global.md): `_global.md` contiene lezioni che
servono a tutti i subagenti mentre rispondono nel proprio dominio; questo
file contiene lezioni su decisioni che solo l'orchestratore prende (es.
quali subagenti coinvolgere, come riconciliare risposte in tensione tra
loro), che non avrebbe senso iniettare nel contesto di un subagente
che non può comunque agire su quella decisione.

## P-001 — active — used:12 helped:7 hurt:0

Quando il procedimento descritto dipende da un elettrodomestico o contenitore specifico (piastra a induzione, microonde, barattolo chiuso, roner, ecc.), coinvolgi sempre cook-physicist anche se la domanda dell'utente non contiene parole chiave esplicite di fisica o sicurezza.

tags: []
provenance: source_trace_ids=[2026-08-07-salsa-limone-roux, 2026-08-07-condimento-egg-fried-rice-microonde, 2026-08-07-lo-mein-verdure]; created_at=2026-08-07T00:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-1

## P-006 — active — used:10 helped:4 hurt:0

Prima di eseguire git push a fine workflow, verifica esplicitamente il branch corrente (es. git branch --show-current) e usa quello come destinazione del push, invece di assumere 'master' o un branch di default — specialmente quando si lavora su un branch di feature.

tags: []
provenance: source_trace_ids=[2026-08-07-rapporti-acqua-cuociriso]; created_at=2026-08-07T18:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-2

## P-008 — active — used:8 helped:7 hurt:0

Dopo che cook-writer ha creato o modificato un file ricetta, esegui sempre tu stesso npm run lint e npm run build in webapp/ prima di considerare il task concluso, indipendentemente dal fatto che cook-writer dichiari già di aver 'verificato' il file: cook-writer non ha accesso al tool shell in questa architettura.

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























