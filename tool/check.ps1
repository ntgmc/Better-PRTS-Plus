$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"
$readmePath = Join-Path $repoRoot "README.md"

Write-Host "Checking userscript syntax..."
node --check $userScriptPath
if ($LASTEXITCODE -ne 0) {
    throw "node --check failed"
}

$userScript = Get-Content -LiteralPath $userScriptPath -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8

Write-Host "Checking version badge..."
$versionMatch = [regex]::Match($userScript, "(?m)^//\s*@version\s+([0-9]+(?:\.[0-9]+){1,3}(?:[-+][0-9A-Za-z.-]+)?)\s*$")
if (-not $versionMatch.Success) {
    throw "Cannot find @version in Better-PRTS-Plus.user.js"
}

$version = $versionMatch.Groups[1].Value
$badgePattern = "https://img\.shields\.io/badge/Version-$([regex]::Escape($version))-blue\.svg\?style=flat-square"
if ($readme -notmatch $badgePattern) {
    throw "README version badge is not synced to $version"
}

Write-Host "Checking operator table..."
$opsMatch = [regex]::Match(
    $userScript,
    "const RAW_OPS = (\[.*?\])\s*\r?\n\s*const OP_ID_MAP",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
if (-not $opsMatch.Success) {
    throw "Cannot find RAW_OPS table"
}

$ops = $opsMatch.Groups[1].Value | ConvertFrom-Json
$duplicateNames = $ops | Group-Object name | Where-Object Count -gt 1
if ($duplicateNames) {
    $names = ($duplicateNames | ForEach-Object { "$($_.Name) x$($_.Count)" }) -join ", "
    throw "Duplicate operator names: $names"
}

$duplicateIds = $ops | Group-Object id | Where-Object Count -gt 1
if ($duplicateIds) {
    $ids = ($duplicateIds | ForEach-Object { "$($_.Name) x$($_.Count)" }) -join ", "
    throw "Duplicate operator ids: $ids"
}

Write-Host "Checking import parser guards..."
if ($userScript -notmatch "function parseImportedOperatorNames") {
    throw "Missing parseImportedOperatorNames"
}
if ($userScript -match "\\u4e00-\\u9fa5") {
    throw "Import parsing still contains the old narrow CJK whitelist"
}
if ($userScript -notmatch "const operationCache = new WeakMap\(\)") {
    throw "Missing operation cache"
}
if ($userScript -notmatch "function getOperationForCard") {
    throw "Missing cached operation resolver"
}
if ($userScript -notmatch "labelDiv\.dataset\.opsProcessed = `"true`"") {
    throw "Missing operator visual processing marker"
}
if ($userScript -notmatch "function updateStatusLabel") {
    throw "Missing safe status label renderer"
}
if ($userScript -match "existingLabel\.innerHTML|labelDiv\.innerHTML = new") {
    throw "Status labels should not be rendered with innerHTML"
}
if ($userScript -notmatch "GM_setValue\(FILTER_MODE_KEY, currentFilterMode\)") {
    throw "Filter mode persistence is missing"
}
if ($userScript -notmatch "function scheduleFilterUpdate") {
    throw "Missing unified filter scheduler"
}
if ($userScript -notmatch "function handleRouteChange") {
    throw "Missing route-change refresh handler"
}
if ($userScript -notmatch "function hasRelevantDomMutation") {
    throw "Missing relevant DOM mutation filter"
}
if ($userScript -notmatch "addEventListener\('pointerdown'") {
    throw "Floating ball should use pointer events"
}
if ($userScript -match "addEventListener\('mousedown'|addEventListener\('mousemove'|addEventListener\('mouseup'") {
    throw "Floating ball still uses mouse-only drag events"
}
if ($userScript -notmatch "setInterval\(\(\) => \{[\s\S]*\}, 3000\)") {
    throw "Fallback interval should run at the reduced 3000ms cadence"
}

$specialCases = @(
    @{ id = "char_1019_siege2"; contains = [char]0x00B7 },
    @{ id = "char_4227_gallus"; contains = [char]0x00B2 },
    @{ id = "char_4198_christ"; contains = "." },
    @{ id = "char_4091_ulika"; contains = "-" },
    @{ id = "char_4136_phonor"; contains = "-" }
)
foreach ($case in $specialCases) {
    $op = $ops | Where-Object id -eq $case.id | Select-Object -First 1
    if (-not $op) {
        throw "Expected special-name operator id missing from RAW_OPS: $($case.id)"
    }
    if ($op.name.IndexOf([string]$case.contains, [System.StringComparison]::Ordinal) -lt 0) {
        throw "Expected operator $($case.id) to contain special character $($case.contains)"
    }
    if ([string]::IsNullOrWhiteSpace($op.name) -or $op.name.Length -gt 50 -or $op.name -match "[\x00-\x1F\x7F]") {
        throw "Special-name import guard would reject operator id: $($case.id)"
    }
}

Write-Host "All checks passed for Better-PRTS-Plus $version"
