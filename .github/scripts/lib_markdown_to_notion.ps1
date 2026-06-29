<#
.SYNOPSIS
    Conversione Markdown → blocchi Notion (rich_text, headings, liste, code,
    quote, divider, tabelle) e parser di frontmatter YAML minimale.

.DESCRIPTION
    Dipende da lib_notion_common.ps1 (Split-RichTextContent) — dot-source
    quella libreria PRIMA di questa.
    Nessun side-effect su dot-source.
#>

function ConvertFrom-MarkdownFrontmatter {
    param(
        [Parameter(Mandatory, Position = 0)]
        [AllowEmptyString()]
        [string]$Markdown
    )

    $emptyResult = @{ Frontmatter = @{}; Body = $Markdown }
    if ([string]::IsNullOrEmpty($Markdown)) { return $emptyResult }

    $normalized = $Markdown -replace "`r`n", "`n"
    if ($normalized -notmatch '^---\n') { return $emptyResult }

    $lines = $normalized.Split("`n")
    if ($lines.Count -lt 2 -or $lines[0] -ne '---') { return $emptyResult }

    $closeIdx = -1
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -eq '---') { $closeIdx = $i; break }
    }
    if ($closeIdx -lt 0) { return $emptyResult }

    $front = @{}
    $i = 1
    while ($i -lt $closeIdx) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { $i++; continue }

        if ($line -match '^([A-Za-z0-9_\-]+):\s*(.*)$') {
            $key = $Matches[1]
            $val = $Matches[2].TrimEnd()

            if ($val.Length -eq 0) {
                $items = @()
                $j = $i + 1
                while ($j -lt $closeIdx -and $lines[$j] -match '^\s*-\s+(.*)$') {
                    $iv = $Matches[1].Trim()
                    if ($iv.Length -ge 2 -and $iv.StartsWith('"') -and $iv.EndsWith('"')) {
                        $iv = $iv.Substring(1, $iv.Length - 2)
                    }
                    elseif ($iv.Length -ge 2 -and $iv.StartsWith("'") -and $iv.EndsWith("'")) {
                        $iv = $iv.Substring(1, $iv.Length - 2)
                    }
                    $items += $iv
                    $j++
                }
                $front[$key] = $items
                $i = $j
                continue
            }

            if ($val.StartsWith('[') -and $val.EndsWith(']')) {
                $inner = $val.Substring(1, $val.Length - 2)
                $items = @()
                foreach ($p in $inner.Split(',')) {
                    $iv = $p.Trim()
                    if ($iv.Length -ge 2 -and $iv.StartsWith('"') -and $iv.EndsWith('"')) {
                        $iv = $iv.Substring(1, $iv.Length - 2)
                    }
                    elseif ($iv.Length -ge 2 -and $iv.StartsWith("'") -and $iv.EndsWith("'")) {
                        $iv = $iv.Substring(1, $iv.Length - 2)
                    }
                    if ($iv.Length -gt 0) { $items += $iv }
                }
                $front[$key] = $items
            }
            elseif ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
                $front[$key] = $val.Substring(1, $val.Length - 2)
            }
            elseif ($val.Length -ge 2 -and $val.StartsWith("'") -and $val.EndsWith("'")) {
                $front[$key] = $val.Substring(1, $val.Length - 2)
            }
            else {
                $front[$key] = $val
            }
        }
        $i++
    }

    if ($closeIdx + 1 -ge $lines.Count) {
        $body = ''
    }
    else {
        $body = ($lines[($closeIdx + 1)..($lines.Count - 1)] -join "`n")
    }
    return @{ Frontmatter = $front; Body = $body }
}

