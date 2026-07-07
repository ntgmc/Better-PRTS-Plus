param(
    [switch]$Check,
    [switch]$NoSyntaxCheck,
    [string]$OutputPath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $repoRoot "Better-PRTS-Plus.user.js"
}

$sourceFiles = @(
    "src/meta/userscript-header.js",
    "src/core/constants.js",
    "src/data/operators.generated.js",
    "src/import/parsers.js",
    "src/import/skland.js",
    "src/dom/card-resolution.js",
    "src/styles/styles.js",
    "src/ui/dom-helpers.js",
    "src/filter/operation-matching.js",
    "src/import/accounts.js",
    "src/ui/import-controls.js",
    "src/dom/page-enhancements.js",
    "src/ui/panels.js",
    "src/main.js"
)

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Convert-ToLf {
    param([string]$Text)
    return [regex]::Replace($Text, "\r\n|\r|\n", "`n")
}

function Get-UserscriptSource {
    $builder = [System.Text.StringBuilder]::new()
    foreach ($relativePath in $sourceFiles) {
        $path = Join-Path $repoRoot $relativePath
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Missing userscript source fragment: $relativePath"
        }

        $part = Convert-ToLf ([System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8))
        if ($part.Length -gt 0 -and -not $part.EndsWith("`n")) {
            $part += "`n"
        }
        [void]$builder.Append($part)
    }
    return $builder.ToString()
}

$builtUserscript = Get-UserscriptSource
$resolvedOutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)

if ($Check) {
    if (-not (Test-Path -LiteralPath $resolvedOutputPath)) {
        throw "Cannot find userscript output at $resolvedOutputPath; run tool/build-userscript.ps1"
    }

    $currentUserscript = Convert-ToLf ([System.IO.File]::ReadAllText($resolvedOutputPath, [System.Text.Encoding]::UTF8))
    if ($currentUserscript -cne $builtUserscript) {
        throw "Better-PRTS-Plus.user.js is out of date; run tool/build-userscript.ps1"
    }

    Write-Host "Userscript build output is up to date."
} else {
    [System.IO.File]::WriteAllText($resolvedOutputPath, $builtUserscript, $utf8NoBom)
    Write-Host "Built $resolvedOutputPath"
}

if (-not $NoSyntaxCheck) {
    Write-Host "Checking userscript syntax..."
    node --check $resolvedOutputPath
    if ($LASTEXITCODE -ne 0) {
        throw "node --check failed"
    }
}
