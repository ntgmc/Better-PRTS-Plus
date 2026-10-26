$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"

Write-Host "Checking userscript build output and syntax..."
& (Join-Path $PSScriptRoot "build-userscript.ps1") -Check

Write-Host "Running core function tests..."
node (Join-Path $PSScriptRoot "test-core.js")
if ($LASTEXITCODE -ne 0) {
    throw "Core function tests failed"
}

$userScript = Get-Content -LiteralPath $userScriptPath -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath (Join-Path $repoRoot "README.md") -Raw -Encoding UTF8

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

Write-Host "Checking DOM and credential safety guards..."
if ($userScript -match "\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML") {
    throw "Script UI should be rendered with DOM nodes instead of HTML string assignment"
}
if ($userScript -match "\b(?:alert|prompt|confirm)\s*\(") {
    throw "Blocking browser dialogs should be replaced with Toast/Modal feedback"
}
if ($userScript -match "GM_setValue\([^\r\n]*(?:cred|credential|token)") {
    throw "Skland credentials or tokens must not be persisted"
}

Write-Host "All checks passed for Better-PRTS-Plus $version"
