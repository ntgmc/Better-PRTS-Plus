$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("release-test-" + [guid]::NewGuid())
$testRepo = Join-Path $testRoot "repo"
$testRemote = Join-Path $testRoot "remote.git"
$fixturePath = Join-Path $testRoot "operators.json"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$operatorUpdateCalls = 0

function Assert {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw $Message }
}

function Invoke-TestGit {
    $output = & git -C $testRepo @args
    if ($LASTEXITCODE -ne 0) { throw "Test git $($args -join ' ') failed" }
    return ($output -join "`n").Trim()
}

function Assert-Failure {
    param([scriptblock]$Action, [string]$Message)
    try { & $Action } catch {
        Assert ($_.Exception.Message -like "*$Message*") "Unexpected failure: $($_.Exception.Message)"
        return
    }
    throw "Expected failure: $Message"
}

function Write-Hook {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, "$Content`n", $utf8NoBom)
    if ($env:OS -ne "Windows_NT") {
        & chmod +x $Path
        if ($LASTEXITCODE -ne 0) { throw "Cannot make test hook executable" }
    }
}

# Recreate upstream module records from the checked-in snapshot for offline release tests.
$moduleJson = & node -e @'
const fs = require('fs'), vm = require('vm');
const context = {};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8') + ';globalThis.modules = OP_MODULE_TYPES;', context);
const equipDict = {};
for (const [charId, types] of Object.entries(context.modules).reverse()) {
  [...types].forEach((typeName2, index) => {
    equipDict[`uniequip_00${index + 2}_${charId.split('_').slice(2).join('_')}`] = {
      charId: /_amiya[23]$/.test(charId) ? 'char_002_amiya' : charId,
      tmplId: /_amiya[23]$/.test(charId) ? charId : null,
      type: 'ADVANCED', typeName2
    };
  });
}
equipDict.uniequip_001_makoto = { charId: 'char_4217_makoto', type: 'INITIAL', typeName2: null };
console.log(JSON.stringify({ equipDict }));
'@ (Join-Path $repoRoot "src/data/module-types.generated.js")
if ($LASTEXITCODE -ne 0) { throw "Cannot build offline module fixture" }
$moduleFixture = $moduleJson | ConvertFrom-Json

# Keep the actual updater and Git operations, with an offline operator source.
function Invoke-RestMethod {
    param([string]$Uri, [int]$TimeoutSec)
    $script:operatorUpdateCalls++
    if ($Uri.EndsWith("/uniequip_table.json")) { return $moduleFixture }
    return Get-Content -LiteralPath $fixturePath -Raw -Encoding UTF8 | ConvertFrom-Json
}

