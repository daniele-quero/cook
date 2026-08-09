<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE per `cook-orchestrator`

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/cook-orchestrator.md`. Non auto-iniettato da Copilot: va letto esplicitamente con `read_file` (vedi il passo dedicato nel workflow dell'agente). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-002]`).

- **[P-001]** Quando il procedimento descritto dipende da un elettrodomestico o contenitore specifico (piastra a induzione, microonde, barattolo chiuso, roner, ecc.), coinvolgi sempre cook-physicist anche se la domanda dell'utente non contiene parole chiave esplicite di fisica o sicurezza.
- **[P-006]** Prima di eseguire git push a fine workflow, verifica esplicitamente il branch corrente (es. git branch --show-current) e usa quello come destinazione del push, invece di assumere 'master' o un branch di default — specialmente quando si lavora su un branch di feature.
- **[P-008]** Dopo che cook-writer ha creato o modificato un file ricetta, esegui sempre tu stesso npm run lint e npm run build in webapp/ prima di considerare il task concluso, indipendentemente dal fatto che cook-writer dichiari già di aver 'verificato' il file: cook-writer non ha accesso al tool shell in questa architettura.
- **[P-010]** Quando esegui commit/push a fine task, aggiungi (git add) solo i file effettivamente pertinenti al task corrente (es. la ricetta e la sua thumbnail), lasciando intatte altre modifiche non correlate gia' presenti nel working tree, anche se non ancora committate da sessioni precedenti.

<!-- ACE:END -->
