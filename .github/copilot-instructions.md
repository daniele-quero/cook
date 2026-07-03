# Copilot Instructions — cook workspace

## Skill obbligatorie per operazioni Notion

Per i dettagli sull'integrazione Notion (script, parent ID, sicurezza) vedi [AGENTS.md](../AGENTS.md).

Regola aggiuntiva per Copilot: ogni volta che una richiesta include termini come
"pubblica su Notion", "aggiorna su Notion", "sync Notion" o equivalenti,
**leggi sempre la skill corrispondente con `read_file` prima di eseguire qualsiasi comando**:

| Operazione | Skill da caricare |
|------------|-------------------|
| Pubblicare / aggiornare una ricetta | `c:\Users\dquero\cook\.github\skills\notion-recipes-sync\SKILL.md` |
| Leggere / ispezionare lo stato | `c:\Users\dquero\cook\.github\skills\notion-recipes-read\SKILL.md` |
| Smoke-test dell'integrazione | `c:\Users\dquero\cook\.github\skills\notion-recipes-smoketest\SKILL.md` |

La skill può contenere logica aggiornata (routing, dry-run obbligatorio, gestione errori)
che AGENTS.md non ha. Non bypassarla.
