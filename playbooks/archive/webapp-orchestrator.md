# Archivio — webapp-orchestrator

Bullet deprecated spostati qui da `playbooks/webapp-orchestrator.md`.

## P-013 — deprecated — used:0 helped:0 hurt:0

Deprecato per ragioni di integrita' dell'ID, non per invalidita' del contenuto (era attivo, corretto, e usato normalmente): l'ID 'P-013' risultava duplicato con playbooks/webapp-frontend.md (bullet diverso, sulla flakiness Playwright), causando attribuzione silenziosamente errata dei contatori used/helped/hurt in update_counters.js/apply_delta.js (entrambi cercano il bullet per ID scorrendo listPlaybookFiles() e si fermano al primo file con quell'ID trovato). Contenuto migrato integralmente, con aggiunta di nuova evidenza, a P-015 nella stessa decisione di batch (vedi PR-001).

tags: []
provenance: source_trace_ids=[2026-08-17-home-ricettario-scroll, 2026-08-17-faq-istruzioni-pages, 2026-08-17-navigation-editorial-refinement, 2026-08-15-orchestrator-hardening]; created_at=2026-08-18T08:19:52Z; created_by=reflector+curator; batch_id=2026-08-18-batch-7
