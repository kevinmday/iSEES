[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $RepositoryRoot,
    [Parameter(Mandatory)] [string] $ExpectedBranch,
    [string] $RemoteTrackingBranch,
    [switch] $RequireCleanReleaseWorkspace,
    [string[]] $ReleasePath = @()
)

$ErrorActionPreference = 'Stop'
$originalOptionalLocks = $env:GIT_OPTIONAL_LOCKS
$env:GIT_OPTIONAL_LOCKS = '0'

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments)] [string[]] $Arguments)
    $output = & git -C $RepositoryRoot @Arguments 2>&1
    [pscustomobject]@{ Output = @($output); ExitCode = $LASTEXITCODE }
}

function Test-ForbiddenReleasePath {
    param([string] $Path)
    $pathValue = $Path.Replace('\', '/').TrimStart('./')
    return $pathValue -match '(?i)(^|/)(marketmind[^/]*)(/|$)|(^|/)dev-backups?(/|$)|(^|/)(backup|backups|archive|archives)(/|$)|(^|/)(generated|dist|build|coverage|runtime|logs?|outputs?)(/|$)|native-draft|discovery|\.(patch|diff|log|bak|backup|zip|tar|tgz|gz|7z|rar)$|\.(db|sqlite|sqlite3)(-.+)?$'
}

$summary = [ordered]@{
    schema = 'release-candidate-hygiene/v1'
    repositoryRoot = $null
    expectedBranch = $ExpectedBranch
    actualBranch = $null
    head = $null
    remoteTrackingBranch = $RemoteTrackingBranch
    remoteHead = $null
    indexEmpty = $false
    trackedClean = $false
    untrackedCount = 0
    untracked = @()
    forbiddenPaths = @()
    cleanReleaseRequired = [bool]$RequireCleanReleaseWorkspace
    result = 'FAIL'
    failures = @()
}

try {
    $requestedRoot = [IO.Path]::GetFullPath($RepositoryRoot).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    $rootResult = Invoke-Git rev-parse --show-toplevel
    if ($rootResult.ExitCode -ne 0) { $summary.failures += 'not-a-git-repository-root' }
    else {
        $actualRoot = [IO.Path]::GetFullPath([string]$rootResult.Output[0]).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
        $summary.repositoryRoot = $actualRoot.Replace('\', '/')
        if ($actualRoot -ne $requestedRoot) { $summary.failures += 'wrong-repository-root' }
    }

    if ($summary.failures.Count -eq 0) {
        $branch = Invoke-Git branch --show-current
        $summary.actualBranch = ([string]$branch.Output[0]).Trim()
        if ($branch.ExitCode -ne 0 -or $summary.actualBranch -ne $ExpectedBranch) { $summary.failures += 'wrong-branch' }

        $headResult = Invoke-Git rev-parse HEAD
        if ($headResult.ExitCode -eq 0) { $summary.head = ([string]$headResult.Output[0]).Trim() }

        if ($RemoteTrackingBranch) {
            $remoteResult = Invoke-Git rev-parse --verify $RemoteTrackingBranch
            if ($remoteResult.ExitCode -ne 0) { $summary.failures += 'remote-tracking-branch-not-found' }
            else {
                $summary.remoteHead = ([string]$remoteResult.Output[0]).Trim()
                if ($summary.remoteHead -ne $summary.head) { $summary.failures += 'remote-head-mismatch' }
            }
        }

        $indexResult = Invoke-Git diff --cached --quiet --exit-code --
        $summary.indexEmpty = $indexResult.ExitCode -eq 0
        if (-not $summary.indexEmpty) { $summary.failures += 'index-not-empty' }

        $trackedResult = Invoke-Git diff --quiet --exit-code --
        $summary.trackedClean = $trackedResult.ExitCode -eq 0
        if (-not $summary.trackedClean) { $summary.failures += 'tracked-files-modified' }

        $untrackedResult = Invoke-Git ls-files --others --exclude-standard
        $summary.untracked = @($untrackedResult.Output | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ })
        $summary.untrackedCount = $summary.untracked.Count
        if ($RequireCleanReleaseWorkspace -and $summary.untrackedCount -gt 0) { $summary.failures += 'untracked-files-present' }

        $stagedResult = Invoke-Git diff --cached --name-only --diff-filter=ACMRDTUXB
        $candidatePaths = @($stagedResult.Output) + @($ReleasePath)
        $summary.forbiddenPaths = @($candidatePaths | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ -and (Test-ForbiddenReleasePath $_) } | Sort-Object -Unique)
        if ($summary.forbiddenPaths.Count -gt 0) { $summary.failures += 'forbidden-release-path' }
    }

    if ($summary.failures.Count -eq 0) { $summary.result = 'PASS' }
    [Console]::Out.WriteLine(($summary | ConvertTo-Json -Compress -Depth 5))
    if ($summary.result -ne 'PASS') { exit 1 }
}
finally {
    if ($null -eq $originalOptionalLocks) { Remove-Item Env:GIT_OPTIONAL_LOCKS -ErrorAction SilentlyContinue }
    else { $env:GIT_OPTIONAL_LOCKS = $originalOptionalLocks }
}
