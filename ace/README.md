# ACE — Agentic Context Engineering per il team Cook

Questo documento riassume il ciclo end-to-end del sistema ACE che accumula
lezioni operative per il team Cook (orchestratore `Cook-orchestrator` + subagenti
`cook-chef`, `cook-chemist`, `cook-biosafety`, `cook-physicist`,
`cook-writer`, definiti in [.github/agents/](../.github/agents/)) e per i
tre agenti che fanno girare il ciclo stesso (`ACE-reflector`,
`ACE-curator`, `ACE-warden`, stesso posto, prefisso diverso — vedi
sotto). Il ciclo è interamente implementato ed end-to-end funzionante:
schema, playbook, script deterministici, agenti Copilot e trigger a
soglia configurabili sono tutti reali, non solo scaffold.

## Scenario Copilot confermato

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

La trace del task, in questo scenario, va ricostruita **dopo** la sessione
(dalla cronologia chat/commit), non catturata in streaming da eventi di
lifecycle — a differenza dello scenario "Copilot SDK custom" in cui
l'iniezione e la cattura trace potrebbero avvenire a runtime.

### Reflector, curator e warden come agenti Copilot reali

A differenza dei 5 subagenti culinari, reflector/curator/warden non
appartengono al team culinario — non hanno un dominio (cucina, chimica,
...), esistono solo per far girare il ciclo ACE. Per essere raggiungibili
da Copilot devono comunque vivere in `.github/agents/`, ma con prefisso
**`ACE`** invece di `Cook` (`ACE-reflector.agent.md`,
`ACE-curator.agent.md`, `ACE-warden.agent.md`) e il frontmatter richiesto
(description/model/tools/user-invocable).

Sono comunque **invocabili in catena**, con soglie configurabili in
[config/thresholds.json](config/thresholds.json) e un
conteggio deterministico in
[scripts/check_threshold.js](scripts/check_threshold.js)
(mai l'LLM che "sente" quante trace/proposte/decisioni ci sono — sempre
un conteggio esatto su file reali): `Cook-orchestrator` può invocare `ACE-reflector` a
fine sessione se ci sono abbastanza trace nuove, `ACE-reflector` può
invocare `ACE-curator` se il batch appena prodotto ha abbastanza
proposte, `ACE-curator` può invocare `ACE-warden` se ha abbastanza
decisioni. **L'invocazione on-demand resta sempre possibile** in
qualunque punto della catena, soglia raggiunta o no — l'automazione
aggiunge un trigger, non lo sostituisce.

Reflector e curator producono solo JSON (proposte, decisioni): non hanno
bisogno di eseguire comandi shell oltre a `check_threshold.js`. **Warden**
è diverso — il suo compito è proprio eseguire `ace/scripts/gate.js` (il
controllo "gate") e `ace/scripts/apply_delta.js` per conto dell'umano,
quindi ha in dotazione strumenti di esecuzione shell più estesi
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
`ace/prompts/`, non le destinazioni, per evitare loop. Va sempre editato
il file sorgente, mai la copia in `.github/agents/`.

## Ciclo end-to-end

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
2. **Prima del reflector**, esegui [scripts/update_counters.js](scripts/update_counters.js)
   sullo stesso batch: contabilità deterministica (non giudizio LLM) che
   somma `playbook_bullets_seen`/`cited` + `outcome.status` delle trace
   non ancora contate e aggiorna `used`/`helped`/`hurt` sui bullet
   esistenti. Ogni trace processata viene marcata con
   `counted_for_playbook_at` per evitare il doppio conteggio — disaccoppiato
   da quando reflector la sposta in `traces/processed/` (due bookkeeping
   indipendenti). Senza questo passo i contatori restano fermi a `0/0/0`
   per sempre, e il filtro di sicurezza del retrieval (`hurt > helped`)
   non può mai scattare.
3. Reflection batch: un LLM reflector ([prompts/reflector.md](prompts/reflector.md))
   legge un batch di trace e produce proposte strutturate in
   [proposals/](proposals/) — non scrive mai direttamente il playbook. Un
   batch è tutto ciò che si trova in [traces/](traces/) (non in
   `traces/processed/`) al momento del run; le trace incluse vengono poi
   spostate in `traces/processed/` per non essere riproposte nel batch
   successivo. Invocato on-demand **o** automaticamente da `Cook-orchestrator` a fine
   sessione se `check_threshold.js reflector` riporta soglia raggiunta
   (default 3 trace non processate, vedi [config/thresholds.json](config/thresholds.json)).
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

## Struttura

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
