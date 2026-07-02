# Copilot Instructions — cook workspace

## Skill obbligatorie per operazioni Notion

Ogni volta che una richiesta include termini come "pubblica su Notion", "aggiorna su Notion",
"aggiorna notion", "sync Notion" o equivalenti, **devi** leggere la skill corrispondente
prima di procedere:

| Operazione | Skill da caricare |
|------------|-------------------|
| Pubblicare / aggiornare una ricetta su Notion | `c:\Users\dquero\cook\.github\skills\notion-recipes-sync\SKILL.md` |
| Leggere / ispezionare lo stato di Notion | `c:\Users\dquero\cook\.github\skills\notion-recipes-read\SKILL.md` |
| Eseguire smoke-test dell'integrazione | `c:\Users\dquero\cook\.github\skills\notion-recipes-smoketest\SKILL.md` |

Usa `read_file` sulla skill prima di eseguire qualsiasi comando PowerShell Notion-correlato.
Non fare affidamento esclusivo su AGENTS.md per i comandi: la skill può contenere
logica aggiornata (routing, dry-run obbligatorio, gestione errori) che AGENTS.md non ha.
