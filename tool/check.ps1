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
if ($userScript -notmatch "function isOwnedOperatorRecord") {
    throw "Missing owned operator record normalizer"
}
if ($userScript -notmatch "if\s*\(parsed !== null\)\s*return parseOperatorNamesFromJson\(parsed\)") {
    throw "JSON imports should return parsed operators instead of falling through to text parsing"
}
if ($userScript -match "isTxtFile") {
    throw "TXT files should still attempt JSON parsing before text fallback"
}
if ($userScript -match "op\??\.own !== false") {
    throw "Owned operator checks should use isOwnedOperatorRecord"
}
if ($userScript -match "\\u4e00-\\u9fa5") {
    throw "Import parsing still contains the old narrow CJK whitelist"
}
Write-Host "Checking Skland import flow..."
if ($userScript -notmatch "@match\s+https://www\.skland\.com/\*") {
    throw "Missing Skland userscript match"
}
if ($userScript -notmatch "@grant\s+GM_addValueChangeListener") {
    throw "Missing GM_addValueChangeListener grant"
}
if ($userScript -notmatch "function init\(\)\s*\{[\s\S]*isSklandHost\(\)[\s\S]*initSklandImportPage\(\)") {
    throw "Missing Skland initialization branch"
}
if ($userScript -notmatch "function registerAccountsDataChangeListener\(\)[\s\S]*GM_addValueChangeListener\(ACCOUNTS_DATA_KEY" -or
    $userScript -notmatch "function refreshOwnedOpsFromStorage\(\)[\s\S]*loadOwnedOps\(\)[\s\S]*injectFilterControls\(\)[\s\S]*requestFilterUpdate\(\)") {
    throw "Missing cross-tab account data refresh"
}
if ($userScript -notmatch "localStorage\.getItem\('SK_OAUTH_CRED_KEY'\)") {
    throw "Missing SK_OAUTH_CRED_KEY storage read"
}
foreach ($endpoint in @('/api/v1/auth/refresh', '/api/v1/game/player/binding', '/api/v1/game/player/info')) {
    if ($userScript -notmatch [regex]::Escape($endpoint)) {
        throw "Missing Skland endpoint: $endpoint"
    }
}
if ($userScript -notmatch "function hmacSha256Hex" -or $userScript -notmatch "function md5Hex") {
    throw "Missing Skland request signing helpers"
}
if ($userScript -notmatch "const SKLAND_FAVICON_SVG = '<svg" -or
    $userScript -notmatch "skland:\s*SKLAND_FAVICON_SVG" -or
    $userScript -notmatch 'viewBox="0 0 16 16"' -or
    $userScript -notmatch "svgPath\.startsWith\('<svg'\)" -or
    $userScript -notmatch "function createSklandIconImage") {
    throw "Skland import buttons should use the inline Skland favicon SVG"
}
if ($userScript -match "M17\.9 4\.9") {
    throw "Skland favicon SVG should be generated from the favicon instead of using the placeholder path"
}
if ($userScript -match "skland:\s*SKLAND_FAVICON_32_DATA_URI") {
    throw "Skland import buttons should not rely on a data URI image"
}
if ($userScript -match "GM_setValue\([^\r\n]*(?:cred|credential|token)") {
    throw "Skland credentials or tokens must not be persisted"
}
$importSamplePath = Join-Path $PSScriptRoot "test.txt"
if (Test-Path -LiteralPath $importSamplePath) {
 $sampleOperators = Get-Content -LiteralPath $importSamplePath -Raw -Encoding UTF8 | ConvertFrom-Json
 if ($sampleOperators.Count -ne 418) {
  throw "Import sample should contain 418 operator records"
 }
 $sampleOwnedCount = @($sampleOperators | Where-Object { $_.own -eq $true } | Select-Object -ExpandProperty name -Unique).Count
 if ($sampleOwnedCount -ne 396) {
  throw "Import sample should resolve to 396 owned operators"
 }
}
if ($userScript -notmatch "const operationCache = new WeakMap\(\)") {
    throw "Missing operation cache"
}
if ($userScript -notmatch "function getOperationForCard") {
    throw "Missing cached operation resolver"
}
if ($userScript -match "card\.innerText|cloneNode\(true\)") {
    throw "Card cache signatures should not include script UI or clone entire cards"
}
if ($userScript -notmatch "function getCardSignature[\s\S]*prts-status-label[\s\S]*prts-video-box") {
    throw "Card cache signature should ignore script-owned card UI"
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
if ($userScript -notmatch "function extractAndRemoveBilibiliUrl") {
    throw "Missing DOM-based Bilibili URL extraction"
}
if ($userScript -notmatch "document\.createTreeWalker") {
    throw "Bilibili URL extraction should inspect text nodes with TreeWalker"
}
if ($userScript -match "descContainer\.innerHTML|linkBtn\.innerHTML") {
    throw "Bilibili description/link cleanup should not use innerHTML"
}
if ($userScript -notmatch "function createDialogTag") {
    throw "Missing DOM-based dialog tag builder"
}
if ($userScript -match "h2\.innerHTML|tagHtml") {
    throw "Dialog tags should not be rendered with innerHTML"
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
Write-Host "Checking Blueprint v4/v6 compatibility selectors..."
foreach ($selector in @(
    ".bp4-input-group, .bp6-input-group",
    ".bp4-card, .bp6-card",
    ".bp4-tag, .bp6-tag",
    ".bp4-portal, .bp6-portal"
)) {
    if ($userScript -notmatch [regex]::Escape($selector)) {
        throw "Missing Blueprint compatibility selector: $selector"
    }
}
if ($userScript -notmatch "function injectFilterControls\(\)[\s\S]*findSearchInputGroup\(\)" -or
    $userScript -notmatch "function injectFilterControls\(\)[\s\S]*#prts-filter-bar") {
    throw "Filter controls should use the unified Blueprint-compatible injection path"
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
if ($userScript -notmatch "function matchOperatorGroups") {
    throw "Missing operator group matching algorithm"
}
if ($userScript -match "groupProcessList") {
    throw "Old greedy operator group algorithm is still present"
}

function Test-OperatorGroupMatching {
    $owned = [System.Collections.Generic.HashSet[string]]::new()
    @("A", "B") | ForEach-Object { [void]$owned.Add($_) }
    $used = [System.Collections.Generic.HashSet[string]]::new()
    $groups = @(
        @{ name = "wide"; candidates = @("A", "B") },
        @{ name = "narrow"; candidates = @("A") }
    )
    $matchedByOperator = @{}

    function TryAssignGroup($group, $seen) {
        foreach ($name in $group.candidates) {
            if (-not $owned.Contains($name) -or $used.Contains($name) -or $seen.Contains($name)) {
                continue
            }
            [void]$seen.Add($name)
            $previousGroup = $matchedByOperator[$name]
            if (-not $previousGroup -or (TryAssignGroup $previousGroup $seen)) {
                $matchedByOperator[$name] = $group
                return $true
            }
        }
        return $false
    }

    foreach ($group in $groups) {
        if (-not (TryAssignGroup $group ([System.Collections.Generic.HashSet[string]]::new()))) {
            return $false
        }
    }
    return $matchedByOperator.Count -eq 2
}

if (-not (Test-OperatorGroupMatching)) {
    throw "Operator group matching regression sample failed"
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
