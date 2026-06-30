---
name: notion-recipes-read
description: |
  Legge i parent Notion configurati per le ricette (un database principale e
  una pagina "Sous Vide" con sotto-pagine) e ne riassume titolo, tipo,
  proprietà e figli. Usa quando vuoi ispezionare lo stato corrente di Notion
  prima/dopo una sincronizzazione di file Markdown.
---

# notion-recipes-read

Riassume in modo non distruttivo lo stato dei parent Notion configurati per le
ricette. Non scrive nulla, non logga mai il token, ed è la skill consigliata
come primo passo per qualunque operazione di troubleshooting.

## Prerequisiti

- PowerShell 7 (`C:\Program Files\PowerShell\7\pwsh.exe`).
- Variabile d'ambiente `RECIPES_NOTION_TOKEN` (User o Process scope).
  L'integrazione Notion deve avere accesso a entrambi i parent.
- Script richiesto: `.github/scripts/read_notion_recipes.ps1`.

## Procedura

1. **Carica il token nello shell corrente** (solo se non già presente):
   ```powershell
   if (-not $env:RECIPES_NOTION_TOKEN) {
     $env:RECIPES_NOTION_TOKEN = [Environment]::GetEnvironmentVariable('RECIPES_NOTION_TOKEN','User')
   }
   ```
2. **Lancia la lettura** dei due parent di default:
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\read_notion_recipes.ps1' -AsJson
   ```
3. **Interpreta il risultato**:
   - Il parent **principale** (`3a77524302b94298b7ce1f4155bd9571`) è un **database**
     chiamato `Recipes` con properties:
     - `Name` (title)
     - `Tags` (multi_select)
     - `Ingredienti` (multi_select)
     - `Strumenti` (multi_select)
   - Il parent **sous-vide** (`1ae2a470ad5d8073bc02c9d0f47396a0`) è una **pagina**
     contenitore. Al suo interno c'è il database `Sous Vide Chart`
     (`1ae2a470ad5d80f4ad16ebd8a84e3d70`) con properties:
     - `Food` (title)
     - `Temp °C` (rich_text)
     - `Time` (rich_text)
     - `Effect` (rich_text)
     Le ricette sous-vide vengono pubblicate come righe di questo DB. Per
     ispezionarlo direttamente:
     ```powershell
     & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\read_notion_recipes.ps1' -Id '1ae2a470-ad5d-80f4-ad16-ebd8a84e3d70' -AsJson
     ```
4. **Se vuoi salvare su file**: aggiungi `-OutFile recipes-state.json`.
5. **Se vuoi un id diverso**: passa `-Id <id1>,<id2>`.

## Invocazione

```powershell
# Lista compatta a console:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\read_notion_recipes.ps1'

# JSON completo (consigliato per parsing automatico):
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\read_notion_recipes.ps1' -AsJson

# Dump su file:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\read_notion_recipes.ps1' -OutFile '.\recipes-state.json'
```

## Quando NON usare questa skill

- Per creare/aggiornare pagine: usa `notion-recipes-sync`.
- Per validare end-to-end l'integrazione: usa `notion-recipes-smoketest`.
- Per ispezionare blocchi di una pagina figlia specifica: chiama direttamente
  `GET /v1/blocks/{id}/children` via REST API.
