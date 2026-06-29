<#
.SYNOPSIS
    Sincronizza un singolo file Markdown come pagina figlia di un parent
    (database o pagina) Notion. Supporta create/update/skip/dry-run.

.DESCRIPTION
    Routing parent: sous-vide (rilevato da filename o contenuto) →
    `1ae2a470ad5d8073bc02c9d0f47396a0`; altrimenti
    `3a77524302b94298b7ce1f4155bd9571`. Override con -ParentPageId.
    Non logga mai il token.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$MarkdownFile,
    [switch]$Update,
    [Alias('Force')][switch]$ForceUpdate,
    [switch]$DryRun,
    [string]$ParentPageId,
    [string]$Icon
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib_notion_common.ps1')
. (Join-Path $PSScriptRoot 'lib_markdown_to_notion.ps1')
. (Join-Path $PSScriptRoot 'lib_recipe_meta.ps1')

# --- Helpers (must be defined before use) ------------------------------
function _BuildTitleProp {
    param([string]$Text)
    return @{ title = @(@{ type = 'text'; text = @{ content = $Text } }) }
}

function _GetMultiSelectFromFrontmatter {
    param(
        [hashtable]$Frontmatter,
        [string]$PropName
    )
    if (-not $Frontmatter -or $Frontmatter.Count -eq 0) { return @() }
    $targetLower = $PropName.ToLowerInvariant()
    foreach ($k in $Frontmatter.Keys) {
        if ($k.ToString().ToLowerInvariant() -eq $targetLower) {
            $v = $Frontmatter[$k]
            if ($null -eq $v) { return @() }
            if ($v -is [array]) {
                $out = @()
                foreach ($it in $v) {
                    $s = [string]$it
                    if (-not [string]::IsNullOrWhiteSpace($s)) { $out += $s.Trim() }
                }
                return , $out
            }
            $s = [string]$v
            if ([string]::IsNullOrWhiteSpace($s)) { return @() }
            return , @($s.Trim())
        }
    }
    return @()
}

function _BuildDatabaseProperties {
    param(
        [string]$TitleText,
        $Db,
        [string]$TitlePropName,
        [hashtable]$Frontmatter,
        [bool]$IsSousVide
    )
    $props = @{}
    if (-not $Db -or -not $Db.properties) {
        if ($TitlePropName) { $props[$TitlePropName] = _BuildTitleProp -Text $TitleText }
        else { $props['title'] = _BuildTitleProp -Text $TitleText }
        return $props
    }

    foreach ($p in $Db.properties.PSObject.Properties) {
        $pname = [string]$p.Name
        $ptype = [string]$p.Value.type
        if ($ptype -eq 'title') {
            $props[$pname] = _BuildTitleProp -Text $TitleText
            continue
        }
        if ($ptype -eq 'multi_select') {
            $vals = _GetMultiSelectFromFrontmatter -Frontmatter $Frontmatter -PropName $pname
            if ($pname -eq 'Tags' -and $IsSousVide) {
                $vals = @($vals) + @('sous-vide')
            }
            $seen = @{}
            $opts = @()
            foreach ($v in $vals) {
                $s = [string]$v
                if ([string]::IsNullOrWhiteSpace($s)) { continue }
                $key = $s.Trim().ToLowerInvariant()
                if ($seen.ContainsKey($key)) { continue }
                $seen[$key] = $true
                $opts += @{ name = $s.Trim() }
            }
            if ($opts.Count -gt 0) {
                $props[$pname] = @{ multi_select = $opts }
            }
        }
    }
    return $props
}

function _BuildPagePropertiesForPageParent {
    param([string]$TitleText)
    return @{ title = @(@{ type = 'text'; text = @{ content = $TitleText } }) }
}

$DEFAULT_PARENT_MAIN = '3a77524302b94298b7ce1f4155bd9571'
$DEFAULT_PARENT_SOUS = '1ae2a470ad5d8073bc02c9d0f47396a0'