New-Item -ItemType Directory -Path $testRepo -Force | Out-Null
Push-Location $testRoot
try {
    Copy-Item -Path (Join-Path $repoRoot "src"), (Join-Path $repoRoot "tool"), (Join-Path $repoRoot "resources") -Destination $testRepo -Recurse
    Copy-Item -Path (Join-Path $repoRoot "README.md"), (Join-Path $repoRoot "Better-PRTS-Plus.user.js") -Destination $testRepo
    Copy-Item -LiteralPath (Join-Path $testRepo "tool/operator-data.generated.json") -Destination $fixturePath
    $upload = Join-Path $testRepo "tool/upload-release.ps1"
    $publish = Join-Path $testRepo "tool/publish-release.ps1"
    $update = Join-Path $testRepo "tool/update-operator-data.ps1"
    $audit = Join-Path $testRepo "tool/operator-data-update-summary.json"
    $resourcePath = Join-Path $testRepo "resources/data.json"
    $headerHash = (Get-FileHash -LiteralPath (Join-Path $testRepo "src/meta/userscript-header.js")).Hash
    $auditHash = (Get-FileHash -LiteralPath $audit).Hash

    & $update -SourcePath $fixturePath
    Assert ((Get-FileHash -LiteralPath $audit).Hash -eq $auditHash) "Unchanged data rewrote the audit summary"
    $moduleOutput = Join-Path $testRepo "src/data/module-types.generated.js"
    $moduleHash = (Get-FileHash -LiteralPath $moduleOutput).Hash
    Assert ($moduleHash -eq (Get-FileHash -LiteralPath (Join-Path $repoRoot "src/data/module-types.generated.js")).Hash) "Module regeneration changed the snapshot"
    $resourceHash = (Get-FileHash -LiteralPath $resourcePath).Hash
    Assert ($resourceHash -eq (Get-FileHash -LiteralPath (Join-Path $repoRoot "resources/data.json")).Hash) "Resource regeneration changed the snapshot"
    & $update -SourcePath $fixturePath
    Assert ((Get-FileHash -LiteralPath $resourcePath).Hash -eq $resourceHash) "Unchanged resources produced a new snapshot"
    $moduleFixture.equipDict.uniequip_002_makoto.typeName2 = "INVALID"
    Assert-Failure { & $update -SourcePath $fixturePath } "Unsupported module mapping"
    Assert ((Get-FileHash -LiteralPath $moduleOutput).Hash -eq $moduleHash) "Invalid module data overwrote the snapshot"
    Assert ((Get-FileHash -LiteralPath $resourcePath).Hash -eq $resourceHash) "Invalid module data overwrote hot-update resources"
    $moduleFixture.equipDict.uniequip_002_makoto.typeName2 = "Y"
    $operators = Get-Content -LiteralPath $fixturePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $operators += [pscustomobject]@{ id = "char_999999_release"; name = "Release test operator" }
    [System.IO.File]::WriteAllText($fixturePath, ($operators | ConvertTo-Json -Depth 4), $utf8NoBom)
    & $update -SourcePath $fixturePath
    $summary = Get-Content -LiteralPath $audit -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert ($summary.addedCount -eq 1) "Changed data did not record the added operator"
    $resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert ($resource.schemaVersion -eq 1) "Resource schema version is missing"
    Assert (@($resource.operators | Where-Object id -eq "char_999999_release").Count -eq 1) "New operator is missing from hot-update resources"
    Assert ($resource.moduleTypes.char_4217_makoto -eq "Y") "Module types are missing from hot-update resources"
    Assert ((Get-FileHash -LiteralPath (Join-Path $testRepo "src/meta/userscript-header.js")).Hash -eq $headerHash) "Resource update changed userscript version"
    $auditHash = (Get-FileHash -LiteralPath $audit).Hash
    & $update -SourcePath $fixturePath
    Assert ((Get-FileHash -LiteralPath $audit).Hash -eq $auditHash) "Retry lost the previous audit changes"
    $moduleFixture.equipDict.uniequip_002_makoto.typeName2 = "X"
    & $update -SourcePath $fixturePath
    $resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert ($resource.moduleTypes.char_4217_makoto -eq "X") "Module-only update did not reach hot-update resources"
    Assert ((Get-FileHash -LiteralPath $audit).Hash -eq $auditHash) "Module-only update changed the operator audit"
    $resourceHash = (Get-FileHash -LiteralPath $resourcePath).Hash
    & $update -SourcePath $fixturePath
    Assert ((Get-FileHash -LiteralPath $resourcePath).Hash -eq $resourceHash) "Module-only retry changed resources"
    $moduleFixture.equipDict.uniequip_002_makoto.typeName2 = "Y"
    & $update -SourcePath $fixturePath
    $releaseUpdateCalls = $operatorUpdateCalls

    Invoke-TestGit init -b main | Out-Null
    Invoke-TestGit config user.name "Release test" | Out-Null
    Invoke-TestGit config user.email "release-test@example.invalid" | Out-Null
    Invoke-TestGit config core.autocrlf false | Out-Null
    Invoke-TestGit config commit.gpgsign false | Out-Null
    Invoke-TestGit config tag.gpgsign false | Out-Null
    Invoke-TestGit config core.hooksPath .git/hooks | Out-Null
    Invoke-TestGit add . | Out-Null
    Invoke-TestGit commit -m "test: initialize release fixture" | Out-Null
    Invoke-TestGit init --bare $testRemote | Out-Null
    Invoke-TestGit remote add origin $testRemote | Out-Null
    $receiveHook = Join-Path $testRemote "hooks/pre-receive"
    $commitHook = Join-Path $testRepo ".git/hooks/pre-commit"

    Write-Hook $receiveHook "#!/bin/sh`nexit 1"
    Assert-Failure { & $upload -Version "99.0.0" } "failed"
    $uploadHead = Invoke-TestGit rev-parse HEAD
    Assert ((Invoke-TestGit rev-list --count HEAD) -eq "2") "Upload did not create exactly one commit"
    Assert-Failure { & $upload -Version "99.0.0" } "failed"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $uploadHead) "Upload retry created another commit"
    Remove-Item -LiteralPath $receiveHook
    & $upload -Version "99.0.0"
    Assert ((Invoke-TestGit status --porcelain) -eq "") "Upload retry left changes behind"

    Write-Hook $receiveHook "#!/bin/sh`nexit 1"
    Assert-Failure { & $publish -Version "99.0.1" } "failed"
    $releaseHead = Invoke-TestGit rev-parse HEAD
    $updateCalls = $operatorUpdateCalls
    Assert ((Invoke-TestGit rev-list --count HEAD) -eq "3") "Publish did not create exactly one commit"
    Assert ((Invoke-TestGit rev-parse "refs/tags/v99.0.1^{commit}") -eq $releaseHead) "Local release tag is missing"
    Assert-Failure { & $publish -Version "99.0.1" } "failed"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Publish retry created another commit"
    Assert ($operatorUpdateCalls -eq $updateCalls) "Tagged retry refreshed online data"
    Remove-Item -LiteralPath $receiveHook
    & $publish -Version "99.0.1"
    & $publish -Version "99.0.1"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Successful retry created another commit"
    Assert ((Invoke-TestGit "--git-dir=$testRemote" rev-parse "refs/tags/v99.0.1^{commit}") -eq $releaseHead) "Remote tag differs"
    Invoke-TestGit tag -d v99.0.1 | Out-Null
    & $publish -Version "99.0.1"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Remote-only annotated tag was not reused"

    Write-Hook $receiveHook @'
