<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->

## Lezioni operative ACE per `cook-writer`

Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/cook-writer.md`. Non auto-iniettato da Copilot: va letto esplicitamente con `read_file` (vedi il passo dedicato nel workflow dell'agente). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. `[P-002]`).

- **[P-007]** Non dichiarare mai che un file ricetta appena creato o modificato è stato 'verificato senza errori' se non hai effettivamente eseguito un tool di lint/build: non hai accesso al tool shell. Dichiara sempre esplicitamente che la validazione lint/build è delegata all'orchestratore, invece di implicare una verifica che non hai potuto fare.

<!-- ACE:END -->
