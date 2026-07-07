param(
    [string]$SourceUrl = "https://raw.githubusercontent.com/ZOOT-Plus/zoot-plus-frontend/refs/heads/dev/src/models/generated/operators.json",
    [string]$SourcePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"
$operatorSourcePath = Join-Path $repoRoot "src/data/operators.generated.js"
$operatorDataPath = Join-Path $PSScriptRoot "operator-data.generated.json"
$operatorAuditPath = Join-Path $PSScriptRoot "operator-data-update-summary.json"
$buildScriptPath = Join-Path $PSScriptRoot "build-userscript.ps1"
$temporaryOperatorPattern = "^char_(50[4-9]|51[0-4]|60[0-9]|61[0-7])_"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Get-StringValue($value) {
    if ($null -eq $value) {
        return ""
    }

    return ([string]$value).Trim()
}

function Get-SourceData {
    if (-not [string]::IsNullOrWhiteSpace($SourcePath)) {
        $resolvedSourcePath = Resolve-Path $SourcePath
        $script:operatorUpdateSource = [string]$resolvedSourcePath
        $script:operatorUpdateSourceKind = "file"
        Write-Host "Reading operator source from $resolvedSourcePath"
        return Get-Content -LiteralPath $resolvedSourcePath -Raw -Encoding UTF8 | ConvertFrom-Json
    }

    $script:operatorUpdateSource = $SourceUrl
    $script:operatorUpdateSourceKind = "url"
    Write-Host "Downloading operator source from $SourceUrl"
    return Invoke-RestMethod -Uri $SourceUrl -TimeoutSec 30
}

function Get-OperatorRecords {
    param([object]$sourceData)

    if ($null -eq $sourceData) {
        throw "Operator source is empty"
    }

    if ($sourceData -is [System.Array]) {
        return $sourceData
    }

    $propertyNames = @($sourceData.PSObject.Properties.Name)
    if ($propertyNames -contains "OPERATORS") {
        return @($sourceData.OPERATORS)
    }

    return @($sourceData)
}

function ConvertTo-GeneratedOperators {
    param([object]$sourceData)

    $generated = [System.Collections.Generic.List[object]]::new()
    foreach ($record in (Get-OperatorRecords -sourceData $sourceData)) {
        $id = Get-StringValue $record.id
        $name = Get-StringValue $record.name
        $profession = Get-StringValue $record.prof

        if (-not $id.StartsWith("char_", [System.StringComparison]::Ordinal)) {
            continue
        }
        if ([string]::IsNullOrWhiteSpace($name)) {
            continue
        }
        if ($profession -eq "TOKEN") {
            continue
        }
        if ($id -match $temporaryOperatorPattern) {
            continue
        }

        $generated.Add([pscustomobject]@{
            id = $id
            name = $name
        })
    }

    $generated.Sort([System.Comparison[object]]{
        param($left, $right)
        [System.StringComparer]::Ordinal.Compare([string]$left.id, [string]$right.id)
    })

    return @($generated)
}

function Test-GeneratedOperators {
    param([object[]]$operators)

    if ($operators.Count -eq 0) {
        throw "Generated operator table is empty"
    }

    $duplicateNames = $operators | Group-Object name | Where-Object Count -gt 1
    if ($duplicateNames) {
        $names = ($duplicateNames | ForEach-Object { "$($_.Name) x$($_.Count)" }) -join ", "
        throw "Generated operator data has duplicate names: $names"
    }

    $duplicateIds = $operators | Group-Object id | Where-Object Count -gt 1
    if ($duplicateIds) {
        $ids = ($duplicateIds | ForEach-Object { "$($_.Name) x$($_.Count)" }) -join ", "
        throw "Generated operator data has duplicate ids: $ids"
    }
}

function Convert-NewLine($text, $newline) {
    return [regex]::Replace($text, "\r\n|\n|\r", $newline)
}

function Replace-Match($text, $match, $replacement) {
    return $text.Substring(0, $match.Index) + $replacement + $text.Substring($match.Index + $match.Length)
}

function Update-OperatorSourceBlock {
    param([object[]]$operators)

    if (-not (Test-Path -LiteralPath $operatorSourcePath)) {
        throw "Cannot find operator source at $operatorSourcePath"
    }

    $operatorSource = [System.IO.File]::ReadAllText($operatorSourcePath, [System.Text.Encoding]::UTF8)
    $newline = if ($operatorSource.Contains("`r`n")) { "`r`n" } else { "`n" }
    $inlineJson = $operators | ConvertTo-Json -Compress -Depth 4
    $generatedBlock = @(
        "    // BEGIN GENERATED OPERATOR DATA"
        "    const RAW_OPS = $inlineJson"
        "    // END GENERATED OPERATOR DATA"
    ) -join $newline

    $markedPattern = "(?ms)^[ \t]*// BEGIN GENERATED OPERATOR DATA\r?\n\s*const RAW_OPS = \[.*?\]\s*\r?\n[ \t]*// END GENERATED OPERATOR DATA"
    $markedMatch = [regex]::Match($operatorSource, $markedPattern)
    if ($markedMatch.Success) {
        $updatedSource = Replace-Match $operatorSource $markedMatch $generatedBlock
        [System.IO.File]::WriteAllText($operatorSourcePath, $updatedSource, $utf8NoBom)
        return
    }

    $legacyPattern = "(?ms)^[ \t]*const RAW_OPS = \[.*?\]\s*(?=\r?\n[ \t]*const OP_ID_MAP)"
    $legacyMatch = [regex]::Match($operatorSource, $legacyPattern)
    if (-not $legacyMatch.Success) {
        throw "Cannot find RAW_OPS block in src/data/operators.generated.js"
    }

    $updatedLegacySource = Replace-Match $operatorSource $legacyMatch $generatedBlock
    [System.IO.File]::WriteAllText($operatorSourcePath, $updatedLegacySource, $utf8NoBom)
}

function Read-ExistingGeneratedOperators {
    if (-not (Test-Path -LiteralPath $operatorDataPath)) {
        return @()
    }

    $raw = Get-Content -LiteralPath $operatorDataPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($raw -is [System.Array]) {
        return @($raw)
    }
    return @($raw)
}

function New-OperatorMap {
    param([object[]]$operators)

    $map = @{}
    foreach ($operator in $operators) {
        $id = Get-StringValue $operator.id
        if (-not [string]::IsNullOrWhiteSpace($id)) {
            $map[$id] = $operator
        }
    }
    return $map
}

function New-OperatorAuditSummary {
    param(
        [object[]]$PreviousOperators,
        [object[]]$CurrentOperators
    )

    $previousMap = New-OperatorMap -operators $PreviousOperators
    $currentMap = New-OperatorMap -operators $CurrentOperators
    $added = [System.Collections.Generic.List[object]]::new()
    $removed = [System.Collections.Generic.List[object]]::new()
    $renamed = [System.Collections.Generic.List[object]]::new()

    foreach ($operator in $CurrentOperators) {
        $id = Get-StringValue $operator.id
        if (-not $previousMap.ContainsKey($id)) {
            $added.Add([pscustomobject]@{
                id = $id
                name = Get-StringValue $operator.name
            })
            continue
        }

        $previousName = Get-StringValue $previousMap[$id].name
        $currentName = Get-StringValue $operator.name
        if ($previousName -ne $currentName) {
            $renamed.Add([pscustomobject]@{
                id = $id
                oldName = $previousName
                newName = $currentName
            })
        }
    }

    foreach ($operator in $PreviousOperators) {
        $id = Get-StringValue $operator.id
        if (-not $currentMap.ContainsKey($id)) {
            $removed.Add([pscustomobject]@{
                id = $id
                name = Get-StringValue $operator.name
            })
        }
    }

    return [pscustomobject]@{
        source = $script:operatorUpdateSource
        sourceKind = $script:operatorUpdateSourceKind
        generatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
        previousCount = $PreviousOperators.Count
        newCount = $CurrentOperators.Count
        delta = $CurrentOperators.Count - $PreviousOperators.Count
        addedCount = $added.Count
        removedCount = $removed.Count
        renamedCount = $renamed.Count
        added = @($added.ToArray())
        removed = @($removed.ToArray())
        renamed = @($renamed.ToArray())
    }
}

function Format-OperatorAuditNames {
    param(
        [object[]]$items,
        [string]$nameProperty = "name"
    )

    if ($items.Count -eq 0) {
        return "none"
    }

    $names = @($items | Select-Object -First 12 | ForEach-Object {
        $name = Get-StringValue $_.$nameProperty
        $id = Get-StringValue $_.id
        if ($name) { "$name ($id)" } else { $id }
    })
    if ($items.Count -gt 12) {
        $names += "... +$($items.Count - 12) more"
    }
    return $names -join ", "
}

function Write-OperatorAuditSummary {
    param([object]$summary)

    $auditJson = $summary | ConvertTo-Json -Depth 6
    $auditJson = Convert-NewLine $auditJson "`r`n"
    [System.IO.File]::WriteAllText($operatorAuditPath, "$auditJson`r`n", $utf8NoBom)

    Write-Host "Operator data audit:"
    Write-Host "  Source: $($summary.source)"
    Write-Host "  Generated at UTC: $($summary.generatedAtUtc)"
    Write-Host "  Count: $($summary.previousCount) -> $($summary.newCount) (delta $($summary.delta))"
    Write-Host "  Added: $($summary.addedCount) - $(Format-OperatorAuditNames -items $summary.added)"
    Write-Host "  Removed: $($summary.removedCount) - $(Format-OperatorAuditNames -items $summary.removed)"
    if ($summary.renamedCount -gt 0) {
        $renamedPreview = @($summary.renamed | Select-Object -First 12 | ForEach-Object {
            "$($_.oldName) -> $($_.newName) ($($_.id))"
        }) -join ", "
        if ($summary.renamedCount -gt 12) {
            $renamedPreview += ", ... +$($summary.renamedCount - 12) more"
        }
    } else {
        $renamedPreview = "none"
    }
    Write-Host "  Renamed: $($summary.renamedCount) - $renamedPreview"
    Write-Host "  Audit summary: $operatorAuditPath"
}

$previousOperators = Read-ExistingGeneratedOperators
$sourceData = Get-SourceData
$operators = ConvertTo-GeneratedOperators -sourceData $sourceData
Test-GeneratedOperators -operators $operators
$auditSummary = New-OperatorAuditSummary -PreviousOperators $previousOperators -CurrentOperators $operators

$json = $operators | ConvertTo-Json -Depth 4
$json = Convert-NewLine $json "`r`n"
[System.IO.File]::WriteAllText($operatorDataPath, "$json`r`n", $utf8NoBom)

Update-OperatorSourceBlock -operators $operators
& $buildScriptPath
Write-OperatorAuditSummary -summary $auditSummary

Write-Host "Generated $($operators.Count) operators"
Write-Host "Updated $operatorDataPath"
Write-Host "Updated $operatorAuditPath"
Write-Host "Updated $operatorSourcePath"
Write-Host "Updated $userScriptPath"
