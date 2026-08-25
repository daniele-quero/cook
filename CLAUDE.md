<!-- CLAUDE:BEGIN — generato da scripts/copilot-to-claude.js da .github/copilot-instructions.md, non modificare a mano tra questi marker -->

<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE (playbook globale)

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/_global.md`. Si applicano a **tutti** gli agenti del team Cook (orchestratore e subagenti). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-003]`).

- **[P-003]** Non forzare contenuti di sicurezza quando il rischio reale è assente o minimo: dichiaralo esplicitamente e in modo sintetico (es. una sezione Sicurezza Alimentare breve e onesta) invece di inventare rischi non pertinenti o riempire una sezione obbligatoria per convenzione.
- **[P-010]** Quando esegui commit/push a fine task, aggiungi (git add) solo i file effettivamente pertinenti al task corrente (es. la ricetta e la sua thumbnail), lasciando intatte altre modifiche non correlate gia' presenti nel working tree, anche se non ancora committate da sessioni precedenti. Se scopri che il terminale/working directory condivisi contengono modifiche (committate o non) riferibili a un task diverso dal proprio — inclusa la scoperta di trovarsi su un branch inatteso — isola le tue modifiche invece di usare operazioni git distruttive sullo stato condiviso (niente checkout -f, reset --hard su branch altrui): usa un worktree dedicato, git stash su percorsi espliciti, oppure git hash-object/update-index per costruire un commit pulito solo dei file pertinenti, poi pubblica (es. push diretto a origin/<branch>) senza toccare il resto. Vale per qualunque agente orchestratore (cook-orchestrator, webapp-orchestrator) e per webapp-frontend: piu' sessioni possono condividere la stessa directory di lavoro fisica in concorrenza.
- **[P-014]** I file in ace/traces/*.json e playbooks/*.md sono un registro storico dell'apprendimento del team: non cancellarli mai come effetto collaterale di una pulizia generica del repository (es. 'pulizia post-merge', rimozione di file ritenuti 'temporanei' o 'di lavoro') senza prima verificarne esplicitamente il contenuto e senza una conferma umana dedicata, separata dall'autorizzazione a ripulire il resto dell'albero di lavoro. Se la cancellazione accidentale accade comunque, ricostruisci il contenuto perduto dalla cronologia reale (diff di PR/commit, resoconti finali degli agenti) invece di ometterlo, dichiarando esplicitamente nella trace ricostruita che si tratta di una ricostruzione e quali dettagli (es. frizioni implementative specifiche) non sono verificabili.
- **[P-016]** Quando lo stesso subagente (es. cook-chef, cook-physicist, cook-writer, cook-biosafety) viene invocato piu' volte nella stessa sessione per sotto-task strettamente correlati (es. due guide tecniche richieste nello stesso task utente), genera UNA sola trace ACE per quel subagente che copra tutte le invocazioni della sessione, invece di una trace per ciascuna chiamata — l'orchestratore che sintetizza la trace finale deve dichiarare esplicitamente questa scelta nelle note, cosi' che sia verificabile e non dipenda da una convenzione implicita non scritta.

<!-- ACE:END -->

<!-- CLAUDE:END -->

## Convenzioni Claude Code per gli agenti

I ruoli operativi hanno come sorgente di verità le personas in
[`docs/agent-personas/`](docs/agent-personas/); gli agenti ACE restano
un'eccezione separata e usano i prompt in [`ace/prompts/`](ace/prompts/).
[`scripts/agent-registry.json`](scripts/agent-registry.json) contiene il
mapping canonico di nomi, tool, modelli e deleghe. I wrapper in
[`.claude/agents/`](.claude/agents/) sono artefatti generati e devono avere un
`name` `cl/<team>/<role>`; i loro delegati devono usare gli stessi nomi
qualificati `cl/...`.

Dopo ogni modifica a una persona, a un prompt ACE, al registro o al generatore,
esegui `node scripts/sync-agent-wrappers.js --scope all` (oppure `--scope ace`
per il solo prompt ACE). Gli script storici
[`scripts/copilot-to-claude.js`](scripts/copilot-to-claude.js) e
[`scripts/claude-to-copilot.js`](scripts/claude-to-copilot.js) sono entry point
compatibili dello stesso generatore e producono entrambi i lati. Non modificare
mai a mano un wrapper per introdurre comportamento: modifica la sorgente e
rigenera. Gli helper legacy in `scripts/lib/` non sono una sorgente di verità
né un generatore alternativo: restano solo per compatibilità.

Nei wrapper Claude usa `Read` per persone e prompt, `AskUserQuestion` per le
domande interattive e solo i tool/deleghe dichiarati dal registro. Verifica il
sync con `node scripts/sync-agent-wrappers.js --check`, una seconda esecuzione
senza diff, controllo di nomi/deleghe e `git diff --check`. I file ACE
generati da `retrieval.js` e i playbook non sono una sorgente alternativa per
il comportamento operativo.