function ConvertTo-NotionRichText {
    param(
        [Parameter(Mandatory, Position = 0)]
        [AllowEmptyString()]
        [string]$Text
    )

    $result = New-Object System.Collections.ArrayList
    if ([string]::IsNullOrEmpty($Text)) {
        [void]$result.Add(@{ type = 'text'; text = @{ content = '' } })
        return , $result.ToArray()
    }

    $pattern = '(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+?`|\[[^\]]+?\]\([^)]+?\))'
    $cursor = 0
    $regexMatches = [regex]::Matches($Text, $pattern)

    function _AddPlain {
        param($Out, $Plain)
        if ([string]::IsNullOrEmpty($Plain)) { return }
        foreach ($seg in (Split-RichTextContent -Text $Plain)) {
            [void]$Out.Add(@{ type = 'text'; text = @{ content = $seg } })
        }
    }

    foreach ($m in $regexMatches) {
        if ($m.Index -gt $cursor) {
            _AddPlain -Out $result -Plain $Text.Substring($cursor, $m.Index - $cursor)
        }
        $tok = $m.Value

        if ($tok.Length -ge 4 -and $tok.StartsWith('**') -and $tok.EndsWith('**')) {
            $inner = $tok.Substring(2, $tok.Length - 4)
            foreach ($seg in (Split-RichTextContent -Text $inner)) {
                [void]$result.Add(@{
                        type        = 'text'
                        text        = @{ content = $seg }
                        annotations = @{ bold = $true }
                    })
            }
        }
        elseif ($tok.StartsWith('`') -and $tok.EndsWith('`')) {
            $inner = $tok.Substring(1, $tok.Length - 2)
            foreach ($seg in (Split-RichTextContent -Text $inner)) {
                [void]$result.Add(@{
                        type        = 'text'
                        text        = @{ content = $seg }
                        annotations = @{ code = $true }
                    })
            }
        }
        elseif ($tok.StartsWith('[') -and $tok -match '^\[([^\]]+)\]\(([^)]+)\)$') {
            $linkText = $Matches[1]
            $linkUrl = $Matches[2]
            foreach ($seg in (Split-RichTextContent -Text $linkText)) {
                [void]$result.Add(@{
                        type = 'text'
                        text = @{ content = $seg; link = @{ url = $linkUrl } }
                    })
            }
        }
        elseif (($tok.StartsWith('*') -and $tok.EndsWith('*')) -or ($tok.StartsWith('_') -and $tok.EndsWith('_'))) {
            $inner = $tok.Substring(1, $tok.Length - 2)
            foreach ($seg in (Split-RichTextContent -Text $inner)) {
                [void]$result.Add(@{
                        type        = 'text'
                        text        = @{ content = $seg }
                        annotations = @{ italic = $true }
                    })
            }
        }
        else {
            _AddPlain -Out $result -Plain $tok
        }
        $cursor = $m.Index + $m.Length
    }

    if ($cursor -lt $Text.Length) {
        _AddPlain -Out $result -Plain $Text.Substring($cursor)
    }

    if ($result.Count -eq 0) {
        [void]$result.Add(@{ type = 'text'; text = @{ content = $Text } })
    }
    return , $result.ToArray()
}

function New-NotionTextBlock {
    param(
        [Parameter(Mandatory)][string]$Type,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Text
    )
    return @{
        object = 'block'
        type   = $Type
        $Type  = @{ rich_text = (ConvertTo-NotionRichText -Text $Text) }
    }
}

function New-NotionCodeBlock {
    param(
        [Parameter(Mandatory)][AllowEmptyString()][string]$Text,
        [string]$Language = ''
    )
    $lang = if ([string]::IsNullOrWhiteSpace($Language)) { 'plain text' } else { $Language.Trim().ToLowerInvariant() }
    $segs = Split-RichTextContent -Text $Text
    $rich = @()
    foreach ($s in $segs) {
        $rich += @{ type = 'text'; text = @{ content = $s } }
    }
    if ($rich.Count -eq 0) {
        $rich = @(@{ type = 'text'; text = @{ content = '' } })
    }
    return @{
        object = 'block'
        type   = 'code'
        code   = @{
            rich_text = $rich
            language  = $lang
        }
    }
}

