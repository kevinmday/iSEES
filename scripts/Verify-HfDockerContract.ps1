[CmdletBinding()]
param(
    [string] $RepositoryRoot = (Split-Path $PSScriptRoot -Parent),
    [switch] $SelfTest
)

$ErrorActionPreference = 'Stop'
$failures = [Collections.Generic.List[string]]::new()
function Require-Match([string] $Text, [string] $Pattern, [string] $Failure) {
    if ($Text -notmatch $Pattern) { $script:failures.Add($Failure) }
}
function Reject-Match([string] $Text, [string] $Pattern, [string] $Failure) {
    if ($Text -match $Pattern) { $script:failures.Add($Failure) }
}
function Convert-DockerPatternToRegex([string] $Pattern) {
    $patternBody = $Pattern.Trim().Replace('\', '/')
    if ($patternBody.StartsWith('/')) { $patternBody = $patternBody.Substring(1) }
    if ($patternBody.EndsWith('/')) { $patternBody = $patternBody.TrimEnd('/') }

    $builder = [Text.StringBuilder]::new('^')
    for ($index = 0; $index -lt $patternBody.Length; $index++) {
        $character = $patternBody[$index]
        if ($character -eq '*') {
            if (($index + 1) -lt $patternBody.Length -and $patternBody[$index + 1] -eq '*') {
                $index++
                if (($index + 1) -lt $patternBody.Length -and $patternBody[$index + 1] -eq '/') {
                    $index++
                    [void] $builder.Append('(?:.*/)?')
                } else {
                    [void] $builder.Append('.*')
                }
            } else {
                [void] $builder.Append('[^/]*')
            }
        } elseif ($character -eq '?') {
            [void] $builder.Append('[^/]')
        } elseif ($character -eq '[') {
            $closingBracket = $patternBody.IndexOf(']', $index + 1)
            if ($closingBracket -gt $index) {
                [void] $builder.Append($patternBody.Substring($index, $closingBracket - $index + 1))
                $index = $closingBracket
            } else {
                [void] $builder.Append('\[')
            }
        } else {
            [void] $builder.Append([regex]::Escape([string] $character))
        }
    }
    [void] $builder.Append('$')
    return $builder.ToString()
}
function Test-DockerIgnored([string] $RelativePath, [string] $IgnoreText) {
    $path = $RelativePath.Replace('\', '/').TrimStart('/')
    $ignored = $false
    foreach ($rawLine in ($IgnoreText -split "`r?`n")) {
        $line = $rawLine.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        $negated = $line.StartsWith('!')
        if ($negated) { $line = $line.Substring(1) }
        if (-not $line) { continue }
        $regex = Convert-DockerPatternToRegex $line
        $segments = $path.Split('/')
        $candidates = [Collections.Generic.List[string]]::new()
        [void] $candidates.Add($path)
        for ($count = 1; $count -lt $segments.Count; $count++) {
            [void] $candidates.Add(($segments[0..($count - 1)] -join '/'))
        }
        if ($candidates.Where({ $_ -match $regex }, 'First').Count -gt 0) {
            $ignored = -not $negated
        }
    }
    return $ignored
}
function Invoke-Contract([string] $Root) {
    $script:failures = [Collections.Generic.List[string]]::new()

    $dockerfile = Get-Content -Raw -LiteralPath (Join-Path $Root 'Dockerfile')
    $ignore = Get-Content -Raw -LiteralPath (Join-Path $Root '.dockerignore')
    $readme = Get-Content -Raw -LiteralPath (Join-Path $Root 'README.md')
    $candidateApi = Get-Content -Raw -LiteralPath (Join-Path $Root 'isees-ui/src/evidence/candidates/CandidateEvidenceApi.ts')

Require-Match $dockerfile 'FROM node:24\.7\.0-bookworm-slim AS frontend-build' 'node-base-not-pinned'
Require-Match $dockerfile 'FROM python:3\.12\.11-slim-bookworm AS runtime' 'python-base-not-pinned'
Require-Match $dockerfile 'npm ci' 'frontend-install-not-deterministic'
Require-Match $dockerfile '(?im)^COPY\s+isees-ui/isees-capture-extension/icons/isees-capture\.svg\s+\./isees-capture-extension/icons/isees-capture\.svg\s*$' 'capture-icon-copy-boundary-missing'
Require-Match $dockerfile 'uvicorn isees_uap\.api:app' 'wrong-application-entry'
Require-Match $dockerfile '--host 0\.0\.0\.0' 'wrong-bind-host'
Require-Match $dockerfile '\$\{PORT:-7860\}' 'missing-port-default'
Require-Match $dockerfile '--workers 1' 'worker-count-not-one'
Reject-Match $dockerfile '--reload' 'reload-enabled'
Reject-Match $dockerfile '(?im)^COPY\s+\.\s' 'broad-copy-boundary'
Reject-Match $dockerfile '(?i)market.?mind' 'marketmind-in-dockerfile'
Require-Match $ignore '(?im)^marketmind_engine$' 'marketmind-engine-not-explicitly-excluded'
Require-Match $ignore '(?im)^marketmind_flask$' 'marketmind-flask-not-explicitly-excluded'
Require-Match $ignore '(?im)^marketmind_LEGACY_READONLY$' 'marketmind-legacy-not-explicitly-excluded'
Require-Match $ignore '(?im)^MarketMindAI_ARCHIVE$' 'marketmind-archive-not-explicitly-excluded'
Require-Match $ignore '(?im)^\.env$' 'environment-files-not-excluded'
Reject-Match $ignore '(?im)^\*\*/\*(?:token|auth|key|secret|credential)\*\s*$' 'security-name-source-wildcard'
Require-Match $readme '(?m)^sdk: docker$' 'readme-not-docker-sdk'
Require-Match $readme '(?m)^app_port: 7860$' 'readme-port-mismatch'
Require-Match $candidateApi 'resolveApiBaseUrl\(import\.meta\.env\.VITE_CANDIDATE_EVIDENCE_API_BASE_URL' 'candidate-evidence-not-same-origin'
Require-Match $candidateApi 'credentials: "include"' 'candidate-evidence-cookies-missing'
Reject-Match $candidateApi '127\.0\.0\.1:8001' 'candidate-evidence-localhost-default'

    $trackedPython = @(& git -C $Root ls-files -- 'isees_uap/*.py' 'isees_uap/**/*.py')
    if ($LASTEXITCODE -ne 0) { $script:failures.Add('tracked-python-inventory-failed') }
    $runtimePython = @($trackedPython | Where-Object { $_ -notmatch '^isees_uap/testing/' })
    $excludedRuntimePython = @($runtimePython | Where-Object { Test-DockerIgnored $_ $ignore })
    if ($excludedRuntimePython.Count -gt 0) {
        $script:failures.Add(('tracked-runtime-python-excluded:' + ($excludedRuntimePython -join ',')))
    }

    foreach ($requiredSource in @(
        'isees_uap/tokens/token_generator.py',
        'isees_uap/phrase/token_adapter.py',
        'isees_uap/api/v1/authentication.py',
        'isees_uap/authentication/service.py'
    )) {
        if ($trackedPython -notcontains $requiredSource -or (Test-DockerIgnored $requiredSource $ignore)) {
            $script:failures.Add(('legitimate-security-domain-source-excluded:' + $requiredSource))
        }
    }

    foreach ($secretFixture in @(
        '.env', '.env.production', 'config/.env', 'config/.env.local',
        'config/credentials.json', 'config/.credentials.local',
        'config/private.pem', 'config/private.key',
        'runtime/authentication.sqlite3', 'isees_uap/runtime/session.db',
        'config/hf_token', 'config/huggingface_token.txt', 'runtime/session.secret'
    )) {
        if (-not (Test-DockerIgnored $secretFixture $ignore)) {
            $script:failures.Add(('secret-fixture-not-excluded:' + $secretFixture))
        }
    }
    foreach ($marketMindFixture in @(
        'marketmind_engine/app.py', 'marketmind_flask/app.py',
        'marketmind_LEGACY_READONLY/app.py', 'MarketMindAI_ARCHIVE/app.py',
        'nested/MarketMind-private/app.py'
    )) {
        if (-not (Test-DockerIgnored $marketMindFixture $ignore)) {
            $script:failures.Add(('marketmind-fixture-not-excluded:' + $marketMindFixture))
        }
    }

    return [pscustomobject]@{
        schema = 'p57-ops-hf-i1b/v1'
        result = $(if ($script:failures.Count -eq 0) { 'PASS' } else { 'FAIL' })
        trackedRuntimePython = $runtimePython.Count
        excludedRuntimePython = $excludedRuntimePython.Count
        failures = @($script:failures)
    }
}

if ($SelfTest) {
    $baseline = Invoke-Contract $RepositoryRoot
    if ($baseline.result -ne 'PASS') {
        [pscustomobject]@{ schema = 'p57-ops-hf-i1b-self-test/v1'; result = 'FAIL'; failures = @('baseline-contract-failed') } | ConvertTo-Json -Compress
        exit 1
    }
    $mutations = @(
        @{ name = 'token-wildcard'; file = '.dockerignore'; pattern = "`n**/*token*`n" },
        @{ name = 'broad-copy'; file = 'Dockerfile'; pattern = "`nCOPY . /app`n" },
        @{ name = 'missing-env-exclusion'; file = '.dockerignore'; replace = @{ from = "`n.env`n"; to = "`n# removed-env-rule`n" } },
        @{ name = 'missing-capture-boundary'; file = 'Dockerfile'; replace = @{ from = 'COPY isees-ui/isees-capture-extension/icons/isees-capture.svg ./isees-capture-extension/icons/isees-capture.svg'; to = '# removed-capture-boundary' } }
    )
    $selfTestFailures = [Collections.Generic.List[string]]::new()
    foreach ($mutation in $mutations) {
        $temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) ('hf-contract-' + [guid]::NewGuid().ToString('N'))
        try {
            New-Item -ItemType Directory -Path $temporaryRoot | Out-Null
            foreach ($relative in @('.dockerignore', 'Dockerfile', 'README.md', 'isees-ui/src/evidence/candidates/CandidateEvidenceApi.ts')) {
                $destination = Join-Path $temporaryRoot $relative
                New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
                Copy-Item -LiteralPath (Join-Path $RepositoryRoot $relative) -Destination $destination
            }
            & git -C $temporaryRoot init --quiet
            & git -C $temporaryRoot add -- '.dockerignore' 'Dockerfile' 'README.md' 'isees-ui/src/evidence/candidates/CandidateEvidenceApi.ts'
            $target = Join-Path $temporaryRoot $mutation.file
            if ($mutation.ContainsKey('pattern')) {
                Add-Content -LiteralPath $target -Value $mutation.pattern
            } else {
                $content = Get-Content -Raw -LiteralPath $target
                Set-Content -LiteralPath $target -Value $content.Replace($mutation.replace.from, $mutation.replace.to) -NoNewline
            }
            if ((Invoke-Contract $temporaryRoot).result -ne 'FAIL') { $selfTestFailures.Add(('mutation-not-detected:' + $mutation.name)) }
        } finally {
            if (Test-Path -LiteralPath $temporaryRoot) { Remove-Item -LiteralPath $temporaryRoot -Recurse -Force }
        }
    }
    $selfTestResult = if ($selfTestFailures.Count -eq 0) { 'PASS' } else { 'FAIL' }
    [pscustomobject]@{ schema = 'p57-ops-hf-i1b-self-test/v1'; result = $selfTestResult; mutations = $mutations.Count; failures = @($selfTestFailures) } | ConvertTo-Json -Compress
    if ($selfTestResult -ne 'PASS') { exit 1 }
    exit 0
}

$contract = Invoke-Contract $RepositoryRoot
$contract | ConvertTo-Json -Compress
if ($contract.result -ne 'PASS') { exit 1 }
