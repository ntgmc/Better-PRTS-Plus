$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"
$readmePath = Join-Path $repoRoot "README.md"
$operatorDataPath = Join-Path $PSScriptRoot "operator-data.generated.json"
$buildScriptPath = Join-Path $PSScriptRoot "build-userscript.ps1"
$coreTestScriptPath = Join-Path $PSScriptRoot "test-core.js"

Write-Host "Checking userscript build output..."
& $buildScriptPath -Check -NoSyntaxCheck

Write-Host "Checking userscript syntax..."
node --check $userScriptPath
if ($LASTEXITCODE -ne 0) {
    throw "node --check failed"
}

Write-Host "Running core function tests..."
node $coreTestScriptPath
if ($LASTEXITCODE -ne 0) {
    throw "Core function tests failed"
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
$generatedOpsMatch = [regex]::Match(
    $userScript,
    "// BEGIN GENERATED OPERATOR DATA\s*\r?\n\s*const RAW_OPS = (\[.*?\])\s*\r?\n\s*// END GENERATED OPERATOR DATA\s*\r?\n\s*const OP_ID_MAP",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
if (-not $generatedOpsMatch.Success) {
    throw "Cannot find generated RAW_OPS table"
}

if (-not (Test-Path -LiteralPath $operatorDataPath)) {
    throw "Cannot find generated operator data at $operatorDataPath; run tool/update-operator-data.ps1"
}

$opsRaw = Get-Content -LiteralPath $operatorDataPath -Raw -Encoding UTF8 | ConvertFrom-Json
$ops = if ($opsRaw -is [System.Array]) { $opsRaw } else { @($opsRaw) }
if ($ops.Count -eq 0) {
    throw "Generated operator data is empty"
}

for ($i = 0; $i -lt $ops.Count; $i++) {
    $op = $ops[$i]
    $id = [string]$op.id
    $name = [string]$op.name

    if ([string]::IsNullOrWhiteSpace($id) -or -not $id.StartsWith("char_", [System.StringComparison]::Ordinal)) {
        throw "Invalid operator id at generated index ${i}: '$id'"
    }
    if ([string]::IsNullOrWhiteSpace($name)) {
        throw "Invalid empty operator name at generated index $i"
    }
    if ($name.Length -gt 50 -or $name -match "[\x00-\x1F\x7F]") {
        throw "Invalid operator name at generated index ${i}: '$name'"
    }
}

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

$embeddedOpsRaw = $generatedOpsMatch.Groups[1].Value | ConvertFrom-Json
$embeddedOps = if ($embeddedOpsRaw -is [System.Array]) { $embeddedOpsRaw } else { @($embeddedOpsRaw) }
if ($embeddedOps.Count -ne $ops.Count) {
    throw "Embedded RAW_OPS count $($embeddedOps.Count) does not match generated operator data count $($ops.Count); run tool/update-operator-data.ps1"
}

for ($i = 0; $i -lt $ops.Count; $i++) {
    if ([string]$embeddedOps[$i].id -ne [string]$ops[$i].id -or [string]$embeddedOps[$i].name -ne [string]$ops[$i].name) {
        throw "Embedded RAW_OPS differs from generated operator data at index $i; run tool/update-operator-data.ps1"
    }
}

if ($userScript -notmatch "function reportUnknownOperatorName" -or
    $userScript -notmatch "BetterPRTSPlusDebug" -or
    $userScript -notmatch "getUnknownOperators") {
    throw "Missing unknown operator debug reporting"
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
Write-Host "Checking import experience flow..."
foreach ($requiredFunction in @(
    "showPrtsToast",
    "createPrtsButton",
    "createPrtsSwitch",
    "getFocusableDialogElements",
    "showPrtsConfirm",
    "showPrtsPrompt",
    "openOperatorImportDialog",
    "readOperatorImportFile",
    "applyImportedOperatorNames",
    "getOperatorImportDiff",
    "setOperatorImportStatus"
)) {
    if ($userScript -notmatch "function $requiredFunction") {
        throw "Missing import experience helper: $requiredFunction"
    }
}
$forbiddenUiGlyphs = @(
    [string]::Concat([char]0xD83D, [char]0xDDBC, [char]0xFE0F),
    [string]::Concat([char]0xD83D, [char]0xDD17),
    [string]::Concat([char]0xD83D, [char]0xDDC2, [char]0xFE0F),
    [string]::Concat([char]0xD83D, [char]0xDC64),
    [string]::Concat([char]0xD83D, [char]0xDCC2),
    [string]::Concat([char]0x2699, [char]0xFE0F),
    [string]::Concat([char]0x2718)
)
foreach ($glyph in $forbiddenUiGlyphs) {
    if ($userScript.Contains($glyph)) {
        throw "Script UI should use registered SVG icons instead of legacy emoji/text glyph controls"
    }
}
foreach ($requiredUiToken in @(
    "const PRTS_ICON_PATHS",
    "--prts-color-primary",
    "--prts-space-2",
    "--prts-z-float",
    "controlBar.setAttribute('role', 'toolbar')",
    "aria-pressed",
    "btn.setAttribute('aria-expanded', 'false')",
    "panel.id = 'prts-settings-panel'",
    "createPrtsIcon('close')",
    "@media (prefers-reduced-motion: reduce)"
)) {
    if ($userScript -notmatch [regex]::Escape($requiredUiToken)) {
        throw "Missing UI optimization token or accessibility hook: $requiredUiToken"
    }
}
if ($userScript -notmatch "function createFloatingBall\(\)[\s\S]*document\.createElement\('button'\)[\s\S]*prts-float-btn") {
    throw "Floating settings control should be rendered as an accessible button"
}
$handleImportFunction = [regex]::Match($userScript, "function handleImport\(\)\s*\{[\s\S]*?\r?\n\s*\}")
if (-not $handleImportFunction.Success -or $handleImportFunction.Value -notmatch "openOperatorImportDialog\(\)") {
    throw "Operator import button should open the inline import dialog"
}
if ($handleImportFunction.Value -match "\balert\s*\(") {
    throw "Operator import entrypoint should not use blocking alert feedback"
}
$operatorImportFlow = [regex]::Match($userScript, "function getImportErrorMessage\(\)[\s\S]*?\r?\n\s*function handleOpenSklandImport\(\)").Value
if ($operatorImportFlow -match "\balert\s*\(") {
    throw "Operator import flow should use toast/status feedback instead of alerts"
}
if ($userScript -match "\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML") {
    throw "Script UI should be rendered with DOM nodes instead of HTML string assignment"
}
if ($userScript -match "\b(?:alert|prompt|confirm)\s*\(") {
    throw "Blocking browser dialogs should be replaced with Toast/Modal feedback"
}
$diffSummaryFunction = [regex]::Match($userScript, "function formatOperatorImportDiff\([^)]*\)[\s\S]*?\r?\n\s*function setOperatorImportStatus")
$summaryTokens = @(
    [string]::Concat([char]0x65B0, [char]0x589E),
    [string]::Concat([char]0x79FB, [char]0x9664),
    [string]::Concat([char]0x5F53, [char]0x524D),
    "diff\.added",
    "diff\.removed",
    "diff\.total"
)
if (-not $diffSummaryFunction.Success) {
    throw "Operator import success summary should include added, removed, and current totals"
}
foreach ($summaryToken in $summaryTokens) {
    if ($diffSummaryFunction.Value -notmatch $summaryToken) {
        throw "Operator import success summary should include added, removed, and current totals"
    }
}
if ($userScript -notmatch "container\.setAttribute\('aria-live', 'polite'\)" -or
    $userScript -notmatch "status\.setAttribute\('aria-live', 'polite'\)" -or
    $userScript -notmatch "statusEl\.setAttribute\('aria-live'") {
    throw "Import toast and status feedback should expose aria-live announcements"
}
foreach ($ownedSelector in @(
    "#prts-toast-container",
    "#prts-import-dialog",
    "#prts-import-dialog-backdrop",
    "#prts-modal",
    "#prts-modal-backdrop",
    ".prts-import-status"
)) {
    if ($userScript -notmatch [regex]::Escape($ownedSelector)) {
        throw "Script-owned mutation whitelist missing import selector: $ownedSelector"
    }
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
foreach ($requiredSklandBindingFunction in @(
    "getSklandArknightsBindingOptionsFromList",
    "normalizeSklandArknightsBindings",
    "selectSklandBindingOption",
    "showSklandBindingPicker",
    "isSklandImportCancelledError"
)) {
    if ($userScript -notmatch "function $requiredSklandBindingFunction") {
        throw "Missing Skland multi-role helper: $requiredSklandBindingFunction"
    }
}
if ($userScript -notmatch "function importSklandOperatorsToAccount\(accountId, options = \{\}\)[\s\S]*resolveSklandImportBinding" -or
    $userScript -notmatch "function resolveSklandImportBinding\([^)]*\)[\s\S]*options\.selectBinding") {
    throw "Skland import should resolve multi-role bindings through an optional selectBinding callback"
}
if ($userScript -notmatch "function createSklandImportPanel\(\)[\s\S]*selectBinding:[\s\S]*showSklandBindingPicker") {
    throw "Skland import panel should open the multi-role picker when multiple roles are available"
}
if ($userScript -notmatch "function showSklandBindingPicker\([^)]*\)[\s\S]*prts-skland-binding-list" -or
    $userScript -notmatch "function showSklandBindingPicker\([^)]*\)[\s\S]*type = 'radio'" -or
    $userScript -notmatch "function showSklandBindingPicker\([^)]*\)[\s\S]*UID ") {
    throw "Skland role picker should render accessible role choices with nickname, UID, and channel"
}
if ($userScript -notmatch "const SKLAND_FAVICON_SVG = '<svg" -or
    $userScript -notmatch "skland:\s*'skland'" -or
    $userScript -notmatch 'viewBox="0 0 16 16"' -or
    $userScript -notmatch "function createSklandIconImage" -or
    $userScript -notmatch "new DOMParser\(\)\.parseFromString\(SKLAND_FAVICON_SVG") {
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
Write-Host "Checking account metadata and backup flow..."
foreach ($requiredFunction in @(
    "createDefaultAccountMeta",
    "normalizeAccountMeta",
    "normalizeSklandSyncMeta",
    "normalizeSklandImportSummary",
    "getAccountSklandSyncMeta",
    "updateAccountSklandSyncMeta",
    "getAccountSklandImportSummary",
    "formatSklandSyncTime",
    "formatSklandSyncSummary",
    "formatAccountSklandTitle",
    "getAccountLabel",
    "renameAccount",
    "updateAccountLabelFromSkland",
    "buildAccountsBackup",
    "parseAccountsBackup",
    "applyAccountsBackup",
    "handleExportAccountsBackup",
    "handleImportAccountsBackup"
)) {
    if ($userScript -notmatch "function $requiredFunction") {
        throw "Missing account management helper: $requiredFunction"
    }
}
if ($userScript -notmatch "GM_setValue\(ACCOUNTS_DATA_KEY,[\s\S]*accountMeta") {
    throw "Account metadata should be persisted with account data"
}
if ($userScript -notmatch "function loadOwnedOps\(\)[\s\S]*parsed\.accountMeta[\s\S]*normalizeAccountMeta") {
    throw "loadOwnedOps should normalize missing or existing account metadata"
}
if ($userScript -notmatch "function importSklandOperatorsToAccount\([^)]*\)[\s\S]*updateAccountLabelFromSkland\(targetAccountId, binding\.nickname\)") {
    throw "Skland import should update account labels from nickname"
}
if ($userScript -notmatch "function importSklandOperatorsToAccount\([^)]*\)[\s\S]*updateAccountSklandSyncMeta\(targetAccountId,[\s\S]*uid: binding\.uid[\s\S]*nickname: binding\.nickname[\s\S]*operatorCount: names\.length") {
    throw "Skland import should persist per-account Skland sync metadata"
}
if ($userScript -notmatch "function migrateLegacySklandImportSummary\(\)[\s\S]*SKLAND_LAST_IMPORT_KEY[\s\S]*updateAccountSklandSyncMeta") {
    throw "Legacy global Skland import summaries should migrate into account metadata"
}
if ($userScript -notmatch "function updateAccountLabelFromSkland\([\s\S]*labelSource === 'manual'[\s\S]*return") {
    throw "Skland import should preserve manually renamed accounts"
}
if ($userScript -notmatch "function updateAccountLabelFromSkland\([\s\S]*\.\.\.currentMeta[\s\S]*label: sklandLabel") {
    throw "Skland nickname updates should preserve existing account metadata"
}
if ($userScript -notmatch "function renameAccount\([^)]*\)[\s\S]*currentMeta\.skland[\s\S]*skland: currentMeta\.skland") {
    throw "Manual account renames should preserve Skland sync metadata"
}
if ($userScript -notmatch "function injectFilterControls\(\)[\s\S]*getAccountSklandSyncMeta\(activeAccountId\)[\s\S]*prts-account-sync-chip") {
    throw "Filter toolbar should show current account Skland sync status from account metadata"
}
if ($userScript -notmatch "function createSklandImportPanel\(\)[\s\S]*renderSklandSelectedAccountStatus\(status, targetAccountId" -or
    $userScript -match "const lastSummary = readSklandLastImportSummary") {
    throw "Skland import panel should show selected account sync status instead of the global last import summary"
}
if ($userScript -notmatch "const ACCOUNT_BACKUP_TYPE = 'Better-PRTS-Plus\.accounts-backup'" -or
    $userScript -notmatch "const ACCOUNT_BACKUP_VERSION = 1") {
    throw "Missing account backup schema constants"
}
if ($userScript -notmatch "function buildAccountsBackup\(\)[\s\S]*preferences:[\s\S]*getBackupPreferences\(\)") {
    throw "Account backup should export UI preferences"
}
if ($userScript -notmatch "function getBackupPreferences\(\)[\s\S]*filterMode[\s\S]*displayMode[\s\S]*floatingPosition") {
    throw "Account backup preferences should include filter/display/floating settings"
}
if ($userScript -notmatch "function parseAccountsBackup\([\s\S]*value\.type !== ACCOUNT_BACKUP_TYPE[\s\S]*value\.version !== ACCOUNT_BACKUP_VERSION") {
    throw "Account backup import should validate type and version"
}
$backupFunction = [regex]::Match($userScript, "function buildAccountsBackup\(\)[\s\S]*?\r?\n\s*function ").Value
if ($backupFunction -match "SKLAND_LAST_IMPORT_KEY|credential|token|localStorage") {
    throw "Account backup export should not include Skland history, credentials, tokens, or localStorage"
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
if ($userScript -notmatch "function getOperationResolutionForCard") {
    throw "Missing operation resolution metadata"
}
if ($userScript -notmatch "source: 'fiber'" -or $userScript -notmatch "source: 'fallback'") {
    throw "Operation resolution should distinguish Fiber and fallback sources"
}
if ($userScript -match "card\.innerText|card\.cloneNode\(true\)") {
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
if ($userScript -notmatch "function hasEffectiveOperationData") {
    throw "Missing operation data effectiveness check"
}
if ($userScript -notmatch "prts_cfg_compat_debug" -or $userScript -notmatch "compatDebug: GM_getValue\('prts_cfg_compat_debug', false\)") {
    throw "Missing compatibility diagnostics config"
}
if ($userScript -notmatch "#prts-compat-debug-panel") {
    throw "Missing compatibility diagnostics panel"
}
if ($userScript -notmatch "BetterPRTSPlusDebug[\s\S]*getCompatibilityDiagnostics") {
    throw "Missing compatibility diagnostics debug API"
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
foreach ($requiredDirtyFilterToken in @(
    "const cardDiagnosticsCache = new WeakMap\(\)",
    "let pendingDirtyCards = null",
    "function collectDirtyCardsFromMutations",
    "function processOperationCard",
    "function aggregateCardDiagnostics",
    "forceFull: false, dirtyCards"
)) {
    if ($userScript -notmatch $requiredDirtyFilterToken) {
        throw "Missing dirty-card filter refresh support: $requiredDirtyFilterToken"
    }
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
        throw "Expected special-name operator id missing from generated operator data: $($case.id)"
    }
    if ($op.name.IndexOf([string]$case.contains, [System.StringComparison]::Ordinal) -lt 0) {
        throw "Expected operator $($case.id) to contain special character $($case.contains)"
    }
    if ([string]::IsNullOrWhiteSpace($op.name) -or $op.name.Length -gt 50 -or $op.name -match "[\x00-\x1F\x7F]") {
        throw "Special-name import guard would reject operator id: $($case.id)"
    }
}

Write-Host "All checks passed for Better-PRTS-Plus $version"