function ConvertTo-NotionTableBlocks {
    param($Rows)

    if ($null -eq $Rows -or $Rows.Count -eq 0) { return @() }

    $parsed = @()
    foreach ($row in $Rows) {
        $cells = @($row.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
        $parsed += , $cells
    }

    $sepIdx = -1
    for ($i = 0; $i -lt $parsed.Count; $i++) {
        $allSep = $true
        if ($parsed[$i].Count -eq 0) { $allSep = $false }
        foreach ($c in $parsed[$i]) {
            if ($c -notmatch '^:?-{2,}:?$') { $allSep = $false; break }
        }
        if ($allSep) { $sepIdx = $i; break }
    }

    if ($sepIdx -lt 1) {
        $rawMd = ($Rows -join "`n")
        return @((New-NotionTextBlock -Type 'paragraph' -Text $rawMd))
    }

    $width = $parsed[0].Count
    $tableRowBlocks = @()
    for ($i = 0; $i -lt $parsed.Count; $i++) {
        if ($i -eq $sepIdx) { continue }
        $cells = $parsed[$i]
        if ($cells.Count -ne $width) {
            $rawMd = ($Rows -join "`n")
            return @((New-NotionTextBlock -Type 'paragraph' -Text $rawMd))
        }
        $cellArr = @()
        foreach ($c in $cells) {
            $cellArr += , (ConvertTo-NotionRichText -Text $c)
        }
        $tableRowBlocks += @{
            object    = 'block'
            type      = 'table_row'
            table_row = @{ cells = $cellArr }
        }
    }

    return @(@{
            object = 'block'
            type   = 'table'
            table  = @{
                table_width       = $width
                has_column_header = $true
                has_row_header    = $false
                children          = $tableRowBlocks
            }
        })
}

function ConvertTo-NotionBlocks {
    param(
        [Parameter(Mandatory, Position = 0)]
        [AllowEmptyString()]
        [string]$Body
    )

    $blocks = New-Object System.Collections.ArrayList
    if ([string]::IsNullOrEmpty($Body)) { return , $blocks.ToArray() }

    $lines = ($Body -replace "`r`n", "`n").Split("`n")

    $inCode = $false
    $codeLang = ''
    $codeBuf = New-Object System.Collections.ArrayList
    $quoteBuf = New-Object System.Collections.ArrayList
    $tableBuf = New-Object System.Collections.ArrayList

    $flushQuote = {
        if ($quoteBuf.Count -gt 0) {
            [void]$blocks.Add((New-NotionTextBlock -Type 'quote' -Text ($quoteBuf -join "`n")))
            $quoteBuf.Clear()
        }
    }
    $flushTable = {
        if ($tableBuf.Count -gt 0) {
            foreach ($b in (ConvertTo-NotionTableBlocks -Rows $tableBuf)) { [void]$blocks.Add($b) }
            $tableBuf.Clear()
        }
    }

    foreach ($rawLine in $lines) {
        $line = $rawLine -replace "`r$", ''

        if ($line -match '^\s*```(.*)$') {
            if ($inCode) {
                $codeText = ($codeBuf -join "`n")
                [void]$blocks.Add((New-NotionCodeBlock -Text $codeText -Language $codeLang))
                $codeBuf.Clear()
                $codeLang = ''
                $inCode = $false
            }
            else {
                & $flushQuote
                & $flushTable
                $codeLang = $Matches[1].Trim()
                $inCode = $true
            }
            continue
        }

        if ($inCode) {
            [void]$codeBuf.Add($line)
            continue
        }

        if ([string]::IsNullOrWhiteSpace($line)) {
            & $flushQuote
            & $flushTable
            continue
        }

        if ($line -match '^\s*\|.*\|\s*$') {
            & $flushQuote
            [void]$tableBuf.Add($line.Trim())
            continue
        }
        elseif ($tableBuf.Count -gt 0) {
            & $flushTable
        }

        if ($line -match '^\s*([-*_])\1\1+\s*$') {
            & $flushQuote
            [void]$blocks.Add(@{ object = 'block'; type = 'divider'; divider = @{} })
            continue
        }

        if ($line -match '^\s*###\s+(.+)$') {
            & $flushQuote
            [void]$blocks.Add((New-NotionTextBlock -Type 'heading_3' -Text $Matches[1]))
            continue
        }
        if ($line -match '^\s*##\s+(.+)$') {
            & $flushQuote
            [void]$blocks.Add((New-NotionTextBlock -Type 'heading_2' -Text $Matches[1]))
            continue
        }
        if ($line -match '^\s*#\s+(.+)$') {
            & $flushQuote
            [void]$blocks.Add((New-NotionTextBlock -Type 'heading_1' -Text $Matches[1]))
            continue
        }

        if ($line -match '^\s*>\s?(.*)$') {
            [void]$quoteBuf.Add($Matches[1])
            continue
        }
        elseif ($quoteBuf.Count -gt 0) {
            & $flushQuote
        }

        if ($line -match '^\s*[-*+]\s+(.+)$') {
            [void]$blocks.Add((New-NotionTextBlock -Type 'bulleted_list_item' -Text $Matches[1]))
            continue
        }
        if ($line -match '^\s*\d+\.\s+(.+)$') {
            [void]$blocks.Add((New-NotionTextBlock -Type 'numbered_list_item' -Text $Matches[1]))
            continue
        }

        [void]$blocks.Add((New-NotionTextBlock -Type 'paragraph' -Text $line))
    }

    if ($inCode) {
        [void]$blocks.Add((New-NotionCodeBlock -Text ($codeBuf -join "`n") -Language $codeLang))
    }
    & $flushQuote
    & $flushTable

    return , $blocks.ToArray()
}
