# Playbook globale — ACE

Sorgente di verità per i bullet condivisi da **tutti** gli agenti del team Cook
(cook-chef, cook-chemist, cook-biosafety, cook-physicist, cook-writer).

`.github/copilot-instructions.md` viene generato/sincronizzato a partire da
questo file tramite script (`ace/scripts/`, non ancora scritto) — non va
editato a mano in prod.

## P-003 — active — used:51 helped:24 hurt:0

Non forzare contenuti di sicurezza quando il rischio reale è assente o minimo: dichiaralo esplicitamente e in modo sintetico (es. una sezione Sicurezza Alimentare breve e onesta) invece di inventare rischi non pertinenti o riempire una sezione obbligatoria per convenzione.

tags: []
provenance: source_trace_ids=[2026-08-07-salsa-limone-roux, 2026-08-07-condimento-egg-fried-rice-microonde, 2026-08-07-lo-mein-verdure]; created_at=2026-08-07T00:00:00Z; created_by=reflector+curator; batch_id=2026-08-07-batch-1

## P-010 — active — used:8 helped:4 hurt:0

Quando esegui commit/push a fine task, aggiungi (git add) solo i file effettivamente pertinenti al task corrente (es. la ricetta e la sua thumbnail), lasciando intatte altre modifiche non correlate gia' presenti nel working tree, anche se non ancora committate da sessioni precedenti. Se scopri che il terminale/working directory condivisi contengono modifiche (committate o non) riferibili a un task diverso dal proprio — inclusa la scoperta di trovarsi su un branch inatteso — isola le tue modifiche invece di usare operazioni git distruttive sullo stato condiviso (niente checkout -f, reset --hard su branch altrui): usa un worktree dedicato, git stash su percorsi espliciti, oppure git hash-object/update-index per costruire un commit pulito solo dei file pertinenti, poi pubblica (es. push diretto a origin/<branch>) senza toccare il resto. Vale per qualunque agente orchestratore (cook-orchestrator, webapp-orchestrator) e per webapp-frontend: piu' sessioni possono condividere la stessa directory di lavoro fisica in concorrenza.

tags: []
provenance: source_trace_ids=[2026-08-09-risotto-tecnica]; created_at=2026-08-09T13:00:00Z; created_by=reflector+curator; batch_id=2026-08-09-batch-4

## P-014 — active — used:2 helped:0 hurt:0

I file in ace/traces/*.json e playbooks/*.md sono un registro storico dell'apprendimento del team: non cancellarli mai come effetto collaterale di una pulizia generica del repository (es. 'pulizia post-merge', rimozione di file ritenuti 'temporanei' o 'di lavoro') senza prima verificarne esplicitamente il contenuto e senza una conferma umana dedicata, separata dall'autorizzazione a ripulire il resto dell'albero di lavoro. Se la cancellazione accidentale accade comunque, ricostruisci il contenuto perduto dalla cronologia reale (diff di PR/commit, resoconti finali degli agenti) invece di ometterlo, dichiarando esplicitamente nella trace ricostruita che si tratta di una ricostruzione e quali dettagli (es. frizioni implementative specifiche) non sono verificabili.

tags: []
provenance: source_trace_ids=[2026-08-11-chat-recipe-feedback-signals, 2026-08-11-floating-buttons-opacity]; created_at=2026-08-12T15:00:00Z; created_by=reflector+curator; batch_id=2026-08-12-batch-6

## P-016 — active — used:0 helped:0 hurt:0

Quando lo stesso subagente (es. cook-chef, cook-physicist, cook-writer, cook-biosafety) viene invocato piu' volte nella stessa sessione per sotto-task strettamente correlati (es. due guide tecniche richieste nello stesso task utente), genera UNA sola trace ACE per quel subagente che copra tutte le invocazioni della sessione, invece di una trace per ciascuna chiamata — l'orchestratore che sintetizza la trace finale deve dichiarare esplicitamente questa scelta nelle note, cosi' che sia verificabile e non dipenda da una convenzione implicita non scritta.

tags: []
provenance: source_trace_ids=[2026-08-18-guide-pasta-acciaio]; created_at=2026-08-18T08:19:52Z; created_by=reflector+curator; batch_id=2026-08-18-batch-7

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