# --- Resolve file --------------------------------------------------------
if (-not (Test-Path -LiteralPath $MarkdownFile)) {
    Write-Error "File non trovato: $MarkdownFile"
    exit 2
}
$mdFull = (Resolve-Path -LiteralPath $MarkdownFile).Path
$mdName = Split-Path -Leaf $mdFull
$raw = [System.IO.File]::ReadAllText($mdFull, [System.Text.UTF8Encoding]::new($false))

# --- Parse frontmatter + body -------------------------------------------
$parsed = ConvertFrom-MarkdownFrontmatter -Markdown $raw
$fm = $parsed.Frontmatter
$body = $parsed.Body

# --- Title --------------------------------------------------------------
$title = $null
if ($fm.ContainsKey('title')) {
    $t = $fm['title']
    if ($t -is [array]) { $t = ($t -join ' ') }
    $ts = [string]$t
    if (-not [string]::IsNullOrWhiteSpace($ts)) { $title = $ts.Trim() }
}
if (-not $title) {
    foreach ($ln in ($body -replace "`r`n", "`n").Split("`n")) {
        if ($ln -match '^\s*#\s+(.+)$') { $title = $Matches[1].Trim(); break }
        if (-not [string]::IsNullOrWhiteSpace($ln)) { break }
    }
}
if (-not $title) {
    $title = [System.IO.Path]::GetFileNameWithoutExtension($mdFull)
}

# --- Sous-vide? ---------------------------------------------------------
$isSv = Test-IsSousVideRecipe -FileName $mdName -Content $body

# --- Parent id ----------------------------------------------------------
if ($ParentPageId) {
    $parentRaw = $ParentPageId
}
elseif ($isSv) {
    $parentRaw = $DEFAULT_PARENT_SOUS
}
else {
    $parentRaw = $DEFAULT_PARENT_MAIN
}
$parentId = ConvertTo-NotionId $parentRaw

# --- Icon ---------------------------------------------------------------
$iconEmoji = if ($Icon) { $Icon } elseif ($isSv) { '🌡️' } else { '🍽️' }

# --- Build blocks -------------------------------------------------------
$blocks = New-Object System.Collections.ArrayList
if ($isSv) {
    $tt = Get-RecipeTempoTemperatura -Content $body -Frontmatter $fm
    $callout = New-SousVideRecapBlock -Tempo $tt.Tempo -Temperatura $tt.Temperatura
    [void]$blocks.Add($callout)
    [void]$blocks.Add(@{ object = 'block'; type = 'divider'; divider = @{} })
}
foreach ($b in (ConvertTo-NotionBlocks -Body $body)) { [void]$blocks.Add($b) }
$blocksArr = $blocks.ToArray()
$blockCount = $blocksArr.Count

# --- Parent probe -------------------------------------------------------
$parentKind = 'unknown'
$dbObj = $null
$titlePropName = $null
$tokenAvailable = -not [string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)

if (-not $tokenAvailable) {
    if ($DryRun) {
        [Console]::Error.WriteLine('[WARN] token not set; parent probe skipped')
    }
    else {
        Write-Error 'RECIPES_NOTION_TOKEN non impostato.'
        exit 2
    }
}
else {
    try {
        $dbObj = Invoke-NotionApi -Method 'GET' -Path "/v1/databases/$parentId"
        $parentKind = 'database'
        if ($dbObj.properties) {
            foreach ($p in $dbObj.properties.PSObject.Properties) {
                if ($p.Value.type -eq 'title') { $titlePropName = $p.Name; break }
            }
        }
    }
    catch {
        $msg = $_.Exception.Message
        $fallback = $false
        if ($msg -match '\[Notion API\]\s+(\d+)\s+([A-Za-z0-9_]+)?\s*:\s*(.*)$') {
            $st = [int]$Matches[1]
            $cd = [string]$Matches[2]
            $ms = [string]$Matches[3]
            if ($st -eq 404) { $fallback = $true }
            elseif ($cd -eq 'object_not_found') { $fallback = $true }
            elseif ($st -eq 400 -and $cd -eq 'validation_error' -and $ms -match '(?i)is a page,\s*not a database') { $fallback = $true }
        }
        elseif ($msg -match '\b404\b' -or $msg -match 'object_not_found' -or $msg -match '(?i)is a page,\s*not a database') {
            $fallback = $true
        }
        if ($fallback) {
            try {
                $null = Invoke-NotionApi -Method 'GET' -Path "/v1/pages/$parentId"
                $parentKind = 'page'
            }
            catch {
                Write-Error "Parent non accessibile ($parentId): $($_.Exception.Message)"
                exit 2
            }
        }
        else {
            Write-Error "Errore probing parent ($parentId): $msg"
            exit 2
        }
    }
}

