[CmdletBinding()]
param([string] $RepositoryRoot = (Split-Path $PSScriptRoot -Parent))

$ErrorActionPreference = 'Stop'
$failures = [Collections.Generic.List[string]]::new()
function Require-Match([string] $Text, [string] $Pattern, [string] $Failure) {
    if ($Text -notmatch $Pattern) { $script:failures.Add($Failure) }
}
function Reject-Match([string] $Text, [string] $Pattern, [string] $Failure) {
    if ($Text -match $Pattern) { $script:failures.Add($Failure) }
}

$dockerfile = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'Dockerfile')
$ignore = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot '.dockerignore')
$readme = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'README.md')
$candidateApi = Get-Content -Raw -LiteralPath (Join-Path $RepositoryRoot 'isees-ui/src/evidence/candidates/CandidateEvidenceApi.ts')

Require-Match $dockerfile 'FROM node:24\.7\.0-bookworm-slim AS frontend-build' 'node-base-not-pinned'
Require-Match $dockerfile 'FROM python:3\.12\.11-slim-bookworm AS runtime' 'python-base-not-pinned'
Require-Match $dockerfile 'npm ci' 'frontend-install-not-deterministic'
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
Require-Match $readme '(?m)^sdk: docker$' 'readme-not-docker-sdk'
Require-Match $readme '(?m)^app_port: 7860$' 'readme-port-mismatch'
Require-Match $candidateApi 'resolveApiBaseUrl\(import\.meta\.env\.VITE_CANDIDATE_EVIDENCE_API_BASE_URL' 'candidate-evidence-not-same-origin'
Require-Match $candidateApi 'credentials: "include"' 'candidate-evidence-cookies-missing'
Reject-Match $candidateApi '127\.0\.0\.1:8001' 'candidate-evidence-localhost-default'

$result = if ($failures.Count -eq 0) { 'PASS' } else { 'FAIL' }
[pscustomobject]@{ schema = 'p57-ops-hf-i1/v1'; result = $result; failures = @($failures) } | ConvertTo-Json -Compress
if ($result -ne 'PASS') { exit 1 }
