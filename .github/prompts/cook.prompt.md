---
description: 'Risponde a domande culinarie ragionando come un team interdisciplinare'
agent: "Cook"
tools: [agent]
---

Se non viene fornito alcun prompt testuale al comando `/cook`, basati sul contesto della chat (messaggi precedenti) per determinare la richiesta implicita e rispondi di conseguenza. Se è presente invece un prompt, rispondi direttamente a quello.

**Regola Notion:** se la richiesta menziona "aggiorna su Notion", "pubblica su Notion" o simili,
leggi **sempre** la skill `c:\Users\dquero\cook\.github\skills\notion-recipes-sync\SKILL.md`
con `read_file` prima di eseguire qualsiasi operazione.

${input:Cosa vuoi sapere?}
