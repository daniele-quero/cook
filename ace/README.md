# ACE — Agentic Context Engineering per il team Cook

Questo documento è scritto per essere letto da zero: non presuppone che
tu sappia già cos'è ACE, come funzionano i "playbook" o perché esistono
tre agenti (reflector/curator/warden) dedicati solo a farli crescere.
Se vuoi solo un riferimento rapido su un singolo script o file, usa
l'indice sotto; se è la prima volta che tocchi questo sistema, leggi le
sezioni in ordine.

> Nota per chi vuole riusare questo pattern su un altro progetto: la
> versione generica (senza riferimenti al team Cook, con placeholder da
> compilare) vive fuori da questo repo, in `C:\Users\dquero\ace`, insieme
> a un prompt-installatore. Questo file resta invece la documentazione
> **specifica del team Cook** — è anche il testo da cui la versione
> generica è stata estratta, quindi la trovi più didattica del minimo
> indispensabile apposta.

## Indice

1. [Cos'è ACE e perché esiste](#1-cosè-ace-e-perché-esiste)
2. [Glossario](#2-glossario)
3. [Anatomia di un bullet — e cosa significa "P" in P-XXX](#3-anatomia-di-un-bullet--e-cosa-significa-p-in-p-xxx)
4. [I tre agenti del ciclo: reflector, curator, warden](#4-i-tre-agenti-del-ciclo-reflector-curator-warden)
5. [Scenario Copilot confermato: come funziona qui, concretamente](#5-scenario-copilot-confermato-come-funziona-qui-concretamente)
6. [Il ciclo end-to-end, passo per passo](#6-il-ciclo-end-to-end-passo-per-passo)
7. [Struttura dei file, cartella per cartella](#7-struttura-dei-file-cartella-per-cartella)
8. [Domande frequenti / errori tipici](#8-domande-frequenti--errori-tipici)

## 1. Cos'è ACE e perché esiste

Il team Cook è composto da un orchestratore (`Cook-orchestrator`) e cinque
subagenti specialisti (`cook-chef`, `cook-chemist`, `cook-biosafety`,
`cook-physicist`, `cook-writer`), definiti in [.github/agents/](../.github/agents/)
(copia Copilot) e in [.claude/agents/](../.claude/agents/) (copia Claude
Code). Senza nessun meccanismo aggiuntivo, ogni sessione di questi agenti
parte da zero: non "ricordano" cosa ha funzionato o non ha funzionato in
sessioni precedenti, anche se il pattern si ripete identico (es. lo stesso
errore di valutazione della sicurezza alimentare su un ingrediente
analogo).

**ACE (Agentic Context Engineering)** è la risposta a questo problema:
un ciclo che osserva cosa succede davvero nelle sessioni (le **trace**),
estrae lezioni operative concrete (i **bullet**), le raccoglie in
documenti per agente (i **playbook**) e le rimette nel contesto delle
sessioni successive — con un controllo di qualità (gate) e una revisione
umana obbligatoria prima che qualunque lezione diventi "attiva". Non è
fine-tuning del modello: è ingegneria del contesto che il modello riceve
ad ogni chiamata, gestita come dato versionato e auditabile, non come
prosa libera scritta a mano una volta e mai più aggiornata.

Il ciclo è interamente implementato ed end-to-end funzionante in questo
repo: schema, playbook, script deterministici, agenti Copilot/Claude e
trigger a soglia configurabili sono tutti reali, non solo uno scaffold
teorico.

## 2. Glossario

Se un termine sotto ti risulta oscuro più avanti nel documento, torna qui.

- **Bullet**: una singola lezione operativa, in forma imperativa,
  identificata da un id univoco (`P-001`, `P-002`, ...). È l'unità
  atomica di tutto il sistema — vedi [sezione 3](#3-anatomia-di-un-bullet--e-cosa-significa-p-in-p-xxx).
- **Playbook**: un file markdown che raccoglie i bullet di uno scope
  (globale, di un singolo agente, o di una "family" trasversale). Vive in
  [playbooks/](../playbooks/), **fuori** da `ace/` perché è ciò che gli
  agenti leggono/citano durante il lavoro, non infrastruttura del ciclo.
- **Scope**: a chi si applica un bullet — `global` (tutti gli agenti),
  `agent` (un singolo agente, es. `cook-chef`), `family` (trasversale a
  un tipo di task, es. "sous-vide", indipendentemente da quale agente lo
  tratta).
- **Trace**: la registrazione di cosa è successo in un task/sessione per
  un agente — cosa ha fatto, quali bullet ha visto/citato, con quale
  esito. È l'unico input concesso al reflector: nessuna lezione nasce
  senza almeno una trace reale a supportarla. Formato in
  [schema/trace.schema.json](schema/trace.schema.json).
- **Batch**: un insieme di trace (o proposte, o decisioni) processato
  insieme in un singolo run di reflector/curator/warden — mai una alla
  volta, sempre in gruppo, per poter riconoscere pattern tra task diversi.
- **Reflector**: l'agente che legge un batch di trace e propone lezioni
  candidate (**proposte**), senza deciderne l'accettazione.
- **Curator**: l'agente che legge le proposte del reflector e decide,
  una per una, se e come diventano operazioni sui playbook
  (ADD/UPDATE/DEPRECATE/MERGE/PROMOTE/REJECT).
- **Gate**: il controllo meccanico (mai un giudizio LLM) che valida la
  struttura delle decisioni del curator prima che possano toccare i
  playbook — collisioni di ID, scope validi, evidenza citata verificata.
- **Warden**: l'agente-guardiano che esegue il gate e, solo dopo un
  sign-off umano esplicito, applica le decisioni ai playbook.
- **Retrieval**: il passo che filtra i bullet "vivi" (non deprecated/in
  quarantena) e li inietta nei file che gli agenti leggono davvero
  durante il lavoro.
- **Counters (`used`/`helped`/`hurt`)**: quante volte un bullet è stato
  servito, e quante di quelle volte ha contribuito a un esito buono o
  cattivo. Alimentano sia la quarantena automatica sia le decisioni del
  curator — vedi [sezione 3](#3-anatomia-di-un-bullet--e-cosa-significa-p-in-p-xxx).
- **Quarantena**: stato automatico e reversibile di un bullet che ha
  fatto più danno che bene sopra una soglia minima di campioni — escluso
  dal contesto servito finché il curator non lo promuove di nuovo o non
  lo deprecata definitivamente.

## 3. Anatomia di un bullet — e cosa significa "P" in P-XXX

Un bullet reale, così come lo trovi in [playbooks/_global.md](../playbooks/_global.md),
ha questa forma:

```markdown
## P-003 — active — used:0 helped:0 hurt:0
Non forzare contenuti di sicurezza quando il rischio reale è assente o
minimo: dichiaralo esplicitamente e in modo sintetico invece di inventare
rischi non pertinenti o riempire una sezione obbligatoria per convenzione.

tags: []
provenance: source_trace_ids=[...]; created_at=...; created_by=reflector+curator; batch_id=...
```

Scomponendolo:

- **`P-003`**: l'id univoco. **`P` sta per "Playbook (entry)"** — è una
  convenzione interna a questo progetto (non un acronimo standard del
  paper ACE originale né documentato altrove prima di questo file):
  identifica "la terza voce mai assegnata in un playbook di questo
  repo". Il numero è progressivo su **tutto il progetto**, non per
  singolo file (vedi [curator.md](prompts/curator.md)): un bullet resta
  identificabile con lo stesso id anche se il curator lo sposta tra file
  (MERGE, DEPRECATE → `playbooks/archive/`). Non è mai riassegnato: anche
  un bullet deprecato "consuma" per sempre il suo numero.
- **`active`**: lo stato nel ciclo di vita — vedi enum in
  [schema/bullet.schema.json](schema/bullet.schema.json): `active`
  (servito normalmente), `quarantined` (escluso automaticamente,
  reversibile), `deprecated` (escluso, non più reversibile senza una
  nuova decisione del curator che lo riattivi come nuovo bullet).
- **`used:0 helped:0 hurt:0`**: i contatori. `used` sale ogni volta che
  il bullet finisce nel contesto servito a un agente (indipendentemente
  dall'esito); `helped`/`hurt` salgono solo se l'agente lo ha anche
  citato **e** l'esito della trace era rispettivamente `success` o
  `failure`. Aggiornati meccanicamente da
  [scripts/update_counters.js](scripts/update_counters.js), mai a
  giudizio: se non ci sono trace nuove che lo citano, i numeri non si
  muovono.
- **Il corpo del testo**: il contenuto vero e proprio — imperativo,
  specifico al progetto, non un principio da manuale che un
  cuoco/ingegnere esperto già saprebbe.
- **`tags`**: metadati interni per un retrieval più fine (es. filtrare
  per tipo di task). Non mostrati all'agente come campo separato.
- **`provenance`**: audit trail — da quali trace è nato, quando, da chi
  (sempre `reflector+curator` per bullet nati dal ciclo, salvo bootstrap
  manuale), in quale batch. Serve per rispondere alla domanda "perché
  esiste questa regola?" mesi dopo.

**Cosa NON vede l'agente che lavora**: solo `id` + `content` (vedi
[scripts/retrieval.js](scripts/retrieval.js)) — mai contatori, tag o
provenance. Quei metadati servono al ciclo ACE stesso (retrieval,
audit, decisioni del curator), non al ragionamento dell'agente nel task.

## 4. I tre agenti del ciclo: reflector, curator, warden

Perché tre agenti separati e non uno solo che fa tutto? Ogni fase ha un
livello di rischio diverso, e la separazione è quello che rende sicuro
automatizzare le fasi a basso rischio senza automatizzare quella ad alto
rischio:

- **[prompts/reflector.md](prompts/reflector.md)** — legge, **propone**.
  Non scrive mai un playbook. Il costo di una proposta sbagliata è quasi
  zero: il curator la scarta.
- **[prompts/curator.md](prompts/curator.md)** — legge le proposte,
  **decide** (ADD/UPDATE/DEPRECATE/MERGE/PROMOTE/REJECT). Ancora non
  scrive i playbook: emette solo una lista di operazioni "pronte per il
  gate". Il costo di una decisione sbagliata è basso perché il gate e il
  warden vengono dopo.
- **[prompts/warden.md](prompts/warden.md)** — **esegue** il gate
  (controllo meccanico) e, solo dopo un sì umano esplicito ripetuto ad
  ogni checkpoint, applica le operazioni ai playbook reali. Qui il costo
  di un errore è alto (i playbook sono ciò che ogni agente legge da quel
  momento in poi), quindi qui — e solo qui — l'automazione si ferma
  sempre e chiede conferma umana.

A differenza dei 5 subagenti culinari, questi tre non appartengono al
team culinario — non hanno un dominio (cucina, chimica, ...), esistono
solo per far girare il ciclo ACE. Per essere raggiungibili da Copilot
vivono comunque in `.github/agents/`, ma con prefisso **`ACE`** invece di
**`Cook`** (`ACE-reflector.agent.md`, `ACE-curator.agent.md`,
`ACE-warden.agent.md`).

Sono **invocabili in catena**, con soglie configurabili in
[config/thresholds.json](config/thresholds.json) e un conteggio
deterministico in [scripts/check_threshold.js](scripts/check_threshold.js)
(mai l'LLM che "sente" quante trace/proposte/decisioni ci sono — sempre
un conteggio esatto su file reali): `Cook-orchestrator` può invocare
`ACE-reflector` a fine sessione se ci sono abbastanza trace nuove,
`ACE-reflector` può invocare `ACE-curator` se il batch appena prodotto ha
abbastanza proposte, `ACE-curator` può invocare `ACE-warden` se ha
abbastanza decisioni. **L'invocazione on-demand resta sempre possibile**
in qualunque punto della catena, soglia raggiunta o no — l'automazione
aggiunge un trigger, non lo sostituisce.

Reflector e curator producono solo JSON (proposte, decisioni): non hanno
bisogno di eseguire comandi shell oltre a `check_threshold.js`. **Warden**
è diverso — il suo compito è proprio eseguire `ace/scripts/gate.js` e
`ace/scripts/apply_delta.js` per conto dell'umano, quindi ha in dotazione
strumenti di esecuzione shell più estesi
([ACE-warden.agent.md](../.github/agents/ACE-warden.agent.md)) e un
vincolo esplicito nel prompt: nessuno step che scrive su disco parte
senza una conferma umana chiesta un passo alla volta (vedi
[prompts/warden.md](prompts/warden.md)) — **indipendentemente da chi lo
ha invocato**, in automatico o on-demand. La soglia decide solo se
qualcuno lo chiama, non se lui può saltare la conferma. "Gate" resta il
nome dello step/script che valida meccanicamente; "warden" è il ruolo che
lo custodisce e lo esegue.

Per non duplicare a mano il contenuto, [prompts/reflector.md](prompts/reflector.md),
[prompts/curator.md](prompts/curator.md) e [prompts/warden.md](prompts/warden.md)
restano la **sorgente** (frontmatter incluso), e una GitHub Action
([.github/workflows/sync-agent-prompts.yml](../.github/workflows/sync-agent-prompts.yml))
li copia automaticamente in `.github/agents/` ad ogni push che tocca quei
tre file, con commit+push di ritorno. Il trigger osserva solo i file in
`ace/prompts/`, non le destinazioni, per evitare loop. **Va sempre
editato il file sorgente, mai la copia in `.github/agents/` né quella in
`.claude/agents/`.**

## 5. Scenario Copilot confermato: come funziona qui, concretamente

Il team lavora tramite **chat interattiva in VS Code**: l'utente invia un
prompt all'orchestratore (`Cook-orchestrator`), che autonomamente spawna
e gestisce i subagenti necessari nella stessa sessione (vedi il campo
`agents:` in [Cook-orchestrator.agent.md](../.github/agents/Cook-orchestrator.agent.md)).

Conseguenza pratica: non esiste un ciclo invoke→output nativo a cui un
orchestratore ACE esterno possa agganciarsi a runtime, né un filesystem
watcher con hot-reload dei subagent come in Claude Code. L'unica leva per
iniettare il playbook è **riscrivere i file di istruzioni prima che la
sessione parta**:

- `.github/copilot-instructions.md` → **solo** i bullet di scope `global`
  (letto da Copilot per ogni sessione in questo repo, quindi condiviso da
  tutti gli agenti — per questo ci va solo ciò che serve davvero a tutti).
- `.github/instructions/ace-<scope>.instructions.md` (uno per agente/family,
  es. `ace-cook-chef.instructions.md`) → i bullet di scope `agent`/`family`.
  **Non** usano `applyTo` per l'auto-attach: gli agenti di questo team sono
  conversazionali, senza un glob di file affidabile a cui legare
  l'iniezione automatica (a differenza di `write.instructions.md`, che
  cook-writer usa per un caso con un file reale da editare). Iniettare
  tutto in `copilot-instructions.md` metterebbe i bullet di ogni agente
  nel contesto di tutti gli altri (bloating) — separarli per file evita
  lo spreco.
- Ogni file `.github/agents/Cook-*.agent.md` (l'orchestratore
  `Cook-orchestrator` + i 5 subagenti — tutti sotto lo stesso prefisso
  ora) legge esplicitamente il proprio file dedicato con `read_file` come
  primo passo del workflow (aggiunto al corpo del prompt, non al
  playbook — resta un concetto separato, vedi sotto). Non è un'iniezione
  automatica della piattaforma: è un passo scritto nella costituzione
  dell'agente.
- La costituzione di ciascun agente (ruolo/tool/permessi) resta negli
  stessi file `.github/agents/Cook*.agent.md` — concetto separato dal
  playbook ACE, anche se ora contiene anche il passo `read_file` sopra.

La trace del task, in questo scenario, va ricostruita **dopo** la
sessione (dalla cronologia chat/commit), non catturata in streaming da
eventi di lifecycle — a differenza dello scenario "Copilot SDK custom" in
cui l'iniezione e la cattura trace potrebbero avvenire a runtime.

> Se stai leggendo questa sezione per capire come adattare ACE a un altro
> progetto: questa è la parte più specifica alla piattaforma. La versione
> generica in `C:\Users\dquero\ace` tratta questa scelta come un
> parametro di configurazione (`config/project.json`), non come un fatto
> fisso — vedi il suo README per le alternative (es. Claude Code, dove il
> file auto-caricato equivalente è `CLAUDE.md`).

## 6. Il ciclo end-to-end, passo per passo

**Lettura (ogni task):**
1. Retrieval per scope (`global` / `agent` / `family`) + tag interni.
2. Filtro di sicurezza: bullet con `hurt > helped` sopra una soglia minima
   di campioni vengono esclusi immediatamente (quarantena), non solo alla
   prossima potatura batch.
3. Injection: solo `id` + `content` dei bullet superstiti finiscono nei
   file di istruzioni — mai i contatori. Un file per scope (globale in
   `copilot-instructions.md`, uno per agente/family in
   `.github/instructions/ace-*.instructions.md`), non un unico blob
   condiviso, per non far leggere a cook-writer i bullet di cook-chef.

**Scrittura (in batch, non ad ogni task):**
1. Trace: ogni task produce una trace conforme a
   [schema/trace.schema.json](schema/trace.schema.json), salvata in
   [traces/](traces/). Generata **automaticamente** da `Cook-orchestrator` come
   ultimo passo di ogni sessione (`evaluated_by: "cook-auto"`, esito
   auto-valutato senza aver visto la reazione dell'utente — segnale più
   debole di una revisione umana). Il processo manuale in
   [traces/CAPTURE_GUIDE.md](traces/CAPTURE_GUIDE.md) resta come
   fallback/correzione, non più come unico percorso.
2. **Primo passo del reflector, prima di leggere qualunque trace**:
   [scripts/update_counters.js](scripts/update_counters.js) sullo stesso
   batch — contabilità deterministica (non giudizio LLM) che somma
   `playbook_bullets_seen`/`cited` + `outcome.status` delle trace non
   ancora contate e aggiorna `used`/`helped`/`hurt` sui bullet esistenti.
   Ogni trace processata viene marcata con `counted_for_playbook_at` per
   evitare il doppio conteggio — disaccoppiato da quando reflector la
   sposta in `traces/processed/` (due bookkeeping indipendenti). Senza
   questo passo i contatori restano fermi a `0/0/0` per sempre, e il
   filtro di sicurezza del retrieval (`hurt > helped`) non può mai
   scattare. A differenza di `apply_delta.js` non passa dal gate/warden:
   è pura contabilità meccanica su trace già esistenti, non una decisione
   di contenuto.
3. Reflection batch: un LLM reflector ([prompts/reflector.md](prompts/reflector.md))
   legge un batch di trace e produce proposte strutturate in
   [proposals/](proposals/) — non scrive mai direttamente il playbook. Un
   batch è tutto ciò che si trova in [traces/](traces/) (non in
   `traces/processed/`) al momento del run; le trace incluse vengono poi
   spostate in `traces/processed/` per non essere riproposte nel batch
   successivo. Invocato on-demand **o** automaticamente da `Cook-orchestrator` a fine
   sessione se `check_threshold.js reflector` riporta soglia raggiunta
   (vedi [config/thresholds.json](config/thresholds.json) per il valore
   corrente — non ripetuto qui per non disallinearsi se cambia).
4. Curation batch: un LLM curator ([prompts/curator.md](prompts/curator.md))
   legge le proposte ed emette operazioni tipizzate — `ADD`, `UPDATE`,
   `DEPRECATE`, `MERGE`, `PROMOTE`, o `REJECT` — in
   `ace/proposals/<batch>-decisions.json`. Non scrive mai i playbook.
   Invocato on-demand **o** automaticamente dal reflector stesso se il
   batch appena prodotto raggiunge la soglia (default 1 proposta).
5. Gate + merge, in mano all'agente **warden** ([prompts/warden.md](prompts/warden.md)),
   invocato on-demand **o** automaticamente dal curator se il batch di
   decisioni raggiunge la soglia (default 1 decisione) — in ogni caso,
   non più a un umano che lancia comandi a mano:
   - esegue [scripts/gate.js](scripts/gate.js) (controlli meccanici: scope
     valido, ID senza collisioni, evidenza citata verificata contro
     `traces/processed/` — il replay semantico/regressione restano fuori
     dalla portata di uno script deterministico, vedi i limiti dichiarati
     in `gate.js`);
   - si ferma e chiede conferma esplicita all'umano prima del sign-off e
     di nuovo prima di scrivere;
   - solo dopo un sì esplicito esegue [scripts/apply_delta.js](scripts/apply_delta.js),
     che scrive nei playbook e incatena [scripts/retrieval.js](scripts/retrieval.js)
     per risincronizzare `copilot-instructions.md` + `ace-*.instructions.md`,
     poi archivia il batch in `ace/proposals/applied/`.

## 7. Struttura dei file, cartella per cartella

**Playbook** (fuori da `ace/`, alla radice del repo — sono ciò che gli
agenti leggono/citano):
- `playbooks/_global.md` + `playbooks/cook.md` (orchestratore) +
  `playbooks/cook-*.md` (i 5 subagenti) — un file per agente più un file
  globale condiviso (niente file unico con bullet taggati per agente).
  `cook.md` è per lezioni su decisioni che solo l'orchestratore prende
  (es. quali subagenti coinvolgere); `_global.md` per lezioni che servono
  a tutti i subagenti nel proprio dominio di risposta.
- `playbooks/families/` — playbook trasversali per tipo di task (es.
  sous-vide), vuoto finché non emerge un caso reale.
- `playbooks/archive/` — bullet `deprecated` spostati qui da
  `apply_delta.js`, fuori dal contesto servito.

**`ace/schema/`** — contratti dati JSON Schema, scritti per intero (non
contenuto scoperto per esperienza): [bullet.schema.json](schema/bullet.schema.json)
(unità atomica del playbook) e [trace.schema.json](schema/trace.schema.json)
(registrazione di un task).

**`ace/traces/`** — una trace per task/agente (vedi [CAPTURE_GUIDE.md](traces/CAPTURE_GUIDE.md)).
`traces/processed/` = già incluse in un batch reflector. Il campo
`counted_for_playbook_at` (non una sottocartella) marca invece quelle già
passate da `update_counters.js` — le due cose sono disaccoppiate.

**`ace/proposals/`** — output di reflector/curator per batch:
`<batch>.json` (proposte), `<batch>-decisions.json` (operazioni tipizzate),
`<batch>-gate-report.json` (esito gate, incluso `signed_off`).
`proposals/applied/` = batch completamente processati, spostati qui da
`apply_delta.js` dopo aver scritto i playbook.

**`ace/config/thresholds.json`** — soglie editabili per il trigger
automatico di reflector/curator/warden (vedi sopra "invocabili in
catena").

**`ace/prompts/`** — sorgente dei tre agenti che fanno girare il ciclo:
[reflector.md](prompts/reflector.md), [curator.md](prompts/curator.md),
[warden.md](prompts/warden.md). Copiati in `.github/agents/ACE-*.agent.md`
da una GitHub Action a ogni push — editare sempre qui, mai le copie.

**`ace/scripts/`** — tutto deterministico, nessuna chiamata LLM:
- [lib/playbook.js](scripts/lib/playbook.js) — parser/serializzatore del
  formato bullet in markdown, condiviso dagli script sotto.
- [update_counters.js](scripts/update_counters.js) — somma
  `used`/`helped`/`hurt` dalle trace non ancora contate.
- [check_threshold.js](scripts/check_threshold.js) — conteggio per i
  trigger automatici a soglia.
- [gate.js](scripts/gate.js) — controlli meccanici + sign-off umano
  esplicito (mai automatico).
- [apply_delta.js](scripts/apply_delta.js) — unico punto che scrive nei
  playbook; incatena `retrieval.js` alla fine.
- [retrieval.js](scripts/retrieval.js) — filtra ed inietta nei file di
  istruzioni Copilot (`copilot-instructions.md` + `ace-*.instructions.md`).

**Fuori da `ace/`**: [.github/agents/ACE-reflector.agent.md](../.github/agents/ACE-reflector.agent.md),
`ACE-curator.agent.md`, `ACE-warden.agent.md` (copie sincronizzate);
[.github/instructions/ace-*.instructions.md](../.github/instructions/)
(generati da `retrieval.js`); [.github/workflows/sync-agent-prompts.yml](../.github/workflows/sync-agent-prompts.yml).

## 8. Domande frequenti / errori tipici

**"Ho aggiunto una trace ma i contatori del bullet citato non si
muovono."** Hai eseguito `node ace/scripts/update_counters.js`? Non è
automatico ad ogni trace: gira solo come primo passo del reflector (o
manualmente). Controlla anche che la trace non abbia già
`counted_for_playbook_at` impostato (in tal caso è già stata contata).

**"Un bullet che sembrava buono è finito escluso dal contesto senza che
nessuno lo abbia deprecato."** È la quarantena automatica live di
`retrieval.js` (`hurt > helped` sopra `MIN_SAMPLES_FOR_LIVE_EXCLUSION`):
non aspetta il prossimo batch curator. Il suo `status` persistito sul
file resta `active` finché il curator non lo formalizza — è un
disallineamento intenzionale, non un bug. `retrieval.js` persiste queste
esclusioni in `ace/state/live-exclusions.json` ad ogni run reale, e il
curator le legge e decide (DEPRECATE o nessuna azione) ad ogni suo run —
vedi [curator.md](prompts/curator.md), sezione "Input".

**"Perché reflector/curator non scrivono mai i playbook direttamente?"**
Perché ogni fase che *decide* contenuto (non solo conta o valida
struttura) deve restare separata da quella che *scrive su disco* — è
`apply_delta.js`, invocato solo da warden dopo sign-off umano, l'unico
punto che tocca `playbooks/*.md`. Vedi [sezione 4](#4-i-tre-agenti-del-ciclo-reflector-curator-warden).

**"Posso saltare warden e lanciare `apply_delta.js` a mano?"** Tecnicamente
sì (sono script CLI), ma perdi il controllo meccanico del gate e la
conferma umana esplicita — usa questa via solo per debug/emergenza
consapevole, non come flusso normale.

**"Un ID `P-XXX` è stato archiviato (deprecated): posso riusarlo per un
bullet nuovo?"** No — vedi [sezione 3](#3-anatomia-di-un-bullet--e-cosa-significa-p-in-p-xxx):
il contatore è unico su tutto il progetto, incluso `playbooks/archive/`,
e non torna mai in circolazione.
