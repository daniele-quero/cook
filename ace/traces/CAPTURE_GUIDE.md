# Come catturare una trace

**Automatico dal workflow di `Cook-orchestrator`**: l'orchestratore ora
genera da solo le trace di ogni sessione come ultimo passo (vedi step 8
in [Cook-orchestrator.agent.md](../../.github/agents/Cook-orchestrator.agent.md)),
usando `edit`
subito dopo aver risposto — non c'è un hook di lifecycle nativo a cui
agganciarsi in questo scenario (chat interattiva VS Code), quindi
l'automazione è un passo scritto esplicitamente nel prompt
dell'orchestratore, non una funzione della piattaforma. Limite noto:
l'esito (`outcome`) è auto-valutato subito dopo la risposta, **senza**
aver visto un'eventuale reazione successiva dell'utente — per questo
queste trace portano `evaluated_by: "cook-auto"`, un segnale più debole
di una valutazione umana a posteriori. Il reflector deve pesarle di
conseguenza.

Il resto di questa guida resta valido come **processo manuale di
fallback/correzione**: usalo se una trace auto-generata manca, è
incompleta, o se vuoi correggere `outcome` con il senno di poi dopo aver
visto come l'utente ha reagito (in quel caso, sovrascrivi il file con
`evaluated_by: "manual"` e la valutazione più informata) — non aspettare,
i dettagli si perdono in fretta.

## Quando

Dopo ogni sessione Cook completa (risposta in chat + eventuale salvataggio
di cook-writer + commit/push), prima di passare al
task successivo non correlato.

## Granularità: una trace per agente coinvolto

Il campo `agent` in [trace.schema.json](../schema/trace.schema.json) è
singolare: se la sessione ha coinvolto più subagenti (es. cook-chef +
cook-biosafety + cook-writer), crea **una trace per ciascun subagente
effettivamente coinvolto**, più eventualmente una per `cook-orchestrator` se vuoi
valutare anche l'orchestrazione stessa (scelta dei subagenti, coerenza
finale). Usa lo **stesso `task_id`** per tutte le trace della stessa
sessione, così il reflector può correlarle in fase di batch.

## Dove salvarle

`ace/traces/<task_id>__<agent>.json`, es.
`ace/traces/2026-08-07-conservazione-uova__cook-biosafety.json`.

## Come compilare i campi

- **task_id**: slug leggibile, es. `data-ISO + 2-3 parole della richiesta`.
- **agent**: il subagente (o `cook-orchestrator` per l'orchestratore) a cui questa
  trace si riferisce.
- **started_at / ended_at**: orari approssimativi della sessione, dai
  timestamp della chat.
- **request_summary**: parafrasi in una riga della richiesta originale
  dell'utente (non incollare l'intera conversazione).
- **playbook_bullets_seen / playbook_bullets_cited**: array vuoti finché
  i playbook restano vuoti — non c'è nulla da citare. Popolali solo
  quando esisteranno bullet reali nel contesto servito.
- **actions**: sintesi delle azioni rilevanti (non il transcript
  verbatim) — es. "cook-chef ha proposto tecnica X", "cook-writer ha
  salvato recipes/nome.md".
- **outcome.status**: `success` / `partial` / `failure`, in base a
  com'è andata realmente (l'utente ha corretto qualcosa? il file è stato
  salvato senza errori? l'informazione era accurata?).
- **outcome.evaluated_by**: per ora `"manual"` — non esiste ancora un
  reflector o un gate automatico che lo determini.
- **notes**: qualunque osservazione libera utile al reflector futuro
  (es. "cook-chemist e cook-physicist hanno dato indicazioni di
  temperatura leggermente diverse, riconciliate manualmente dall'utente").

## Esempio di struttura (placeholder, NON dati reali)

```json
{
  "task_id": "2026-08-07-esempio",
  "agent": "cook-biosafety",
  "started_at": "2026-08-07T12:00:00Z",
  "ended_at": "2026-08-07T12:05:00Z",
  "request_summary": "<parafrasi della richiesta utente>",
  "playbook_bullets_seen": [],
  "playbook_bullets_cited": [],
  "actions": [
    { "description": "<azione rilevante>", "tool": "<tool usato, se noto>" }
  ],
  "outcome": {
    "status": "success",
    "evaluated_by": "manual",
    "detail": "<perché è andata bene o male>"
  },
  "notes": "<osservazioni libere>"
}
```

Questo file è un template di processo, non un esempio di lezione: non
contiene bullet né dati inventati sul dominio culinario.
