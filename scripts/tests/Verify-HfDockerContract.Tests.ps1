[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$verifier = Join-Path $root 'scripts/Verify-HfDockerContract.ps1'
$output = & pwsh -NoProfile -File $verifier -RepositoryRoot $root 2>&1
if ($LASTEXITCODE -ne 0 -or ($output -join "`n") -notmatch '"result":"PASS"') { throw ($output -join "`n") }
Write-Output 'PASS production Docker and same-origin static contract verifier'