# --- Find existing match ------------------------------------------------
$matchPage = $null
$titleLower = $title.Trim().ToLowerInvariant()

if (-not $DryRun -or $tokenAvailable) {
    if ($parentKind -eq 'database' -and $titlePropName) {
        $filterBody = @{
            filter = @{
                property = $titlePropName
                title    = @{ equals = $title }
            }
        }
        try {
            $rows = Get-NotionPaged -Path "/v1/databases/$parentId/query" -InitialBody $filterBody
            foreach ($r in $rows) {
                $rt = ''
                if ($r.properties -and $r.properties.PSObject.Properties[$titlePropName]) {
                    $titleArr = $r.properties.$titlePropName.title
                    $parts = @()
                    foreach ($x in $titleArr) { if ($x.plain_text) { $parts += [string]$x.plain_text } }
                    $rt = ($parts -join '').Trim().ToLowerInvariant()
                }
                if ($rt -eq $titleLower) { $matchPage = $r; break }
            }
        }
        catch {
            if (-not $DryRun) { throw }
            [Console]::Error.WriteLine("[WARN] query database fallita in DryRun: $($_.Exception.Message)")
        }
    }
    elseif ($parentKind -eq 'page') {
        try {
            $kids = Get-NotionPaged -Path "/v1/blocks/$parentId/children"
            foreach ($k in $kids) {
                if ($k.type -eq 'child_page') {
                    $kt = [string]$k.child_page.title
                    if ($kt.Trim().ToLowerInvariant() -eq $titleLower) {
                        $matchPage = $k
                        break
                    }
                }
            }
        }
        catch {
            if (-not $DryRun) { throw }
            [Console]::Error.WriteLine("[WARN] list children fallita in DryRun: $($_.Exception.Message)")
        }
    }
}

# --- Decide action ------------------------------------------------------
$action = $null
if ($matchPage) {
    if ($Update -or $ForceUpdate) { $action = 'UPDATE' } else { $action = 'SKIP' }
}
else {
    $action = 'CREATE'
}

# --- DryRun output ------------------------------------------------------
if ($DryRun) {
    $first2 = @()
    if ($blocksArr.Count -gt 0) { $first2 = $blocksArr[0..([Math]::Min(1, $blocksArr.Count - 1))] }
    $first2Json = $first2 | ConvertTo-Json -Depth 10

    if ($parentKind -eq 'database') {
        $plannedProps = _BuildDatabaseProperties -TitleText $title -Db $dbObj -TitlePropName $titlePropName -Frontmatter $fm -IsSousVide $isSv
        $plannedParent = @{ database_id = $parentId }
    }
    else {
        $plannedProps = _BuildPagePropertiesForPageParent -TitleText $title
        $plannedParent = @{ type = 'page_id'; page_id = $parentId }
    }
    $previewChildren = @()
    if ($blocksArr.Count -gt 0) { $previewChildren = $blocksArr[0..([Math]::Min(1, $blocksArr.Count - 1))] }
    $plannedBody = @{
        parent     = $plannedParent
        icon       = @{ type = 'emoji'; emoji = $iconEmoji }
        properties = $plannedProps
        children   = @($previewChildren)
    }
    $plannedJson = $plannedBody | ConvertTo-Json -Depth 10

    Write-Host ("[{0}] {1}" -f $action, $title)
    Write-Host ("  parent id     : {0}" -f $parentId)
    Write-Host ("  parent kind   : {0}" -f $parentKind)
    Write-Host ("  sous-vide     : {0}" -f $isSv)
    Write-Host ("  block count   : {0}" -f $blockCount)
    Write-Host ("  first2 blocks :`n{0}" -f $first2Json)
    Write-Host ("  planned body  :`n{0}" -f $plannedJson)
    exit 0
}

