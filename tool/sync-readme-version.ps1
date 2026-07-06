$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "src/meta/userscript-header.js"
$readmePath = Join-Path $repoRoot "README.md"

$userScript = Get-Content -LiteralPath $userScriptPath -Raw -Encoding UTF8
$versionMatch = [regex]::Match($userScript, "(?m)^//\s*@version\s+([0-9]+(?:\.[0-9]+){1,3}(?:[-+][0-9A-Za-z.-]+)?)\s*$")

if (-not $versionMatch.Success) {
    throw "Cannot find @version in src/meta/userscript-header.js"
}

$version = $versionMatch.Groups[1].Value
$readme = (Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8).TrimStart([char]0xFEFF)
$badgePattern = [regex]"https://img\.shields\.io/badge/Version-[^-]+-blue\.svg\?style=flat-square"

if (-not $badgePattern.IsMatch($readme)) {
    throw "Cannot find README version badge"
}

$updated = $badgePattern.Replace($readme, "https://img.shields.io/badge/Version-$($version)-blue.svg?style=flat-square", 1)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($readmePath, $updated, $utf8NoBom)
Write-Host "README version badge synced to $version"
