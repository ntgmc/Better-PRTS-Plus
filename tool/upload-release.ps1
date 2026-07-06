param(
    [string]$Version,
    [string]$Remote = "origin",
    [string]$Branch,
    [string]$CommitMessage,
    [switch]$SkipOperatorDataUpdate,
    [switch]$DryRun,
    [switch]$PublishRelease
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$headerPath = Join-Path $repoRoot "src/meta/userscript-header.js"
$buildScriptPath = Join-Path $PSScriptRoot "build-userscript.ps1"
$syncReadmeScriptPath = Join-Path $PSScriptRoot "sync-readme-version.ps1"
$updateOperatorDataScriptPath = Join-Path $PSScriptRoot "update-operator-data.ps1"
$checkScriptPath = Join-Path $PSScriptRoot "check.ps1"
$checkReleaseScriptPath = Join-Path $PSScriptRoot "check-release.ps1"
$versionPattern = "[0-9]+(?:\.[0-9]+){1,3}(?:[-+][0-9A-Za-z.-]+)?"
$releasePaths = @(
    "src",
    "Better-PRTS-Plus.user.js",
    "README.md",
    "tool/operator-data.generated.json"
)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed"
    }
}

function Get-GitOutput {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

    $output = & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed"
    }
    return ($output -join "`n").Trim()
}

function Get-UserscriptHeaderVersion {
    $header = Get-Content -LiteralPath $headerPath -Raw -Encoding UTF8
    $match = [regex]::Match($header, "(?m)^//\s*@version\s+($versionPattern)\s*$")
    if (-not $match.Success) {
        throw "Cannot find @version in src/meta/userscript-header.js"
    }
    return $match.Groups[1].Value
}

function Set-UserscriptHeaderVersion {
    param([string]$NextVersion)

    if ($NextVersion -notmatch "^$versionPattern$") {
        throw "Version must look like X.Y, X.Y.Z, or X.Y.Z.N with an optional suffix; received '$NextVersion'"
    }

    $header = Get-Content -LiteralPath $headerPath -Raw -Encoding UTF8
    $updated = [regex]::Replace(
        $header,
        "(?m)^(//\s*@version\s+)$versionPattern\s*$",
        "`${1}$NextVersion",
        1
    )

    if ($updated -ceq $header) {
        throw "Cannot update @version in src/meta/userscript-header.js"
    }

    [System.IO.File]::WriteAllText($headerPath, $updated, $utf8NoBom)
    Write-Host "Updated userscript version to $NextVersion"
}

function Test-StagedChanges {
    & git diff --cached --quiet
    return $LASTEXITCODE -ne 0
}

function Test-GitRefExists {
    param([string]$Ref)

    & git rev-parse -q --verify $Ref *> $null
    return $LASTEXITCODE -eq 0
}

function Test-RemoteTagExists {
    param([string]$TagName)

    $remoteTag = & git ls-remote --tags $Remote "refs/tags/$TagName"
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot query remote tag refs from '$Remote'"
    }
    return (($remoteTag -join "`n").Trim().Length -gt 0)
}

Invoke-Git rev-parse --is-inside-work-tree *> $null

if ((Test-StagedChanges) -and -not $DryRun) {
    throw "There are already staged changes. Commit or unstage them before running this release upload script."
}

if (-not [string]::IsNullOrWhiteSpace($Version)) {
    Set-UserscriptHeaderVersion -NextVersion $Version
}

$releaseVersion = Get-UserscriptHeaderVersion
$tagName = "v$releaseVersion"

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = if ($PublishRelease) { "chore(release): $tagName" } else { "chore(release): prepare $tagName" }
}

if ([string]::IsNullOrWhiteSpace($Branch)) {
    $Branch = Get-GitOutput branch --show-current
}
if ([string]::IsNullOrWhiteSpace($Branch)) {
    throw "Cannot determine current branch. Pass -Branch explicitly."
}

Write-Host "Preparing release files for $tagName"
& $buildScriptPath
& $syncReadmeScriptPath
if (-not $SkipOperatorDataUpdate) {
    & $updateOperatorDataScriptPath
} else {
    Write-Host "Skipping operator data update."
}
& $checkScriptPath

if ($PublishRelease) {
    & $checkReleaseScriptPath -Tag $tagName
}

if ($DryRun) {
    Write-Host "Dry run complete. No git add, commit, tag, or push was performed."
    Write-Host "Target branch: $Branch"
    Write-Host "Commit message: $CommitMessage"
    if ($PublishRelease) {
        Write-Host "Release tag: $tagName"
    }
    exit 0
}

Invoke-Git add -- @releasePaths

if (Test-StagedChanges) {
    Invoke-Git commit -m $CommitMessage
} else {
    Write-Host "No release file changes to commit; using current HEAD."
}

if ($PublishRelease) {
    if (Test-RemoteTagExists -TagName $tagName) {
        throw "Remote tag '$tagName' already exists on '$Remote'."
    }

    if (Test-GitRefExists -Ref "refs/tags/$tagName") {
        $tagCommit = Get-GitOutput rev-list -n 1 $tagName
        $headCommit = Get-GitOutput rev-parse HEAD
        if ($tagCommit -ne $headCommit) {
            throw "Local tag '$tagName' already exists but does not point to HEAD."
        }
        Write-Host "Local tag $tagName already points to HEAD."
    } else {
        Invoke-Git tag -a $tagName -m $tagName
    }
}

Invoke-Git push $Remote "HEAD:$Branch"
if ($PublishRelease) {
    Invoke-Git push $Remote $tagName
    Write-Host "Uploaded $Branch and $tagName. GitHub Actions will publish the release."
} else {
    Write-Host "Uploaded $Branch without creating a release tag."
}
