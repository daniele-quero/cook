---
name: notion-recipes-smoketest
description: |
  Esegue lo smoke-test dell'integrazione Notion per le ricette: test di
  unit puri (lib_*), lettura live dei parent, dry-run sui file campione e
  (opzionale) ciclo live di create + archive su entrambi i parent +
  test di idempotenza con `-Update`.
---

# notion-recipes-smoketest

Verifica end-to-end che lo stack Notion (lib + script di read/sync) sia in
salute. Tutti i risultati sono emessi come `[PASS]`/`[FAIL]`/`[SKIP]` con
una `SUMMARY` finale; l'exit code è il numero di test falliti (max 255).

Lo smoke-test **non scrive mai** in pagine al di fuori dei due parent
configurati, e ogni pagina creata in modalità `-Live` viene archiviata
in un blocco `finally`. Il token non viene mai stampato.

## Prerequisiti

- PowerShell 7 (`C:\Program Files\PowerShell\7\pwsh.exe`).
- `RECIPES_NOTION_TOKEN` (User o Process scope) — viene caricato
  automaticamente da User scope se mancante nel Process.
- Script disponibili:
  - `.github/scripts/smoke_test_notion.ps1` — singola esecuzione.
  - `.github/scripts/smoke_test_loop.ps1` — loop con retry e log.
- File campione richiesti (già nel workspace):
  - `salmone-sous-vide.md`
  - `pesto-rucola-frutta-secca.md`

## Procedura

1. **Carica il token** se non già presente:
   ```powershell
   if (-not $env:RECIPES_NOTION_TOKEN) {
     $env:RECIPES_NOTION_TOKEN = [Environment]::GetEnvironmentVariable('RECIPES_NOTION_TOKEN','User')
   }
   ```
2. **Run rapido (no live writes)** — solo unit, read, dry-run:
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_notion.ps1'
   ```
3. **Run completo (live)** — include create+archive su entrambi i parent +
   idempotenza:
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_notion.ps1' -Live
   ```
4. **Loop con retry** (fino a 5 iterazioni di default, log in
   `.github/scripts/.smoke-logs/`):
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_loop.ps1' -Live -MaxIterations 5
   # oppure stop al primo fallimento:
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_loop.ps1' -Live -FailFast
   ```
5. **Verifica post-run**: dopo un run `-Live` rilancia `notion-recipes-read`
   e controlla che nessuna pagina con prefisso `__smoketest__` o
   `__smoketest_idem__` compaia tra i children dei parent.

## Invocazione

```powershell
# Solo offline:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_notion.ps1'

# Live con loop (consigliato in CI / pre-release):
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\smoke_test_loop.ps1' -Live -MaxIterations 2
```

## Quando NON usare questa skill

- Per pubblicare/aggiornare una ricetta specifica: usa `notion-recipes-sync`.
- Per ispezionare lo stato dei parent senza eseguire test: usa
  `notion-recipes-read`.
- Per debug ad-hoc di singoli endpoint Notion: chiama direttamente la REST
  API tramite `Invoke-NotionApi` (vedi `lib_notion_common.ps1`).
