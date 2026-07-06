param(
    [Parameter(Mandatory = $true)]
    [string]$Tag
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$userScriptPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"

$versionPattern = "[0-9]+(?:\.[0-9]+){1,3}(?:[-+][0-9A-Za-z.-]+)?"

if (-not $Tag.StartsWith("v", [System.StringComparison]::Ordinal)) {
    throw "Release tag must start with 'v' and match v<version>; received '$Tag'"
}

$tagMatch = [regex]::Match($Tag, "^v($versionPattern)$")
if (-not $tagMatch.Success) {
    throw "Release tag must match vX.Y, vX.Y.Z, or vX.Y.Z.N with an optional suffix; received '$Tag'"
}

$userScript = Get-Content -LiteralPath $userScriptPath -Raw -Encoding UTF8
$versionMatch = [regex]::Match($userScript, "(?m)^//\s*@version\s+($versionPattern)\s*$")

if (-not $versionMatch.Success) {
    throw "Cannot find @version in Better-PRTS-Plus.user.js"
}

$tagVersion = $tagMatch.Groups[1].Value
$scriptVersion = $versionMatch.Groups[1].Value

if ($tagVersion -ne $scriptVersion) {
    throw "Release tag version '$tagVersion' does not match userscript @version '$scriptVersion'"
}

Write-Host "Release tag $Tag matches Better-PRTS-Plus.user.js @version $scriptVersion"
