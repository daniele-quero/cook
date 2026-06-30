<#
.SYNOPSIS
    Helper specifici per le ricette: rilevamento sous-vide ed estrazione di
    Tempo/Temperatura da frontmatter, tabelle o righe inline; emissione del
    callout di recap.

.DESCRIPTION
    Dipende da lib_markdown_to_notion.ps1 (ConvertTo-NotionRichText) e
    lib_notion_common.ps1 (Split-RichTextContent) per il rich_text del callout.
    Nessun side-effect su dot-source.
#>

function Test-IsSousVideRecipe {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$FileName,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Content
    )
    $pattern = '(?i)sous[-_\s]?vide'
    if ($FileName -match $pattern) { return $true }
    if ($Content -match $pattern) { return $true }
    return $false
}

function Get-RecipeTempoTemperatura {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Content,
        [hashtable]$Frontmatter = @{}
    )

    $result = [ordered]@{
        Temperatura = $null
        Tempo       = $null
        Effect      = $null
        Source      = 'none'
    }

    if ($Frontmatter -and $Frontmatter.Count -gt 0) {
        $fm = @{}
        foreach ($k in $Frontmatter.Keys) {
            $fm[$k.ToString().ToLowerInvariant()] = $Frontmatter[$k]
        }
        if ($fm.ContainsKey('temperatura') -and $null -ne $fm['temperatura']) {
            $result.Temperatura = [string]$fm['temperatura']
        }
        if ($fm.ContainsKey('tempo') -and $null -ne $fm['tempo']) {
            $result.Tempo = [string]$fm['tempo']
        }
        foreach ($effectKey in @('effect', 'effetto', 'risultato')) {
            if ($fm.ContainsKey($effectKey) -and $null -ne $fm[$effectKey]) {
                $ev = [string]$fm[$effectKey]
                if (-not [string]::IsNullOrWhiteSpace($ev)) { $result.Effect = $ev.Trim(); break }
            }
        }
        if ($result.Temperatura -or $result.Tempo -or $result.Effect) {
            $result.Source = 'frontmatter'
        }
    }

    if (-not [string]::IsNullOrEmpty($Content)) {
        $lines = ($Content -replace "`r`n", "`n").Split("`n")

        # Pass 1: try to find a table with Temp/Time (and capture Effect column if present)
        if (-not ($result.Temperatura -and $result.Tempo)) {
            $headerCells = $null
            $effectColIdx = -1
            for ($i = 0; $i -lt $lines.Length; $i++) {
                $line = $lines[$i]
                if ($line -notmatch '^\s*\|.*\|\s*$') { $headerCells = $null; $effectColIdx = -1; continue }
                $cells = @($line.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
                $allSep = $true
                foreach ($c in $cells) { if ($c -notmatch '^:?-{2,}:?$') { $allSep = $false; break } }
                if ($allSep) { continue }

                if ($null -eq $headerCells) {
                    $headerCells = $cells
                    for ($j = 0; $j -lt $cells.Length; $j++) {
                        if ($cells[$j] -match '(?i)^(effetto|risultato|texture|effect)\b') { $effectColIdx = $j; break }
                    }
                    continue
                }

                $tempCell = $null
                $timeCell = $null
                foreach ($cell in $cells) {
                    if (-not $tempCell -and $cell -match '\d+\s*°?\s*C\b') { $tempCell = $cell; continue }
                    if (-not $timeCell -and $cell -match '\d+\s*(min|minuti|h|ore|sec|secondi|s)\b') { $timeCell = $cell }
                }
                if ($tempCell -and $timeCell) {
                    if (-not $result.Temperatura) { $result.Temperatura = $tempCell }
                    if (-not $result.Tempo) { $result.Tempo = $timeCell }
                    if (-not $result.Effect -and $effectColIdx -ge 0 -and $effectColIdx -lt $cells.Length) {
                        $ev = $cells[$effectColIdx]
                        if (-not [string]::IsNullOrWhiteSpace($ev)) { $result.Effect = $ev }
                    }
                    if ($result.Source -eq 'none') { $result.Source = 'table' }
                    break
                }
            }
        }

        # Pass 2: inline "Temperatura:" / "Tempo:" / "Effetto:" lines.
        # Accept optional qualifier words (es. "Temperatura bagno:", "Tempo cottura:").
        foreach ($line in $lines) {
            if (-not $result.Temperatura) {
                if ($line -match '(?i)\*{0,2}Temperatura(?:\s+[A-Za-zÀ-ÿ\-]+){0,3}\*{0,2}\s*[:=]\s*([^\n<]+?)(?:\*\*|\s*<br|$)') {
                    $result.Temperatura = $Matches[1].Trim().TrimEnd('*').Trim()
                }
            }
            if (-not $result.Tempo) {
                if ($line -match '(?i)\*{0,2}Tempo(?:\s+[A-Za-zÀ-ÿ\-]+){0,3}\*{0,2}\s*[:=]\s*([^\n<]+?)(?:\*\*|\s*<br|$)') {
                    $result.Tempo = $Matches[1].Trim().TrimEnd('*').Trim()
                }
            }
            if (-not $result.Effect) {
                if ($line -match '(?i)\*{0,2}(Effetto|Risultato|Effect|Texture)(?:\s+[A-Za-zÀ-ÿ\-]+){0,3}\*{0,2}\s*[:=]\s*([^\n<]+?)(?:\*\*|\s*<br|$)') {
                    $result.Effect = $Matches[2].Trim().TrimEnd('*').Trim()
                }
            }
            if ($result.Temperatura -and $result.Tempo -and $result.Effect) { break }
        }

        # Pass 3 (Effect only): take the first non-empty line following a heading
        # like "Segni di riuscita" / "Risultato finale" / "Texture finale".
        if (-not $result.Effect) {
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match '(?i)^\s*#{1,6}\s*(Segni di riuscita|Risultato(?:\s+finale)?|Texture(?:\s+finale)?|Effetto|Effect)\s*$') {
                    for ($j = $i + 1; $j -lt [Math]::Min($lines.Length, $i + 8); $j++) {
                        $raw = $lines[$j]
                        $clean = ($raw -replace '^\s*[-*+]\s*', '').Trim().TrimStart('>').Trim()
                        if ([string]::IsNullOrWhiteSpace($clean)) { continue }
                        if ($clean -match '^#{1,6}\s') { break }
                        # strip surrounding bold markers
                        $clean = $clean -replace '^\*\*(.+)\*\*$', '$1'
                        if ($clean.Length -gt 250) { $clean = $clean.Substring(0, 247) + '...' }
                        $result.Effect = $clean
                        break
                    }
                    if ($result.Effect) { break }
                }
            }
        }

        if ($result.Source -eq 'none' -and ($result.Temperatura -or $result.Tempo -or $result.Effect)) {
            $result.Source = 'inline'
        }
    }

    return [hashtable]$result
}

function New-SousVideRecapBlock {
    param(
        [AllowEmptyString()][string]$Tempo,
        [AllowEmptyString()][string]$Temperatura
    )

    $temp = if ([string]::IsNullOrWhiteSpace($Temperatura)) { 'n/d' } else { $Temperatura.Trim() }
    $time = if ([string]::IsNullOrWhiteSpace($Tempo)) { 'n/d' } else { $Tempo.Trim() }

    $content = "Sous-vide · Temperatura: $temp · Tempo: $time"

    $rich = @()
    foreach ($seg in (Split-RichTextContent -Text $content)) {
        $rich += @{ type = 'text'; text = @{ content = $seg } }
    }

    return @{
        object  = 'block'
        type    = 'callout'
        callout = @{
            icon      = @{ type = 'emoji'; emoji = '🌡️' }
            color     = 'default'
            rich_text = $rich
        }
    }
}
