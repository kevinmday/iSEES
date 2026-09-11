[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$verifier = (Resolve-Path (Join-Path $PSScriptRoot '..\Verify-ReleaseCandidateHygiene.ps1')).Path
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('release-hygiene-tests-' + [guid]::NewGuid().ToString('N'))
$passed = 0
$failed = 0

function Invoke-NativeGit([string] $Root, [string[]] $Arguments) {
    $output = & git -C $Root @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git failed: $($Arguments -join ' ')`n$($output -join "`n")" }
    return @($output)
}

function New-TestRepository([string] $Name) {
    $root = Join-Path $testRoot $Name
    New-Item -ItemType Directory -Path $root | Out-Null
    Invoke-NativeGit $root @('init', '-b', 'release') | Out-Null
    Invoke-NativeGit $root @('config', 'user.email', 'hygiene-tests@example.invalid') | Out-Null
    Invoke-NativeGit $root @('config', 'user.name', 'Hygiene Tests') | Out-Null
    Set-Content -LiteralPath (Join-Path $root 'source.txt') -Value 'authoritative source' -NoNewline
    Invoke-NativeGit $root @('add', 'source.txt') | Out-Null
    Invoke-NativeGit $root @('commit', '-m', 'initial') | Out-Null
    $head = [string](Invoke-NativeGit $root @('rev-parse', 'HEAD') | Select-Object -First 1)
    Invoke-NativeGit $root @('update-ref', 'refs/remotes/origin/release', $head) | Out-Null
    return $root
}

function Invoke-Verifier([string] $Root, [string[]] $Extra = @()) {
    $allArguments = @('-NoProfile', '-File', $verifier, '-RepositoryRoot', $Root, '-ExpectedBranch', 'release') + $Extra
    $output = & pwsh @allArguments 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($output -join "`n") }
}

function Test-Case([string] $Name, [scriptblock] $Body) {
    try { & $Body; $script:passed++; Write-Output "PASS $Name" }
    catch { $script:failed++; Write-Output "FAIL $Name :: $($_.Exception.Message)" }
}

function Assert-True([bool] $Condition, [string] $Message) { if (-not $Condition) { throw $Message } }

New-Item -ItemType Directory -Path $testRoot | Out-Null
try {
    Test-Case 'valid clean candidate' {
        $repo = New-TestRepository 'clean'
        $result = Invoke-Verifier $repo @('-RemoteTrackingBranch', 'origin/release', '-RequireCleanReleaseWorkspace')
        Assert-True ($result.ExitCode -eq 0 -and $result.Output -match '"result":"PASS"') $result.Output
    }
    Test-Case 'wrong repository root' {
        $repo = New-TestRepository 'wrong-root'; $child = Join-Path $repo 'child'; New-Item -ItemType Directory $child | Out-Null
        $result = Invoke-Verifier $child
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'wrong-repository-root') $result.Output
    }
    Test-Case 'wrong branch' {
        $repo = New-TestRepository 'wrong-branch'; Invoke-NativeGit $repo @('switch', '-c', 'other') | Out-Null; $result = Invoke-Verifier $repo
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'wrong-branch') $result.Output
    }
    Test-Case 'remote mismatch' {
        $repo = New-TestRepository 'remote-mismatch'; Set-Content (Join-Path $repo 'second.txt') 'second'; Invoke-NativeGit $repo @('add','second.txt') | Out-Null; Invoke-NativeGit $repo @('commit','-m','second') | Out-Null
        $result = Invoke-Verifier $repo @('-RemoteTrackingBranch', 'origin/release')
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'remote-head-mismatch') $result.Output
    }
    Test-Case 'dirty tracked file' {
        $repo = New-TestRepository 'dirty'; Set-Content (Join-Path $repo 'source.txt') 'changed'
        $result = Invoke-Verifier $repo
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'tracked-files-modified') $result.Output
    }
    Test-Case 'staged file' {
        $repo = New-TestRepository 'staged'; Set-Content (Join-Path $repo 'added.txt') 'added'; Invoke-NativeGit $repo @('add','added.txt') | Out-Null
        $result = Invoke-Verifier $repo
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'index-not-empty') $result.Output
    }
    Test-Case 'forbidden staged path' {
        $repo = New-TestRepository 'forbidden-staged'; Set-Content (Join-Path $repo 'audit.patch') 'patch'; Invoke-NativeGit $repo @('add','audit.patch') | Out-Null
        $result = Invoke-Verifier $repo
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'forbidden-release-path') $result.Output
    }
    Test-Case 'diagnostic mode permits ordinary untracked file' {
        $repo = New-TestRepository 'diagnostic'; Set-Content (Join-Path $repo 'notes.txt') 'notes'
        $result = Invoke-Verifier $repo
        Assert-True ($result.ExitCode -eq 0 -and $result.Output -match '"untrackedCount":1') $result.Output
    }
    Test-Case 'clean-release mode rejects untracked file' {
        $repo = New-TestRepository 'release-untracked'; Set-Content (Join-Path $repo 'notes.txt') 'notes'
        $result = Invoke-Verifier $repo @('-RequireCleanReleaseWorkspace')
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'untracked-files-present') $result.Output
    }
    Test-Case 'MarketMind release exclusion' {
        $repo = New-TestRepository 'marketmind'
        $result = Invoke-Verifier $repo @('-ReleasePath', 'MarketMind/runtime.py')
        Assert-True ($result.ExitCode -ne 0 -and $result.Output -match 'forbidden-release-path') $result.Output
    }
    Test-Case 'verifier does not change Git state' {
        $repo = New-TestRepository 'nonmutating'; Set-Content (Join-Path $repo 'notes.txt') 'notes'
        $before = (& git -C $repo status --porcelain=v2 --branch --untracked-files=all) -join "`n"
        $indexBefore = (Get-FileHash (Join-Path $repo '.git\index') -Algorithm SHA256).Hash
        $result = Invoke-Verifier $repo
        $after = (& git -C $repo status --porcelain=v2 --branch --untracked-files=all) -join "`n"
        $indexAfter = (Get-FileHash (Join-Path $repo '.git\index') -Algorithm SHA256).Hash
        Assert-True ($result.ExitCode -eq 0 -and $before -ceq $after -and $indexBefore -eq $indexAfter) $result.Output
    }
}
finally {
    if ([IO.Directory]::Exists($testRoot)) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
}

Write-Output "TOTAL=$($passed + $failed) PASSED=$passed FAILED=$failed"
if ($failed -gt 0) { exit 1 }
