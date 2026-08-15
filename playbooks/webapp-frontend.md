# Playbook — webapp-frontend

Bullet specifici per l'agente **webapp-frontend** (sviluppatore frontend —
Next.js App Router, React, TypeScript, Tailwind CSS, verifica con
Playwright). Vedi [Webapp-frontend.agent.md](../.github/agents/Webapp-frontend.agent.md)
per la costituzione (ruolo/tool/permessi), separata da questo file.

## P-011 — active — used:9 helped:1 hurt:0

Quando aggiungi un elemento cliccabile (es. thumbnail) accanto a un altro elemento gia' cliccabile che punta alla stessa destinazione (es. un button/freccia esistente), implementali come Link Next.js fratelli con lo stesso href invece di annidare un anchor dentro un altro, per evitare markup HTML invalido (anchor-in-anchor) e i relativi problemi di hydration/accessibilita'.

tags: []
provenance: source_trace_ids=[2026-08-09-thumbnail-cliccabile]; created_at=2026-08-09T13:00:00Z; created_by=reflector+curator; batch_id=2026-08-09-batch-4

## P-013 — active — used:1 helped:1 hurt:0

La suite Playwright e2e eseguita contro 'next dev'/Turbopack e' intrinsecamente incline a flakiness per due motivi ricorrenti, distinti dal codice della feature in lavorazione: (1) i worker paralleli di default possono produrre fallimenti non riconducibili alla modifica corrente — isola i test sospetti e, se persiste, rilancia con --workers=1 o contro 'next build && next start' prima di considerare la feature stessa difettosa; (2) 'page.addInitScript' per seedare localStorage prima della navigazione puo' essere silenziosamente sovrascritto da un ciclo di Fast Refresh che ri-esegue l'init script dopo che l'app ha gia' letto/ripulito lo storage — per seed di storage/TTL preferisci il pattern goto -> page.evaluate (scrivi lo storage) -> reload -> interagisci.

tags: []
provenance: source_trace_ids=[2026-08-12-chat-loading-throbber, 2026-08-12-chat-signals-followups]; created_at=2026-08-12T15:00:00Z; created_by=reflector+curator; batch_id=2026-08-12-batch-6

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














