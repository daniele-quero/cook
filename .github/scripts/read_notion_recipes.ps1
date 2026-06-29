<#
.SYNOPSIS
    Legge da Notion uno o più parent (database o pagine) e ne riassume titolo,
    tipo e contenuto (proprietà se database, figli se pagina).

.DESCRIPTION
    Usa lib_notion_common.ps1 per token, retry, paginazione. Non logga mai il
    token. Su 404 (object_not_found) tenta il fallback page → children.
#>
[CmdletBinding()]
param(
    [string[]]$Id = @('3a77524302b94298b7ce1f4155bd9571', '1ae2a470ad5d8073bc02c9d0f47396a0'),
    [string]$OutFile,
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib_notion_common.ps1')

function _ExtractPlainTitle {
    param($titleArray)
    if ($null -eq $titleArray) { return '' }
    $parts = @()
    foreach ($t in $titleArray) {
        if ($null -ne $t.plain_text) { $parts += [string]$t.plain_text }
    }
    return ($parts -join '').Trim()
}

function _ShouldFallbackToPage {
    param([string]$ErrorMessage)
    if ([string]::IsNullOrEmpty($ErrorMessage)) { return $false }
    # Invoke-NotionApi throws messages shaped like:
    #   "[Notion API] <status> <code>: <message>"
    if ($ErrorMessage -match '\[Notion API\]\s+(\d+)\s+([A-Za-z0-9_]+)?\s*:\s*(.*)$') {
        $status = [int]$Matches[1]
        $code = [string]$Matches[2]
        $msg = [string]$Matches[3]
        if ($status -eq 404) { return $true }
        if ($code -eq 'object_not_found') { return $true }
        if ($status -eq 400 -and $code -eq 'validation_error' -and $msg -match '(?i)is a page,\s*not a database') {
            return $true
        }
        return $false
    }
    # Fallback heuristics if the shape doesn't match.
    if ($ErrorMessage -match '\b404\b') { return $true }
    if ($ErrorMessage -match 'object_not_found') { return $true }
    if ($ErrorMessage -match '(?i)is a page,\s*not a database') { return $true }
    return $false
}

$results = New-Object System.Collections.ArrayList
$hadHardFailure = $false

foreach ($rawId in $Id) {
    $entry = [ordered]@{
        id            = $rawId
        normalized_id = $null
        kind          = $null
        title         = $null
        properties    = $null
        children      = $null
        error         = $null
    }

    try {
        $nid = ConvertTo-NotionId $rawId
        $entry.normalized_id = $nid

        $db = $null
        $dbErr = $null
        try {
            $db = Invoke-NotionApi -Method 'GET' -Path "/v1/databases/$nid"
        }
        catch {
            $dbErr = $_.Exception.Message
        }

        if ($db) {
            $entry.kind = 'database'
            $entry.title = _ExtractPlainTitle $db.title
            $props = [ordered]@{}
            if ($db.properties) {
                foreach ($p in $db.properties.PSObject.Properties) {
                    $props[$p.Name] = [string]$p.Value.type
                }
            }
            $entry.properties = $props
        }
        elseif (_ShouldFallbackToPage $dbErr) {
            $page = Invoke-NotionApi -Method 'GET' -Path "/v1/pages/$nid"
            $entry.kind = 'page'
            $pageTitle = ''
            if ($page.properties) {
                foreach ($p in $page.properties.PSObject.Properties) {
                    if ($p.Value.type -eq 'title') {
                        $pageTitle = _ExtractPlainTitle $p.Value.title
                        break
                    }
                }
            }
            $entry.title = $pageTitle

            $kids = Get-NotionPaged -Path "/v1/blocks/$nid/children"
            $list = New-Object System.Collections.ArrayList
            foreach ($k in $kids) {
                $ktype = [string]$k.type
                if ($ktype -eq 'child_page') {
                    [void]$list.Add([ordered]@{
                            id    = [string]$k.id
                            title = [string]$k.child_page.title
                            kind  = 'page'
                        })
                }
                elseif ($ktype -eq 'child_database') {
                    [void]$list.Add([ordered]@{
                            id    = [string]$k.id
                            title = [string]$k.child_database.title
                            kind  = 'database'
                        })
                }
            }
            $entry.children = $list.ToArray()
        }
        else {
            throw $dbErr
        }
    }
    catch {
        $entry.error = $_.Exception.Message
        $hadHardFailure = $true
    }

    [void]$results.Add($entry)
}

$arr = $results.ToArray()

if ($AsJson) {
    $arr | ConvertTo-Json -Depth 10
}
elseif ($OutFile) {
    $json = $arr | ConvertTo-Json -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($OutFile, $json, $utf8NoBom)
    Write-Host "Scritto: $OutFile"
    foreach ($e in $arr) {
        $extra = if ($e.kind -eq 'database') { "$($e.properties.Count) props" }
        elseif ($e.kind -eq 'page' -and $e.children) { "$($e.children.Count) children" }
        else { '' }
        Write-Host ("  [{0}] {1} — {2} {3}" -f $e.kind, $e.normalized_id, $e.title, $extra)
    }
}
else {
    foreach ($e in $arr) {
        if ($e.error) {
            Write-Host ("[ERROR] {0} : {1}" -f $e.id, $e.error)
            continue
        }
        $extra = if ($e.kind -eq 'database') { "$($e.properties.Count) props" }
        elseif ($e.kind -eq 'page' -and $e.children) { "$($e.children.Count) children" }
        else { '' }
        Write-Host ("[{0,-8}] {1}  {2}  {3}" -f $e.kind, $e.normalized_id, $e.title, $extra)
    }
}

if ($hadHardFailure) { exit 1 }
exit 0
