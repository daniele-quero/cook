<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE per `webapp-frontend`

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/webapp-frontend.md`. Non auto-iniettato da Copilot: va letto esplicitamente con `read_file` (vedi il passo dedicato nel workflow dell'agente). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-002]`).

- **[P-011]** Quando aggiungi un elemento cliccabile (es. thumbnail) accanto a un altro elemento gia' cliccabile che punta alla stessa destinazione (es. un button/freccia esistente), implementali come Link Next.js fratelli con lo stesso href invece di annidare un anchor dentro un altro, per evitare markup HTML invalido (anchor-in-anchor) e i relativi problemi di hydration/accessibilita'.
- **[P-013]** La suite Playwright e2e eseguita contro 'next dev'/Turbopack e' intrinsecamente incline a flakiness per due motivi ricorrenti, distinti dal codice della feature in lavorazione: (1) i worker paralleli di default possono produrre fallimenti non riconducibili alla modifica corrente — isola i test sospetti e, se persiste, rilancia con --workers=1 o contro 'next build && next start' prima di considerare la feature stessa difettosa; (2) 'page.addInitScript' per seedare localStorage prima della navigazione puo' essere silenziosamente sovrascritto da un ciclo di Fast Refresh che ri-esegue l'init script dopo che l'app ha gia' letto/ripulito lo storage — per seed di storage/TTL preferisci il pattern goto -> page.evaluate (scrivi lo storage) -> reload -> interagisci.

<!-- ACE:END -->
