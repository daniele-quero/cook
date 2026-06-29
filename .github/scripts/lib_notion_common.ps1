<#
.SYNOPSIS
    Helpers comuni per parlare con l'API Notion da PowerShell 7.

.DESCRIPTION
    Funzioni pure: token, normalizzazione ID, HTTP con retry, paginazione,
    chunking generico e split del rich_text rispettando il limite Notion.
    Nessun side-effect su dot-source: vengono solo definite funzioni.
#>

function Get-NotionToken {
    $token = $env:RECIPES_NOTION_TOKEN
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "Variabile ambiente RECIPES_NOTION_TOKEN non impostata o vuota."
    }
    return [string]$token
}

function ConvertTo-NotionId {
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Id
    )

    $clean = ($Id -replace '-', '').Trim().ToLowerInvariant()
    if ($clean.Length -ne 32 -or $clean -notmatch '^[0-9a-f]{32}$') {
        throw "ID Notion non valido: '$Id' (atteso 32 hex o UUID con trattini)."
    }
    return ('{0}-{1}-{2}-{3}-{4}' -f `
            $clean.Substring(0, 8), `
            $clean.Substring(8, 4), `
            $clean.Substring(12, 4), `
            $clean.Substring(16, 4), `
            $clean.Substring(20, 12))
}

function Split-IntoChunks {
    param(
        [Parameter(Mandatory, Position = 0)]
        [AllowEmptyCollection()]
        [object[]]$Items,

        [Parameter(Position = 1)]
        [int]$Size = 100
    )

    if ($Size -le 0) { throw "Size deve essere > 0." }

    $result = New-Object System.Collections.ArrayList
    if ($null -eq $Items -or $Items.Count -eq 0) {
        return , $result.ToArray()
    }

    for ($i = 0; $i -lt $Items.Count; $i += $Size) {
        $end = [Math]::Min($i + $Size - 1, $Items.Count - 1)
        $slice = @($Items[$i..$end])
        [void]$result.Add($slice)
    }
    return , $result.ToArray()
}

function Split-RichTextContent {
    param(
        [Parameter(Mandatory, Position = 0)]
        [AllowEmptyString()]
        [string]$Text,

        [Parameter(Position = 1)]
        [int]$MaxLength = 2000
    )

    if ($MaxLength -le 0) { throw "MaxLength deve essere > 0." }
    if ($null -eq $Text) { return , @('') }
    if ($Text.Length -le $MaxLength) { return , @($Text) }

    $segments = New-Object System.Collections.ArrayList
    $remaining = $Text
    $minBreak = [Math]::Floor($MaxLength * 0.5)

    while ($remaining.Length -gt $MaxLength) {
        $window = $remaining.Substring(0, $MaxLength)
        $splitIdx = $window.LastIndexOfAny([char[]]@(' ', "`t", "`n", "`r"))
        if ($splitIdx -lt $minBreak) {
            $splitIdx = $MaxLength
        }
        [void]$segments.Add($remaining.Substring(0, $splitIdx))
        $remaining = $remaining.Substring($splitIdx)
        if ($splitIdx -lt $MaxLength) {
            $remaining = $remaining.TrimStart()
        }
    }
    if ($remaining.Length -gt 0) {
        [void]$segments.Add($remaining)
    }
    return , $segments.ToArray()
}

function Invoke-NotionApi {
    param(
        [Parameter(Position = 0)]
        [string]$Method = 'GET',

        [Parameter(Mandatory, Position = 1)]
        [string]$Path,

        [Parameter(Position = 2)]
        $Body = $null,

        [int]$MaxRetries = 5
    )

    $token = Get-NotionToken
    if (-not $Path.StartsWith('/')) { $Path = "/$Path" }
    $uri = "https://api.notion.com$Path"

    $headers = @{
        Authorization    = "Bearer $token"
        'Notion-Version' = '2022-06-28'
        'Content-Type'   = 'application/json'
    }

    $jsonBody = $null
    if ($null -ne $Body) {
        if ($Body -is [string]) {
            $jsonBody = $Body
        }
        else {
            $jsonBody = $Body | ConvertTo-Json -Depth 50 -Compress
        }
    }

    $attempt = 0
    while ($true) {
        $attempt++
        $iwrParams = @{
            Method             = $Method
            Uri                = $uri
            Headers            = $headers
            SkipHttpErrorCheck = $true
            ErrorAction        = 'Stop'
        }
        if ($jsonBody) { $iwrParams.Body = $jsonBody }

        $response = Invoke-WebRequest @iwrParams
        $status = [int]$response.StatusCode
        $content = $response.Content

        if ($status -ge 200 -and $status -lt 300) {
            if ([string]::IsNullOrWhiteSpace($content)) { return $null }
            return ($content | ConvertFrom-Json)
        }

        if ($status -eq 429 -and $attempt -le $MaxRetries) {
            $retryAfter = 1.0
            try {
                if ($response.Headers -and $response.Headers['Retry-After']) {
                    $raw = $response.Headers['Retry-After']
                    if ($raw -is [array]) { $raw = $raw[0] }
                    $parsed = 0.0
                    if ([double]::TryParse([string]$raw, [ref]$parsed) -and $parsed -gt 0) {
                        $retryAfter = $parsed
                    }
                }
            }
            catch { }
            Start-Sleep -Seconds ([int][Math]::Ceiling($retryAfter))
            continue
        }

        if ($status -ge 500 -and $status -lt 600 -and $attempt -le $MaxRetries) {
            $backoff = [Math]::Pow(2, $attempt - 1)
            if ($backoff -gt 8) { $backoff = 8 }
            Start-Sleep -Seconds ([int]$backoff)
            continue
        }

        $errCode = ''
        $errMessage = $content
        try {
            $parsed = $content | ConvertFrom-Json -ErrorAction Stop
            if ($parsed.code) { $errCode = [string]$parsed.code }
            if ($parsed.message) { $errMessage = [string]$parsed.message }
        }
        catch { }

        throw "[Notion API] $status $errCode`: $errMessage"
    }
}

function Get-NotionPaged {
    param(
        [Parameter(Mandatory, Position = 0)]
        [string]$Path,

        [Parameter(Position = 1)]
        $InitialBody = $null
    )

    $results = New-Object System.Collections.ArrayList
    $cursor = $null
    $isQuery = $null -ne $InitialBody

    while ($true) {
        if ($isQuery) {
            $body = @{}
            if ($InitialBody -is [hashtable]) {
                foreach ($k in $InitialBody.Keys) { $body[$k] = $InitialBody[$k] }
            }
            if ($cursor) { $body['start_cursor'] = $cursor }
            if (-not $body.ContainsKey('page_size')) { $body['page_size'] = 100 }
            $page = Invoke-NotionApi -Method 'POST' -Path $Path -Body $body
        }
        else {
            $sep = if ($Path.Contains('?')) { '&' } else { '?' }
            $url = "${Path}${sep}page_size=100"
            if ($cursor) {
                $url = "$url&start_cursor=$([uri]::EscapeDataString($cursor))"
            }
            $page = Invoke-NotionApi -Method 'GET' -Path $url
        }

        if ($page -and $page.results) {
            foreach ($r in $page.results) { [void]$results.Add($r) }
        }
        if ($page -and $page.has_more -and $page.next_cursor) {
            $cursor = [string]$page.next_cursor
        }
        else {
            break
        }
    }
    return , $results.ToArray()
}
