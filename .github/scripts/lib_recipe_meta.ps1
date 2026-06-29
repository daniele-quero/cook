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
        if ($result.Temperatura -or $result.Tempo) {
            $result.Source = 'frontmatter'
            return [hashtable]$result
        }
    }

    if ([string]::IsNullOrEmpty($Content)) { return [hashtable]$result }

    $lines = ($Content -replace "`r`n", "`n").Split("`n")

    foreach ($line in $lines) {
        if ($line -notmatch '^\s*\|.*\|\s*$') { continue }
        $cells = @($line.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
        $allSep = $true
        foreach ($c in $cells) { if ($c -notmatch '^:?-{2,}:?$') { $allSep = $false; break } }
        if ($allSep) { continue }

        $tempCell = $null
        $timeCell = $null
        foreach ($cell in $cells) {
            if (-not $tempCell -and $cell -match '\d+\s*°?\s*C\b') { $tempCell = $cell; continue }
            if (-not $timeCell -and $cell -match '\d+\s*(min|minuti|h|ore|sec|secondi|s)\b') { $timeCell = $cell }
        }
        if ($tempCell -and $timeCell) {
            $result.Temperatura = $tempCell
            $result.Tempo = $timeCell
            $result.Source = 'table'
            return [hashtable]$result
        }
    }

    foreach ($line in $lines) {
        if (-not $result.Temperatura) {
            if ($line -match '(?i)\*{0,2}Temperatura\*{0,2}\s*[:=]\s*([^\n<]+?)(?:\*\*|\s*<br|$)') {
                $result.Temperatura = $Matches[1].Trim().TrimEnd('*').Trim()
            }
        }
        if (-not $result.Tempo) {
            if ($line -match '(?i)\*{0,2}Tempo\*{0,2}\s*[:=]\s*([^\n<]+?)(?:\*\*|\s*<br|$)') {
                $result.Tempo = $Matches[1].Trim().TrimEnd('*').Trim()
            }
        }
        if ($result.Temperatura -and $result.Tempo) { break }
    }

    if ($result.Temperatura -or $result.Tempo) {
        $result.Source = 'inline'
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