# --- Action: SKIP -------------------------------------------------------
if ($action -eq 'SKIP') {
    Write-Host ("[SKIP] {0}  (page id: {1})" -f $title, $matchPage.id)
    exit 0
}

# --- Action: CREATE -----------------------------------------------------
if ($action -eq 'CREATE') {
    $first = @()
    $rest = @()
    if ($blocksArr.Count -gt 100) {
        $first = $blocksArr[0..99]
        $rest = $blocksArr[100..($blocksArr.Count - 1)]
    }
    else {
        $first = $blocksArr
    }

    if ($parentKind -eq 'database') {
        $parentField = @{ database_id = $parentId }
        $propsField = _BuildDatabaseProperties -TitleText $title -Db $dbObj -TitlePropName $titlePropName -Frontmatter $fm -IsSousVide $isSv
    }
    else {
        $parentField = @{ type = 'page_id'; page_id = $parentId }
        $propsField = _BuildPagePropertiesForPageParent -TitleText $title
    }

    $createPayload = @{
        parent     = $parentField
        icon       = @{ type = 'emoji'; emoji = $iconEmoji }
        properties = $propsField
        children   = @($first)
    }

    $page = Invoke-NotionApi -Method 'POST' -Path '/v1/pages' -Body $createPayload
    $pageId = [string]$page.id
    $pageUrl = [string]$page.url

    if ($rest.Count -gt 0) {
        $chunks = Split-IntoChunks -Items $rest -Size 100
        foreach ($c in $chunks) {
            $null = Invoke-NotionApi -Method 'PATCH' -Path "/v1/blocks/$pageId/children" -Body @{ children = @($c) }
        }
    }

    Write-Host ("[CREATE] {0}" -f $title)
    Write-Host ("  parent id : {0}" -f $parentId)
    Write-Host ("  page id   : {0}" -f $pageId)
    Write-Host ("  url       : {0}" -f $pageUrl)
    Write-Host ("  blocks    : {0}" -f $blockCount)
    exit 0
}

# --- Action: UPDATE -----------------------------------------------------
if ($action -eq 'UPDATE') {
    $pageId = [string]$matchPage.id

    # Archive existing children
    $existing = Get-NotionPaged -Path "/v1/blocks/$pageId/children"
    foreach ($b in $existing) {
        try {
            $null = Invoke-NotionApi -Method 'PATCH' -Path "/v1/blocks/$($b.id)" -Body @{ archived = $true }
        }
        catch { }
    }

    # Append new children in chunks of 100
    $chunks = Split-IntoChunks -Items $blocksArr -Size 100
    foreach ($c in $chunks) {
        $null = Invoke-NotionApi -Method 'PATCH' -Path "/v1/blocks/$pageId/children" -Body @{ children = @($c) }
    }

    # Update icon and database properties (when applicable)
    try {
        $patchBody = @{ icon = @{ type = 'emoji'; emoji = $iconEmoji } }
        if ($parentKind -eq 'database') {
            $patchBody.properties = _BuildDatabaseProperties -TitleText $title -Db $dbObj -TitlePropName $titlePropName -Frontmatter $fm -IsSousVide $isSv
        }
        $null = Invoke-NotionApi -Method 'PATCH' -Path "/v1/pages/$pageId" -Body $patchBody
    }
    catch { }

    $pageUrl = ''
    try {
        $pg = Invoke-NotionApi -Method 'GET' -Path "/v1/pages/$pageId"
        $pageUrl = [string]$pg.url
    }
    catch { }

    Write-Host ("[UPDATE] {0}" -f $title)
    Write-Host ("  parent id : {0}" -f $parentId)
    Write-Host ("  page id   : {0}" -f $pageId)
    Write-Host ("  url       : {0}" -f $pageUrl)
    Write-Host ("  blocks    : {0}" -f $blockCount)
    exit 0
}
