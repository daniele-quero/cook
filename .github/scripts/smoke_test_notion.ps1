<#
.SYNOPSIS
    Smoke-test dell'integrazione Notion per le ricette.
.DESCRIPTION
    Esegue test di unit (lib_*), lettura live dei parent, dry-run sui file
    campione e (con -Live) un giro di create+archive su entrambi i parent
    + test di idempotenza. Emette [PASS]/[FAIL]/[SKIP] per riga, una
    SUMMARY finale e exit code = min(255, #failed).
    Non logga mai il token; verifica anche che nessuna stdout/stderr lo contenga.
#>
[CmdletBinding()]
param(
    [switch]$Live
)

$ErrorActionPreference = 'Continue'

# Force UTF-8 I/O.
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$scriptDir = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$pwsh = 'C:\Program Files\PowerShell\7\pwsh.exe'

$MAIN_ID = '3a77524302b94298b7ce1f4155bd9571'
$SOUS_ID = '1ae2a470ad5d8073bc02c9d0f47396a0'

$readScript = Join-Path $scriptDir 'read_notion_recipes.ps1'
$syncScript = Join-Path $scriptDir 'sync_recipe_page.ps1'

# Eager-load libs for in-process unit tests.
. (Join-Path $scriptDir 'lib_notion_common.ps1')
. (Join-Path $scriptDir 'lib_markdown_to_notion.ps1')
. (Join-Path $scriptDir 'lib_recipe_meta.ps1')

$results = New-Object System.Collections.ArrayList
$total = 0
$failed = 0
$skipped = 0

function Test-Case {
    param(
        [Parameter(Mandatory)][string]$Id,
        [Parameter(Mandatory)][string]$Name,
        [scriptblock]$Body
    )
    $script:total++
    try {
        & $Body
        Write-Host ("[PASS] {0} {1}" -f $Id, $Name)
        [void]$script:results.Add([ordered]@{ id = $Id; name = $Name; verdict = 'PASS' })
    }
    catch {
        $emsg = $_.Exception.Message
        if ($emsg -eq '__SKIP__' -or $emsg -like 'SKIP:*') {
            $script:skipped++
            Write-Host ("[SKIP] {0} {1} — {2}" -f $Id, $Name, $emsg)
            [void]$script:results.Add([ordered]@{ id = $Id; name = $Name; verdict = 'SKIP'; reason = $emsg })
            return
        }
        $script:failed++
        Write-Host ("[FAIL] {0} {1} — {2}" -f $Id, $Name, $emsg)
        [void]$script:results.Add([ordered]@{ id = $Id; name = $Name; verdict = 'FAIL'; error = $emsg })
    }
}

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Assert-NotContainsToken {
    param([string]$Text, [string]$Where)
    if ([string]::IsNullOrEmpty($Text)) { return }
    if ($Text -match 'ntn_[A-Za-z0-9]{20,}') {
        throw "Token detected in $Where"
    }
    if ($env:RECIPES_NOTION_TOKEN -and $Text.Contains([string]$env:RECIPES_NOTION_TOKEN)) {
        throw "Raw token value found in $Where"
    }
}

# =====================================================================
# Group 1 — Env
# =====================================================================
Test-Case 'T1.1' 'RECIPES_NOTION_TOKEN is set' {
    if ([string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) {
        $env:RECIPES_NOTION_TOKEN = [Environment]::GetEnvironmentVariable('RECIPES_NOTION_TOKEN', 'User')
    }
    Assert-True (-not [string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) 'Token mancante anche da User scope'
}

# =====================================================================
# Group 2 — Lib unit tests (in-process)
# =====================================================================
Test-Case 'T2.1' 'ConvertTo-NotionId raw+dashed' {
    $raw = '3a77524302b94298b7ce1f4155bd9571'
    $dashed = '3a775243-02b9-4298-b7ce-1f4155bd9571'
    $a = ConvertTo-NotionId $raw
    $b = ConvertTo-NotionId $dashed
    Assert-True ($a -eq $dashed) "raw->dashed wrong: $a"
    Assert-True ($b -eq $dashed) "dashed->dashed wrong: $b"
}

Test-Case 'T2.2' 'Split-IntoChunks 250/100 = 3 (100/100/50)' {
    $items = 1..250
    $chunks = Split-IntoChunks $items 100
    Assert-True ($chunks.Count -eq 3) "expected 3 chunks, got $($chunks.Count)"
    Assert-True ($chunks[0].Count -eq 100) "chunk0 != 100"
    Assert-True ($chunks[1].Count -eq 100) "chunk1 != 100"
    Assert-True ($chunks[2].Count -eq 50)  "chunk2 != 50"
}

Test-Case 'T2.3' 'Split-RichTextContent 5000 chars -> all <=2000, count>=3' {
    $t = ('a' * 5000)
    $segs = Split-RichTextContent -Text $t -MaxLength 2000
    Assert-True ($segs.Count -ge 3) "expected >=3 segments, got $($segs.Count)"
    foreach ($s in $segs) { Assert-True ($s.Length -le 2000) "segment too long: $($s.Length)" }
}

Test-Case 'T2.4' 'ConvertFrom-MarkdownFrontmatter tags array len 2' {
    $md = @"
---
title: "Demo"
tags:
  - alpha
  - beta
---
body text
"@
    $p = ConvertFrom-MarkdownFrontmatter -Markdown $md
    Assert-True ($p.Frontmatter.ContainsKey('tags')) 'tags key missing'
    Assert-True ($p.Frontmatter['tags'].Count -eq 2) "tags count = $($p.Frontmatter['tags'].Count)"
}

Test-Case 'T2.5' 'ConvertTo-NotionBlocks heading/paragraph/list/code sequence' {
    $body = @"
# Titolo
Paragrafo qui.

- item 1
- item 2

``````bash
echo hi
``````
"@
    $blocks = ConvertTo-NotionBlocks -Body $body
    $types = @($blocks | ForEach-Object { [string]$_.type })
    Assert-True ($types -contains 'heading_1') "no heading_1 in $($types -join ',')"
    Assert-True ($types -contains 'paragraph') "no paragraph"
    Assert-True ($types -contains 'bulleted_list_item') "no bulleted_list_item"
    Assert-True ($types -contains 'code') "no code"
}

Test-Case 'T2.6' 'Test-IsSousVideRecipe salmone=true, pesto=false' {
    $sal = Join-Path $repoRoot 'salmone-sous-vide.md'
    $pes = Join-Path $repoRoot 'pesto-rucola-frutta-secca.md'
    Assert-True (Test-Path $sal) 'missing salmone fixture'
    Assert-True (Test-Path $pes) 'missing pesto fixture'
    $salC = [System.IO.File]::ReadAllText($sal, [System.Text.UTF8Encoding]::new($false))
    $pesC = [System.IO.File]::ReadAllText($pes, [System.Text.UTF8Encoding]::new($false))
    Assert-True (Test-IsSousVideRecipe -FileName 'salmone-sous-vide.md' -Content $salC) 'salmone should be sous-vide'
    Assert-True (-not (Test-IsSousVideRecipe -FileName 'pesto-rucola-frutta-secca.md' -Content $pesC)) 'pesto should NOT be sous-vide'
}

Test-Case 'T2.7' 'Get-RecipeTempoTemperatura extracts something on salmone' {
    $sal = Join-Path $repoRoot 'salmone-sous-vide.md'
    $salC = [System.IO.File]::ReadAllText($sal, [System.Text.UTF8Encoding]::new($false))
    $tt = Get-RecipeTempoTemperatura -Content $salC -Frontmatter @{}
    Assert-True ($tt.Source -ne 'none') "Source still 'none' (Tempo=$($tt.Tempo) Temperatura=$($tt.Temperatura))"
}

# =====================================================================
# Group 3 — Read (live if token present)
# =====================================================================
Test-Case 'T3.1' 'read_notion_recipes -AsJson returns 2 entries no error' {
    if ([string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) {
        throw 'SKIP: no token'
    }
    $out = & $pwsh -NoProfile -File $readScript -AsJson 2>&1 | Out-String -Width 32767
    Assert-NotContainsToken -Text $out -Where 'read stdout'
    $arr = $null
    try { $arr = $out | ConvertFrom-Json } catch { throw "JSON parse failed: $($_.Exception.Message). Raw: $out" }
    Assert-True ($arr.Count -eq 2) "expected 2 entries, got $($arr.Count)"
    foreach ($e in $arr) {
        Assert-True (-not $e.error) "entry $($e.id) has error: $($e.error)"
        Assert-True (-not [string]::IsNullOrWhiteSpace($e.title)) "entry $($e.id) has empty title"
    }
    $script:lastReadOutput = $out
}

Test-Case 'T3.2' 'token never appears in read output' {
    if (-not $script:lastReadOutput) { throw 'SKIP: T3.1 did not produce output' }
    Assert-NotContainsToken -Text $script:lastReadOutput -Where 'read script output'
}

# =====================================================================
# Group 4 — Dry-run writes
# =====================================================================
Test-Case 'T4.1' 'dry-run salmone -> sous parent + callout + isSv=true' {
    $sal = Join-Path $repoRoot 'salmone-sous-vide.md'
    Assert-True (Test-Path $sal) 'missing salmone fixture'
    $out = & $pwsh -NoProfile -File $syncScript -DryRun -MarkdownFile $sal 2>&1 | Out-String -Width 32767
    Assert-NotContainsToken -Text $out -Where 'sync salmone dry-run'
    $sousDashed = ConvertTo-NotionId $SOUS_ID
    Assert-True ($out -match [regex]::Escape($sousDashed)) 'sous parent id missing'
    Assert-True ($out -match '"type"\s*:\s*"callout"') 'first block not callout'
    Assert-True ($out -match 'sous-vide\s*:\s*True') 'isSv != True'
}

Test-Case 'T4.2' 'dry-run pesto -> main parent + first block != callout' {
    $pes = Join-Path $repoRoot 'pesto-rucola-frutta-secca.md'
    Assert-True (Test-Path $pes) 'missing pesto fixture'
    $out = & $pwsh -NoProfile -File $syncScript -DryRun -MarkdownFile $pes 2>&1 | Out-String -Width 32767
    Assert-NotContainsToken -Text $out -Where 'sync pesto dry-run'
    $mainDashed = ConvertTo-NotionId $MAIN_ID
    Assert-True ($out -match [regex]::Escape($mainDashed)) 'main parent id missing'
    # first2 blocks JSON: ensure the first block is not callout
    if ($out -match 'first2 blocks :\s*\n([\s\S]+?)(?:\n\s{2}\w|\Z)') {
        $first2 = $Matches[1]
        Assert-True ($first2 -notmatch '"type"\s*:\s*"callout"') 'first block IS callout (should not be)'
    }
}

Test-Case 'T4.3' 'dry-run on missing file -> non-zero exit' {
    $bogus = Join-Path $repoRoot '__definitely_missing__.md'
    $out = & $pwsh -NoProfile -File $syncScript -DryRun -MarkdownFile $bogus 2>&1 | Out-String -Width 32767
    $ec = $LASTEXITCODE
    Assert-True ($ec -ne 0) "expected non-zero exit, got $ec"
    Assert-NotContainsToken -Text $out -Where 'sync missing-file output'
}

# =====================================================================
# Group 5 — Live create + cleanup (only with -Live)
# =====================================================================
$createdIds = New-Object System.Collections.ArrayList

function _ArchivePage {
    param([string]$Id)
    if ([string]::IsNullOrWhiteSpace($Id)) { return }
    try {
        $null = Invoke-NotionApi -Method 'PATCH' -Path "/v1/pages/$Id" -Body @{ archived = $true }
    }
    catch {
        Write-Host ("[WARN] archive failed for {0}: {1}" -f $Id, $_.Exception.Message)
    }
}

if ($Live) {
    try {
        Test-Case 'T5.1' 'live create+archive in MAIN database' {
            if ([string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) { throw 'SKIP: no token' }
            $iso = (Get-Date).ToString('yyyyMMdd_HHmmss')
            $name = "__smoketest__$iso"
            $body = @{
                parent     = @{ database_id = (ConvertTo-NotionId $MAIN_ID) }
                properties = @{ Name = @{ title = @(@{ type = 'text'; text = @{ content = $name } }) } }
                children   = @(@{
                        object    = 'block'
                        type      = 'paragraph'
                        paragraph = @{ rich_text = @(@{ type = 'text'; text = @{ content = 'smoke test paragraph' } }) }
                    })
            }
            $resp = Invoke-NotionApi -Method 'POST' -Path '/v1/pages' -Body $body
            $pageId = [string]$resp.id
            Assert-True (-not [string]::IsNullOrWhiteSpace($pageId)) 'no page id returned'
            [void]$createdIds.Add($pageId)
            # Archive now
            $arch = Invoke-NotionApi -Method 'PATCH' -Path "/v1/pages/$pageId" -Body @{ archived = $true }
            Assert-True ($arch.archived -eq $true) 'archive flag != true'
        }

        Test-Case 'T5.2' 'live create+archive under SOUS-VIDE page parent' {
            if ([string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) { throw 'SKIP: no token' }
            $iso = (Get-Date).ToString('yyyyMMdd_HHmmss')
            $name = "__smoketest__$iso"
            $body = @{
                parent     = @{ type = 'page_id'; page_id = (ConvertTo-NotionId $SOUS_ID) }
                properties = @{ title = @(@{ type = 'text'; text = @{ content = $name } }) }
                children   = @(@{
                        object    = 'block'
                        type      = 'paragraph'
                        paragraph = @{ rich_text = @(@{ type = 'text'; text = @{ content = 'smoke test child' } }) }
                    })
            }
            $resp = Invoke-NotionApi -Method 'POST' -Path '/v1/pages' -Body $body
            $pageId = [string]$resp.id
            Assert-True (-not [string]::IsNullOrWhiteSpace($pageId)) 'no page id returned'
            [void]$createdIds.Add($pageId)
            $arch = Invoke-NotionApi -Method 'PATCH' -Path "/v1/pages/$pageId" -Body @{ archived = $true }
            Assert-True ($arch.archived -eq $true) 'archive flag != true'
        }

        # =================================================================
        # Group 6 — Idempotency (live)
        # =================================================================
        Test-Case 'T6.1' 'sync create + -Update + database query == 1 result' {
            if ([string]::IsNullOrWhiteSpace($env:RECIPES_NOTION_TOKEN)) { throw 'SKIP: no token' }
            $iso = (Get-Date).ToString('yyyyMMdd_HHmmss')
            $stem = "__smoketest_idem__$iso"
            $tmpMd = Join-Path $repoRoot ("$stem.md")
            $title = "Smoketest Idempotency $iso"
            $bodyMd = @"
# $title

Paragrafo unico.
"@
            $utf8 = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($tmpMd, $bodyMd, $utf8)
            try {
                # First sync (CREATE)
                $out1 = & $pwsh -NoProfile -File $syncScript -MarkdownFile $tmpMd -ParentPageId $MAIN_ID 2>&1 | Out-String -Width 32767
                Assert-NotContainsToken -Text $out1 -Where 'idempotency create out'
                Assert-True ($out1 -match '\[CREATE\]') "expected CREATE in first run, got: $out1"
                # Second sync with -Update (UPDATE)
                $out2 = & $pwsh -NoProfile -File $syncScript -Update -MarkdownFile $tmpMd -ParentPageId $MAIN_ID 2>&1 | Out-String -Width 32767
                Assert-NotContainsToken -Text $out2 -Where 'idempotency update out'
                Assert-True ($out2 -match '\[UPDATE\]') "expected UPDATE in second run, got: $out2"
                # Query database
                $filter = @{ filter = @{ property = 'Name'; title = @{ equals = $title } } }
                $rows = Get-NotionPaged -Path "/v1/databases/$(ConvertTo-NotionId $MAIN_ID)/query" -InitialBody $filter
                $live = @($rows | Where-Object { -not $_.archived })
                Assert-True ($live.Count -eq 1) "expected exactly 1 non-archived row, got $($live.Count)"
                foreach ($r in $live) { [void]$createdIds.Add([string]$r.id) }
            }
            finally {
                try { Remove-Item -LiteralPath $tmpMd -Force -ErrorAction SilentlyContinue } catch { }
            }
        }
    }
    finally {
        foreach ($id in $createdIds) { _ArchivePage -Id $id }
    }
}
else {
    Test-Case 'T5.1' 'live MAIN create+archive' { throw '__SKIP__' }
    Test-Case 'T5.2' 'live SOUS create+archive' { throw '__SKIP__' }
    Test-Case 'T6.1' 'live idempotency' { throw '__SKIP__' }
}

# =====================================================================
# Summary
# =====================================================================
Write-Host ''
Write-Host ("SUMMARY: {0}/{1} ({2} failed)" -f ($total - $failed - $skipped), $total, $failed)
exit ([Math]::Min(255, $failed))
