param(
    [string]$Version,
    [string]$Remote = "origin",
    [string]$Branch,
    [string]$CommitMessage,
    [switch]$SkipOperatorDataUpdate,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$arguments = @{
    Remote = $Remote
    PublishRelease = $true
}

if ($PSBoundParameters.ContainsKey("Version")) {
    $arguments.Version = $Version
}
if ($PSBoundParameters.ContainsKey("Branch")) {
    $arguments.Branch = $Branch
}
if ($PSBoundParameters.ContainsKey("CommitMessage")) {
    $arguments.CommitMessage = $CommitMessage
}
if ($SkipOperatorDataUpdate) {
    $arguments.SkipOperatorDataUpdate = $true
}
if ($DryRun) {
    $arguments.DryRun = $true
}

& (Join-Path $PSScriptRoot "upload-release.ps1") @arguments
