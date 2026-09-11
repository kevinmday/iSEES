[CmdletBinding()]
param(
    [string] $RepositoryRoot = (Split-Path $PSScriptRoot -Parent),
    [switch] $SelfTest
)

$ErrorActionPreference = 'Stop'

function Invoke-I2Contract([string] $Root) {
    $failures = [Collections.Generic.List[string]]::new()
    function Need([string] $File, [string] $Pattern, [string] $Failure) {
        $text = Get-Content -Raw -LiteralPath (Join-Path $Root $File)
        if ($text -notmatch $Pattern) { $failures.Add($Failure) }
    }
    function Reject([string] $File, [string] $Pattern, [string] $Failure) {
        $text = Get-Content -Raw -LiteralPath (Join-Path $Root $File)
        if ($text -match $Pattern) { $failures.Add($Failure) }
    }

    Need 'Dockerfile' 'ISEES_PERSISTENT_ROOT=/data/isees' 'persistent-root-env-missing'
    Need 'Dockerfile' 'install -d -o 1000 -g 1000 /data/isees/databases /data/isees/studio-outputs /data/isees/backups' 'persistent-directories-missing'
    Need 'Dockerfile' '--workers 1' 'uvicorn-worker-count'
    Reject 'Dockerfile' '(?im)^COPY[^\r\n]*(?:\.db|\.sqlite|runtime)' 'database-copy-found'
    Reject 'Dockerfile' '(?i)market.?mind' 'marketmind-in-dockerfile'
    Need 'isees_uap/persistence.py' 'class PreflightClassification' 'preflight-contract-missing'
    foreach ($classification in @('ABSENT','EMPTY','COMPATIBLE','MIGRATION_REQUIRED','INCOMPATIBLE','UNAVAILABLE')) {
        Need 'isees_uap/persistence.py' ('\b' + $classification + '\b') ('classification-missing:' + $classification)
    }
    Need 'isees_uap/persistence.py' 'mode=ro' 'read-only-sqlite-missing'
    Need 'isees_uap/api/__init__.py' '@application\.get\("/health"' 'health-route-missing'
    Need 'isees_uap/api/__init__.py' '@application\.get\("/ready"' 'ready-route-missing'
    Need 'isees_uap/api/frontend.py' '"health", "ready"' 'spa-exclusions-missing'
    foreach ($variable in @('ISEES_AUTH_DB_PATH','ISEES_INVESTIGATION_DB_PATH','ISEES_CANDIDATE_DB_PATH',
            'ISEES_RESEARCH_SOURCE_DB_PATH','ISEES_STUDIO_DB_PATH','ISEES_STUDIO_OUTPUT_ROOT','ISEES_STUDIO_V1_DATABASE_PATH')) {
        $matches = @(Get-ChildItem -LiteralPath (Join-Path $Root 'isees_uap') -Recurse -File -Filter '*.py' |
            Select-String -SimpleMatch $variable)
        if ($matches.Count -eq 0) { $failures.Add(('override-missing:' + $variable)) }
    }
    $trackedDatabases = @(& git -C $Root ls-files -- '*.db' '*.sqlite' '*.sqlite3' '*-wal' '*-shm')
    if ($LASTEXITCODE -ne 0) { $failures.Add('database-inventory-failed') }
    if ($trackedDatabases.Count -gt 0) { $failures.Add(('tracked-database:' + ($trackedDatabases -join ','))) }
    [pscustomobject]@{
        schema = 'p57-ops-hf-i2/v1'
        result = $(if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' })
        assertions = 22
        trackedDatabases = $trackedDatabases.Count
        failures = @($failures)
    }
}

if ($SelfTest) {
    $baseline = Invoke-I2Contract $RepositoryRoot
    if ($baseline.result -ne 'PASS') { $baseline | ConvertTo-Json -Compress; exit 1 }
    $mutations = @(
        @{ name='persistent-root'; file='Dockerfile'; from='ISEES_PERSISTENT_ROOT=/data/isees'; to='ISEES_PERSISTENT_ROOT=/tmp' },
        @{ name='read-only'; file='isees_uap/persistence.py'; from='mode=ro'; to='mode=rw' },
        @{ name='health'; file='isees_uap/api/__init__.py'; from='@application.get("/health"'; to='@application.get("/alive"' },
        @{ name='spa-ready'; file='isees_uap/api/frontend.py'; from='"health", "ready"'; to='"health"' }
    )
    $failures = [Collections.Generic.List[string]]::new()
    foreach ($mutation in $mutations) {
        $temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ('isees-i2-' + [guid]::NewGuid().ToString('N'))
        try {
            foreach ($relative in @('Dockerfile','isees_uap/persistence.py','isees_uap/api/__init__.py','isees_uap/api/frontend.py',
                    'isees_uap/authentication/config.py','isees_uap/investigations/config.py','isees_uap/candidate_evidence/config.py',
                    'isees_uap/research_sources/config.py','isees_uap/studio/config.py','isees_uap/api/application.py')) {
                $destination = Join-Path $temporaryRoot $relative
                New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
                Copy-Item -LiteralPath (Join-Path $RepositoryRoot $relative) -Destination $destination
            }
            & git -C $temporaryRoot init --quiet
            $target = Join-Path $temporaryRoot $mutation.file
            $content = Get-Content -Raw -LiteralPath $target
            Set-Content -NoNewline -LiteralPath $target -Value $content.Replace($mutation.from, $mutation.to)
            if ((Invoke-I2Contract $temporaryRoot).result -ne 'FAIL') { $failures.Add(('mutation-not-detected:' + $mutation.name)) }
        } finally {
            if (Test-Path -LiteralPath $temporaryRoot) { Remove-Item -Recurse -Force -LiteralPath $temporaryRoot }
        }
    }
    [pscustomobject]@{ schema='p57-ops-hf-i2-self-test/v1'; result=$(if($failures.Count){'FAIL'}else{'PASS'}); mutations=$mutations.Count; failures=@($failures) } | ConvertTo-Json -Compress
    if ($failures.Count) { exit 1 }
    exit 0
}

$result = Invoke-I2Contract $RepositoryRoot
$result | ConvertTo-Json -Compress
if ($result.result -ne 'PASS') { exit 1 }
