<#
.SYNOPSIS
    Esegue sync_recipe_page.ps1 su tutti i file Markdown di una cartella
    (top-level), aggregando i risultati.
#>
[CmdletBinding()]
param(
    [string]$Path = 'c:\Users\dquero\cook',
    [string]$Filter = '*.md',
    [switch]$Update,
    [switch]$DryRun,
    [switch]$ContinueOnError
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
    Write-Error "Cartella non trovata: $Path"
    exit 2
}

$syncScript = Join-Path $PSScriptRoot 'sync_recipe_page.ps1'
if (-not (Test-Path -LiteralPath $syncScript)) {
    Write-Error "Script non trovato: $syncScript"
    exit 2
}

$files = Get-ChildItem -LiteralPath $Path -Filter $Filter -File |
Where-Object {
    $_.Name -ne 'AGENTS.md' -and ($_.FullName -notmatch '[\\/]\.github[\\/]')
}

$created = 0
$updated = 0
$skipped = 0
$planned = 0
$failed = New-Object System.Collections.ArrayList

$passArgs = @{}
if ($Update) { $passArgs['Update'] = $true }
if ($DryRun) { $passArgs['DryRun'] = $true }

foreach ($f in $files) {
    $tag = $null
    $err = $null
    try {
        $out = & $syncScript -MarkdownFile $f.FullName @passArgs *>&1
        foreach ($line in $out) { Write-Host $line }
        $lc = $LASTEXITCODE
        if ($null -eq $lc) { $lc = 0 }
        if ($lc -ne 0) {
            $err = "exit $lc"
        }
        else {
            $joined = ($out | Out-String)
            if ($joined -match '\[CREATE\]') { $tag = 'CREATE' }
            elseif ($joined -match '\[UPDATE\]') { $tag = 'UPDATE' }
            elseif ($joined -match '\[SKIP\]') { $tag = 'SKIP' }
        }
    }
    catch {
        $err = $_.Exception.Message
    }

    if ($err) {
        [void]$failed.Add([ordered]@{ file = $f.FullName; error = $err })
        if (-not $ContinueOnError) { break }
        continue
    }

    if ($DryRun) {
        $planned++
    }
    else {
        switch ($tag) {
            'CREATE' { $created++ }
            'UPDATE' { $updated++ }
            'SKIP' { $skipped++ }
            default { $skipped++ }
        }
    }
}

Write-Host ''
Write-Host '==================== SUMMARY ===================='
Write-Host ("Files processed : {0}" -f $files.Count)
if ($DryRun) {
    Write-Host ("Planned         : {0}" -f $planned)
}
else {
    Write-Host ("Created         : {0}" -f $created)
    Write-Host ("Updated         : {0}" -f $updated)
    Write-Host ("Skipped         : {0}" -f $skipped)
}
Write-Host ("Failed          : {0}" -f $failed.Count)
if ($failed.Count -gt 0) {
    foreach ($f in $failed) {
        Write-Host ("  - {0} : {1}" -f $f.file, $f.error)
    }
}
Write-Host '================================================='

$successCount = $created + $updated + $skipped + $planned
if ($failed.Count -eq 0) { exit 0 }
if ($ContinueOnError -and $successCount -ge 1) { exit 0 }
exit 1
