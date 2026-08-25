<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE (playbook globale)

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/_global.md`. Si applicano a **tutti** gli agenti del team Cook (orchestratore e subagenti). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-003]`).

- **[P-003]** Non forzare contenuti di sicurezza quando il rischio reale è assente o minimo: dichiaralo esplicitamente e in modo sintetico (es. una sezione Sicurezza Alimentare breve e onesta) invece di inventare rischi non pertinenti o riempire una sezione obbligatoria per convenzione.
- **[P-010]** Quando esegui commit/push a fine task, aggiungi (git add) solo i file effettivamente pertinenti al task corrente (es. la ricetta e la sua thumbnail), lasciando intatte altre modifiche non correlate gia' presenti nel working tree, anche se non ancora committate da sessioni precedenti. Se scopri che il terminale/working directory condivisi contengono modifiche (committate o non) riferibili a un task diverso dal proprio — inclusa la scoperta di trovarsi su un branch inatteso — isola le tue modifiche invece di usare operazioni git distruttive sullo stato condiviso (niente checkout -f, reset --hard su branch altrui): usa un worktree dedicato, git stash su percorsi espliciti, oppure git hash-object/update-index per costruire un commit pulito solo dei file pertinenti, poi pubblica (es. push diretto a origin/<branch>) senza toccare il resto. Vale per qualunque agente orchestratore (cook-orchestrator, webapp-orchestrator) e per webapp-frontend: piu' sessioni possono condividere la stessa directory di lavoro fisica in concorrenza.
- **[P-014]** I file in ace/traces/*.json e playbooks/*.md sono un registro storico dell'apprendimento del team: non cancellarli mai come effetto collaterale di una pulizia generica del repository (es. 'pulizia post-merge', rimozione di file ritenuti 'temporanei' o 'di lavoro') senza prima verificarne esplicitamente il contenuto e senza una conferma umana dedicata, separata dall'autorizzazione a ripulire il resto dell'albero di lavoro. Se la cancellazione accidentale accade comunque, ricostruisci il contenuto perduto dalla cronologia reale (diff di PR/commit, resoconti finali degli agenti) invece di ometterlo, dichiarando esplicitamente nella trace ricostruita che si tratta di una ricostruzione e quali dettagli (es. frizioni implementative specifiche) non sono verificabili.
- **[P-016]** Quando lo stesso subagente (es. cook-chef, cook-physicist, cook-writer, cook-biosafety) viene invocato piu' volte nella stessa sessione per sotto-task strettamente correlati (es. due guide tecniche richieste nello stesso task utente), genera UNA sola trace ACE per quel subagente che copra tutte le invocazioni della sessione, invece di una trace per ciascuna chiamata — l'orchestratore che sintetizza la trace finale deve dichiarare esplicitamente questa scelta nelle note, cosi' che sia verificabile e non dipenda da una convenzione implicita non scritta.

<!-- ACE:END -->

## Convenzioni di sincronizzazione degli agenti

Le personas operative in [`docs/agent-personas/`](../docs/agent-personas/) e i
prompt ACE in [`ace/prompts/`](../ace/prompts/) sono le sorgenti di verità;
[`scripts/agent-registry.json`](../scripts/agent-registry.json) definisce il
mapping runtime. I wrapper in [`.github/agents/`](agents/) e
[`.claude/agents/`](../.claude/agents/) sono artefatti generati da
[`scripts/sync-agent-wrappers.js`](../scripts/sync-agent-wrappers.js).

Dopo ogni modifica esegui `node scripts/sync-agent-wrappers.js --scope all`;
per i soli prompt ACE usa `--scope ace`. Gli entry point storici
`scripts/copilot-to-claude.js` e `scripts/claude-to-copilot.js` richiamano lo
stesso generatore. Non modificare manualmente i wrapper per cambiare il
comportamento: aggiorna la sorgente e rigenera. I nomi Copilot sono
`gh/<team>/<role>`, quelli Claude `cl/<team>/<role>`; i riferimenti `agents:`
devono essere completi e risolvere nel registro. Copilot espone
`vscode/askQuestions`/`ask_user` e lettura `view`/`read`; Claude usa
`AskUserQuestion` e `Read`. Verifica il risultato con `--check`, una seconda
esecuzione deterministica, il controllo delle deleghe e `git diff --check`.
