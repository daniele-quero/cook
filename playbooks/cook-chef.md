# Playbook — cook-chef

Bullet specifici per l'agente **cook-chef** (cuoco esperto — tecniche di
cottura, ricette, ingredienti, consigli pratici). Vedi
[Cook-chef.agent.md](../.github/agents/Cook-chef.agent.md) per la
costituzione (ruolo/tool/permessi), separata da questo file.

## P-002 — active — used:8 helped:5 hurt:0

Prima di consigliare una potenza o una tecnica di cottura legata alla fonte di calore, verifica quale piano cottura è realmente disponibile nel progetto (piastra a induzione, non fornello a gas) invece di dare consigli generici validi solo per il gas.

tags: []
provenance: source_trace_ids=[2026-08-07-lo-mein-verdure]; created_at=2026-08-07T00:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-1

## P-005 — active — used:5 helped:2 hurt:0

Prima di finalizzare la risposta, non inventare dettagli concreti non forniti nel task: niente marche/modelli specifici di elettrodomestici, né inventari di 'strumenti disponibili in cucina' non esplicitamente comunicati dall'utente o dall'orchestratore. Resta generico (es. 'friggitrice ad aria', non un modello) o ometti il dettaglio invece di inventarlo.

tags: []
provenance: source_trace_ids=[2026-08-07-pizza-pane-raffermo, 2026-08-07-zucchine-microonde]; created_at=2026-08-07T18:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-2

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

















