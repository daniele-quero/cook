---
name: notion-recipes-sync
description: |
  Pubblica un file Markdown locale di ricetta come pagina Notion sotto il
  parent corretto: database `Recipes` (default) oppure pagina `Sous Vide`
  (auto-rilevato da nome file o contenuto). Supporta dry-run, create,
  update e routing override via `-ParentPageId`.
---

# notion-recipes-sync

Sincronizza un singolo Markdown locale come pagina Notion. Discrimina
automaticamente tra ricette sous-vide e ricette normali e instrada al parent
appropriato. Renderizza heading, paragrafi (bold/italic/code/link), liste,
quote, divider, tabelle e code fence. Per le ricette sous-vide aggiunge in
testa un blocco callout con Temperatura e Tempo.

> **Importante — sicurezza**
> - Lo script è **read-only** sui file `.md` locali: non li modifica mai.
> - Le sezioni `Sicurezza Alimentare` presenti nelle pagine Notion **non**
>   vengono editate automaticamente da questo flusso.
> - Usa sempre `-DryRun` come primo passo per validare titolo, parent e
>   primo blocco prima di scrivere.
> - Per rinfrescare una ricetta già pubblicata usa `-Update` (archivia i
>   blocchi esistenti e ne riscrive il contenuto).

## Prerequisiti

- PowerShell 7 (`C:\Program Files\PowerShell\7\pwsh.exe`).
- `RECIPES_NOTION_TOKEN` (User o Process scope) con accesso a entrambi i parent.
- Script richiesti:
  - `.github/scripts/sync_recipe_page.ps1` — singolo file.
  - `.github/scripts/sync_all_recipes.ps1` — batch su una cartella.
- Libreria di supporto: `lib_notion_common.ps1`, `lib_markdown_to_notion.ps1`,
  `lib_recipe_meta.ps1` (già dot-source dagli script).

## Mappatura schema database principale (live)

Il parent principale `3a77524302b94298b7ce1f4155bd9571` è il database
`Recipes` con queste properties:

| Property      | Tipo          | Sorgente nel Markdown                       |
|---------------|---------------|---------------------------------------------|
| `Name`        | title         | H1 del file o `title:` nel frontmatter      |
| `Tags`        | multi_select  | `tags:` nel frontmatter (+ `sous-vide` auto)|
| `Ingredienti` | multi_select  | `ingredienti:` nel frontmatter              |
| `Strumenti`   | multi_select  | `strumenti:` nel frontmatter                |

Il parent sous-vide `1ae2a470ad5d8073bc02c9d0f47396a0` è una **pagina**
(non un database): le ricette sous-vide diventano sue sotto-pagine, senza
properties multi_select.

## Procedura

1. **Carica il token** se necessario:
   ```powershell
   if (-not $env:RECIPES_NOTION_TOKEN) {
     $env:RECIPES_NOTION_TOKEN = [Environment]::GetEnvironmentVariable('RECIPES_NOTION_TOKEN','User')
   }
   ```
2. **Dry-run** sul file target — verifica parent id, parent kind, primo blocco
   e (per database) il dizionario `properties` pianificato:
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -DryRun -MarkdownFile '.\<nome-ricetta>.md'
   ```
3. **Esegui la sync** vera (create se non esiste, skip se esiste già):
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -MarkdownFile '.\<nome-ricetta>.md'
   ```
4. **Aggiorna** una pagina esistente (archivia i blocchi e riscrive contenuto +
   icona + properties):
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -Update -MarkdownFile '.\<nome-ricetta>.md'
   ```
5. **Batch** su tutta la cartella `cook` (ignora `AGENTS.md` e `.github/`):
   ```powershell
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_all_recipes.ps1' -DryRun
   & 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_all_recipes.ps1' -ContinueOnError
   ```

## Invocazione

```powershell
# Override parent (es. test in una pagina sandbox):
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -MarkdownFile '.\salmone-sous-vide.md' -ParentPageId '<uuid>'

# Icona custom:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -MarkdownFile '.\pesto-rucola-frutta-secca.md' -Icon '🥬'

# Forza update su match esistente:
& 'C:\Program Files\PowerShell\7\pwsh.exe' -NoProfile -File '.\.github\scripts\sync_recipe_page.ps1' -ForceUpdate -MarkdownFile '.\carote-sous-vide.md'
```

## Quando NON usare questa skill

- Per leggere lo stato dei parent senza scrivere: usa `notion-recipes-read`.
- Per validare end-to-end (unit + live) le librerie e gli script: usa
  `notion-recipes-smoketest`.
- Per modificare manualmente sezioni `Sicurezza Alimentare` di una pagina
  esistente: editare a mano in Notion (questo flusso archivia *tutti* i
  blocchi in `-Update`).
