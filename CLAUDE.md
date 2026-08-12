<!-- CLAUDE:BEGIN — generato da scripts/copilot-to-claude.js da .github/copilot-instructions.md, non modificare a mano tra questi marker -->

<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE (playbook globale)

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/_global.md`. Si applicano a **tutti** gli agenti del team Cook (orchestratore e subagenti). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-003]`).

- **[P-003]** Non forzare contenuti di sicurezza quando il rischio reale è assente o minimo: dichiaralo esplicitamente e in modo sintetico (es. una sezione Sicurezza Alimentare breve e onesta) invece di inventare rischi non pertinenti o riempire una sezione obbligatoria per convenzione.
- **[P-010]** Quando esegui commit/push a fine task, aggiungi (git add) solo i file effettivamente pertinenti al task corrente (es. la ricetta e la sua thumbnail), lasciando intatte altre modifiche non correlate gia' presenti nel working tree, anche se non ancora committate da sessioni precedenti. Se scopri che il terminale/working directory condivisi contengono modifiche (committate o non) riferibili a un task diverso dal proprio — inclusa la scoperta di trovarsi su un branch inatteso — isola le tue modifiche invece di usare operazioni git distruttive sullo stato condiviso (niente checkout -f, reset --hard su branch altrui): usa un worktree dedicato, git stash su percorsi espliciti, oppure git hash-object/update-index per costruire un commit pulito solo dei file pertinenti, poi pubblica (es. push diretto a origin/<branch>) senza toccare il resto. Vale per qualunque agente orchestratore (cook-orchestrator, webapp-orchestrator) e per webapp-frontend: piu' sessioni possono condividere la stessa directory di lavoro fisica in concorrenza.

<!-- ACE:END -->

<!-- CLAUDE:END -->
