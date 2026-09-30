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
    "tool/operator-data.generated.json",
    "tool/operator-data-update-summary.json"
)
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Invoke-Git {
    & git @args
    if ($LASTEXITCODE -ne 0) {
        throw "git $($args -join ' ') failed"
    }
}

function Get-GitOutput {
    $output = & git @args
    if ($LASTEXITCODE -ne 0) {
        throw "git $($args -join ' ') failed"
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

    if ($NextVersion -ceq (Get-UserscriptHeaderVersion)) {
        Write-Host "Userscript version is already $NextVersion."
        return
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
    if ($LASTEXITCODE -gt 1) {
        throw "Cannot check staged changes"
    }
    return $LASTEXITCODE -eq 1
}

function Test-GitRefExists {
    param([string]$Ref)

    & git rev-parse -q --verify $Ref *> $null
    return $LASTEXITCODE -eq 0
}

function Get-RemoteTagCommit {
    param([string]$TagName)

    $remoteTag = @(& git ls-remote --tags $Remote "refs/tags/$TagName" "refs/tags/$TagName^{}")
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot query remote tag refs from '$Remote'"
    }
    $peeledTag = @($remoteTag | Where-Object { $_ -match "\srefs/tags/.+\^\{\}$" })
    if ($peeledTag.Count -gt 0) {
        return ($peeledTag[0] -split "\s+")[0]
    }
    if ($remoteTag) {
        return ($remoteTag[0] -split "\s+")[0]
    }
    return ""
}

Push-Location $repoRoot
try {
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

    $localTagExists = $false
    $remoteTagCommit = ""
    if ($PublishRelease) {
        $headCommit = Get-GitOutput rev-parse HEAD
        $localTagExists = Test-GitRefExists -Ref "refs/tags/$tagName"
        if ($localTagExists) {
            $tagCommit = Get-GitOutput rev-parse "refs/tags/$tagName^{commit}"
            if ($tagCommit -ne $headCommit) {
                throw "Local tag '$tagName' already exists but does not point to HEAD. Use a new version."
            }
        }
        if (-not $DryRun) {
            $remoteTagCommit = Get-RemoteTagCommit -TagName $tagName
            if ($remoteTagCommit -and $remoteTagCommit -ne $headCommit) {
                throw "Remote tag '$tagName' already exists on '$Remote' but does not point to HEAD. Use a new version."
            }
        }
    }
    $reuseReleaseTag = $localTagExists -or [bool]$remoteTagCommit
    if ($reuseReleaseTag -and (Get-GitOutput status --porcelain --untracked-files=all -- @releasePaths)) {
        throw "Release files have changes but tag '$tagName' already exists. Use a new version or restore the release files before retrying."
    }

    Write-Host "Preparing release files for $tagName"
    & $buildScriptPath
    & $syncReadmeScriptPath
    if (-not $SkipOperatorDataUpdate -and -not $reuseReleaseTag) {
        & $updateOperatorDataScriptPath
    } else {
        Write-Host "Skipping operator data update; using existing release data."
    }
    & $checkScriptPath

    if ($PublishRelease) {
        & $checkReleaseScriptPath -Tag $tagName
    }

    if ($reuseReleaseTag -and (Get-GitOutput status --porcelain --untracked-files=all -- @releasePaths)) {
        throw "Prepared release files differ from existing tag '$tagName'. Use a new version."
    }

    if ($DryRun) {
        Write-Host "Dry run complete. No git add, commit, tag, or push was performed."
        Write-Host "Target branch: $Branch"
        Write-Host "Commit message: $CommitMessage"
        if ($PublishRelease) {
            Write-Host "Release tag: $tagName"
        }
        return
    }

    try {
        Invoke-Git add -- @releasePaths
        if (Test-StagedChanges) {
            Invoke-Git commit -m $CommitMessage
        } else {
            Write-Host "No release file changes to commit; using current HEAD."
        }
    } catch {
        Invoke-Git restore --staged -- @releasePaths
        throw
    }

    if ($PublishRelease -and -not $reuseReleaseTag) {
        Invoke-Git tag -a $tagName -m $tagName
    }

    Invoke-Git push $Remote "HEAD:refs/heads/$Branch"
    if ($PublishRelease) {
        if (-not $remoteTagCommit) {
            Invoke-Git push $Remote "refs/tags/${tagName}:refs/tags/$tagName"
        }
        Write-Host "Uploaded $Branch and $tagName. GitHub Actions will publish the release if the tag was newly pushed."
    } else {
        Write-Host "Uploaded $Branch without creating a release tag."
    }
} finally {
    Pop-Location
}
