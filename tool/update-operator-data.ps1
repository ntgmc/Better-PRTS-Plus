param(
    [string]$SourceUrl = "https://raw.githubusercontent.com/ZOOT-Plus/zoot-plus-frontend/refs/heads/dev/src/models/generated/operators.json",
    [string]$SourcePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"
$operatorSourcePath = Join-Path $repoRoot "src/data/operators.generated.js"
$operatorDataPath = Join-Path $PSScriptRoot "operator-data.generated.json"
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
        Write-Host "Reading operator source from $resolvedSourcePath"
        return Get-Content -LiteralPath $resolvedSourcePath -Raw -Encoding UTF8 | ConvertFrom-Json
    }

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

$sourceData = Get-SourceData
$operators = ConvertTo-GeneratedOperators -sourceData $sourceData
Test-GeneratedOperators -operators $operators

$json = $operators | ConvertTo-Json -Depth 4
$json = Convert-NewLine $json "`r`n"
[System.IO.File]::WriteAllText($operatorDataPath, "$json`r`n", $utf8NoBom)

Update-OperatorSourceBlock -operators $operators
& $buildScriptPath

Write-Host "Generated $($operators.Count) operators"
Write-Host "Updated $operatorDataPath"
Write-Host "Updated $operatorSourcePath"
Write-Host "Updated $userScriptPath"