#!/bin/sh
while read old new ref; do
    case "$ref" in refs/tags/*) exit 1 ;; esac
done
'@
    Assert-Failure { & $publish -Version "99.0.2" } "failed"
    $releaseHead = Invoke-TestGit rev-parse HEAD
    Assert ((Invoke-TestGit "--git-dir=$testRemote" rev-parse refs/heads/main) -eq $releaseHead) "Branch was not uploaded before tag failure"
    Remove-Item -LiteralPath $receiveHook
    & $publish -Version "99.0.2"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Tag push retry created another commit"
    Invoke-TestGit tag -d v99.0.2 | Out-Null
    Invoke-TestGit "--git-dir=$testRemote" tag -d v99.0.2 | Out-Null
    Invoke-TestGit "--git-dir=$testRemote" tag v99.0.2 $releaseHead | Out-Null
    & $publish -Version "99.0.2"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Remote-only lightweight tag was not reused"

    Assert-Failure { & $publish -Version "99.0.1" } "Remote tag"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Remote tag conflict created a commit"
    Invoke-TestGit restore -- src/meta/userscript-header.js | Out-Null
    Invoke-TestGit tag v99.0.3 "HEAD~1" | Out-Null
    Assert-Failure { & $publish -Version "99.0.3" } "Local tag"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Local tag conflict created a commit"
    Invoke-TestGit restore -- src/meta/userscript-header.js | Out-Null
    Invoke-TestGit tag -d v99.0.3 | Out-Null

    $newSource = Join-Path $testRepo "src/release-test.js"
    [System.IO.File]::WriteAllText($newSource, "// changed release`n", $utf8NoBom)
    Assert-Failure { & $publish -Version "99.0.2" } "Release files have changes"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Dirty tagged release created a commit"
    Invoke-TestGit add src/release-test.js | Out-Null
    Assert-Failure { & $publish -Version "99.0.3" } "already staged changes"
    Assert ((Invoke-TestGit diff --cached --name-only) -eq "src/release-test.js") "User staging was changed"
    Invoke-TestGit restore --staged -- src/release-test.js | Out-Null
    Remove-Item -LiteralPath $newSource

    Invoke-TestGit remote set-url origin (Join-Path $testRoot "missing.git") | Out-Null
    Assert-Failure { & $publish -Version "99.0.3" } "Cannot query remote tag refs"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Remote lookup failure created a commit"
    Assert ((Invoke-TestGit diff --cached --name-only) -eq "") "Remote lookup failure staged changes"
    Invoke-TestGit remote set-url origin $testRemote | Out-Null

    Write-Hook $commitHook "#!/bin/sh`nexit 1"
    Assert-Failure { & $publish -Version "99.0.3" } "failed"
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Failed commit moved HEAD"
    Assert ((Invoke-TestGit diff --cached --name-only) -eq "") "Failed commit left release files staged"
    Assert ((Invoke-TestGit diff --name-only).Length -gt 0) "Failed commit lost working changes"
    Remove-Item -LiteralPath $commitHook
    & $publish -Version "99.0.3"
    Assert ((Invoke-TestGit rev-list --count HEAD) -eq "5") "Commit retry created duplicate commits"
    Assert ((Invoke-TestGit status --porcelain) -eq "") "Commit retry left changes behind"

    $releaseHead = Invoke-TestGit rev-parse HEAD
    & $publish -Version "99.0.4" -DryRun
    Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Dry run created a commit"
    Assert ((Invoke-TestGit tag --list v99.0.4) -eq "") "Dry run created a tag"
    Assert ((Invoke-TestGit diff --cached --name-only) -eq "") "Dry run staged changes"
    Assert ((Get-Location).Path -eq $testRoot) "Release script changed the caller's directory"
    Assert ($operatorUpdateCalls -eq $releaseUpdateCalls) "Release scripts still fetched resource data online"

    Write-Hook $commitHook (Get-Content -LiteralPath (Join-Path $repoRoot ".githooks/pre-commit") -Raw -Encoding UTF8)
    foreach ($version in @("99.0.4-beta.1", "99.0.4-beta.2", "99.0.4")) {
        & $publish -Version $version
        $releaseHead = Invoke-TestGit rev-parse HEAD
        $readme = Get-Content -LiteralPath (Join-Path $testRepo "README.md") -Raw -Encoding UTF8
        Assert ($readme.Contains("https://img.shields.io/badge/Version-$version-blue.svg?style=flat-square")) "README badge was not synced to $version"
        & $publish -Version $version
        Assert ((Invoke-TestGit rev-parse HEAD) -eq $releaseHead) "Retry for $version created another commit"
        Assert ((Invoke-TestGit status --porcelain) -eq "") "Retry for $version left changes behind"
        Assert ((Invoke-TestGit "--git-dir=$testRemote" rev-parse "refs/tags/v${version}^{commit}") -eq $releaseHead) "Remote tag for $version differs"
    }
    Write-Host "Release retry checks passed."
} finally {
    Pop-Location
    Remove-Item -LiteralPath $testRoot -Recurse -Force
}
