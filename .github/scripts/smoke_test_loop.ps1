<#
.SYNOPSIS
    Loop harness intorno a smoke_test_notion.ps1: tee dei log e scan
    difensivo per evitare leak del token.
#>
[CmdletBinding()]
param(
    [int]$MaxIterations = 5,
    [switch]$Live,
    [switch]$FailFast
)

$ErrorActionPreference = 'Continue'

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$scriptDir = $PSScriptRoot
$pwsh = 'C:\Program Files\PowerShell\7\pwsh.exe'
$smokeScript = Join-Path $scriptDir 'smoke_test_notion.ps1'
$logsDir = Join-Path $scriptDir '.smoke-logs'

if (-not (Test-Path -LiteralPath $logsDir)) {
    $null = New-Item -ItemType Directory -Path $logsDir -Force
}
$gitignorePath = Join-Path $logsDir '.gitignore'
if (-not (Test-Path -LiteralPath $gitignorePath)) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($gitignorePath, "*`n", $utf8)
}

if (-not $env:RECIPES_NOTION_TOKEN) {
    $env:RECIPES_NOTION_TOKEN = [Environment]::GetEnvironmentVariable('RECIPES_NOTION_TOKEN', 'User')
}

$lastExit = -1
$succeeded = $false

for ($iter = 1; $iter -le $MaxIterations; $iter++) {
    $iso = (Get-Date).ToString('yyyyMMdd_HHmmss_fff')
    $logPath = Join-Path $logsDir "$iso.log"

    $smokeArgs = @('-NoProfile', '-File', $smokeScript)
    if ($Live) { $smokeArgs += '-Live' }

    Write-Host ("=== iter {0}/{1} -> {2}" -f $iter, $MaxIterations, $logPath)
    $out = & $pwsh @smokeArgs 2>&1 | Out-String -Width 32767
    $lastExit = $LASTEXITCODE
    if ($null -eq $lastExit) { $lastExit = 0 }

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($logPath, $out, $utf8)
    Write-Host $out

    # Defensive token scan in captured output.
    $tokenLeak = $false
    if ($out -match 'ntn_[A-Za-z0-9]{20,}') { $tokenLeak = $true }
    if ($env:RECIPES_NOTION_TOKEN -and $out.Contains([string]$env:RECIPES_NOTION_TOKEN)) { $tokenLeak = $true }
    if ($tokenLeak) {
        Write-Host "[FAIL] Token leak detected in smoke output (iter $iter)"
        $lastExit = 255
    }

    if ($lastExit -eq 0 -and -not $tokenLeak) {
        Write-Host ("SMOKE_LOOP_OK iter={0}" -f $iter)
        $succeeded = $true
        break
    }

    Write-Host ("--- failures iter {0} ---" -f $iter)
    $failLines = ($out -split "`r?`n") | Where-Object { $_ -match '^\[FAIL\]' }
    foreach ($fl in $failLines) { Write-Host $fl }

    if ($FailFast) { break }
}

if ($succeeded) {
    exit 0
}
else {
    exit ([Math]::Min(255, [Math]::Max(1, $lastExit)))
}
