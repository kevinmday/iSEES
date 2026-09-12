[CmdletBinding()]
param(
    [string] $RepositoryRoot = (Split-Path $PSScriptRoot -Parent),
    [string] $Image = 'isees-hf:candidate-access',
    [Parameter(Mandatory)] [ValidatePattern('^[0-9a-fA-F]{40}$')]
    [string] $ExpectedHead
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$suffix = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$volume = "isees-candidate-access-$suffix"
$containerPrefix = "isees-candidate-access-$suffix"
$containers = [Collections.Generic.List[string]]::new()
$capturedLogs = [Collections.Generic.List[string]]::new()
$volumeCreated = $false
$approvedEmail = 'approved.tester@example.test'
$replacementEmail = 'replacement.tester@example.test'
$rejectedEmail = 'unapproved.tester@example.test'
$password = 'Synthetic-P57-Password!47'
$wrongPassword = 'Synthetic-Wrong-Password!83'
$runtimeMarker = "synthetic-runtime-secret-$suffix"
$baseUri = 'http://127.0.0.1:7860'
$verifiedHost = 'candidate-access.isees.invalid'
$results = [ordered]@{
    schema = 'p57-ops-hf-i3-i3/v1'; result = 'FAIL'; image = $Image; imageSha = $null
    guestSpa = 'FAIL'; approvedRegistration = 'FAIL'; unapprovedRegistration = 'FAIL'
    loginAndSession = 'FAIL'; restartSurvival = 'FAIL'; eligibilityRemoval = 'FAIL'
    invalidPolicyFailClosed = 'FAIL'; persistentVolumeIntegrity = 'FAIL'
    secretLeakage = 'FAIL'; marketMindPaths = $null; cleanup = 'PENDING'
}

function ConvertTo-SafeDiagnostic([string] $Text) {
    $safe = [string] $Text
    foreach ($value in @($approvedEmail, $replacementEmail, $rejectedEmail, $password, $wrongPassword, $runtimeMarker)) {
        if ($value) { $safe = $safe.Replace($value, '[REDACTED]', [StringComparison]::OrdinalIgnoreCase) }
    }
    $safe = $safe -replace '(?i)(set-cookie\s*:\s*)[^\r\n]+', '$1[REDACTED]'
    $safe = $safe -replace '(?i)(cookie|csrf(?:[_-]?token)?|authorization|password|secret|token)(\s*[=:]\s*)[^\s,;]+', '$1$2[REDACTED]'
    $safe = $safe -replace '(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', '[REDACTED_EMAIL]'
    $safe.Trim()
}

function Invoke-Docker {
    param(
        [Parameter(Mandatory)] [string] $Operation,
        [Parameter(Mandatory)] [string[]] $Arguments,
        [switch] $AllowFailure
    )
    $priorErrorActionPreference = $ErrorActionPreference
    $nativeErrorPreference = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
    $hasNativeErrorPreference = $null -ne $nativeErrorPreference
    if ($hasNativeErrorPreference) { $priorNativeErrorPreference = $nativeErrorPreference.Value }
    try {
        $ErrorActionPreference = 'Continue'
        if ($hasNativeErrorPreference) { $PSNativeCommandUseErrorActionPreference = $false }
        $output = @(& docker @Arguments 2>&1 | ForEach-Object { [string] $_ })
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $priorErrorActionPreference
        if ($hasNativeErrorPreference) { $PSNativeCommandUseErrorActionPreference = $priorNativeErrorPreference }
    }
    $diagnostic = ConvertTo-SafeDiagnostic ($output -join "`n")
    if (-not $AllowFailure -and $code -ne 0) {
        if (-not $diagnostic) { $diagnostic = '[no diagnostic output]' }
        throw "Docker operation '$Operation' failed with exit code $code. Diagnostic: $diagnostic"
    }
    [pscustomobject]@{ Code = $code; Output = ($output -join "`n") }
}

function Assert-True([bool] $Condition, [string] $Message) {
    if (-not $Condition) { throw $Message }
}

function Invoke-Http([string] $Method, [string] $Path, [string] $Body = '', [string] $Cookie = '') {
    $headers = @{ Host = $verifiedHost }
    if ($Cookie) { $headers.Cookie = $Cookie }
    $parameters = @{
        Uri = "$baseUri$Path"; Method = $Method; Headers = $headers
        SkipHttpErrorCheck = $true; MaximumRedirection = 0
    }
    if ($Body) { $parameters.ContentType = 'application/json'; $parameters.Body = $Body }
    $response = Invoke-WebRequest @parameters
    [pscustomobject]@{
        Status = [int] $response.StatusCode; ContentType = [string] $response.Headers['Content-Type']
        Body = [string] $response.Content; Headers = $response.Headers
    }
}

function Get-SessionCookie($Response) {
    $setCookies = @($Response.Headers['Set-Cookie'])
    $session = $setCookies | Where-Object { $_ -match '^isees_session=' } | Select-Object -First 1
    Assert-True ($null -ne $session) 'session cookie was not issued'
    ($session -split ';', 2)[0]
}

function Wait-Ready([string] $ContainerName, [int] $ExpectedStatus = 200) {
    $lastHttpStatus = $null
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $state = Invoke-Docker -Operation 'inspect readiness state for test container' -Arguments @('inspect', '--format', '{{.State.Status}} {{.State.ExitCode}}', $ContainerName)
        if ($state.Output -match '^exited\s+(-?\d+)$') {
            $logs = ConvertTo-SafeDiagnostic (Invoke-Docker -Operation 'collect logs from exited test container' -Arguments @('logs', $ContainerName) -AllowFailure).Output
            if (-not $logs) { $logs = '[no container log output]' }
            throw "Container exited before readiness with exit code $($Matches[1]). Sanitized logs: $logs"
        }
        try {
            $response = Invoke-Http GET '/ready'
            if ($response.Status -eq $ExpectedStatus) { return $response }
            $lastHttpStatus = $response.Status
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    if ($null -ne $lastHttpStatus) { throw "HTTP readiness failure: expected HTTP $ExpectedStatus; last status was $lastHttpStatus" }
    throw 'Container readiness timeout: no HTTP response was received'
}

function Start-TestContainer([string] $Name, [string] $Allowlist) {
    $containers.Add($Name)
    $arguments = @(
        'run', '--detach', '--name', $Name, '--publish', '127.0.0.1:7860:7860',
        '--mount', "type=volume,source=$volume,target=/data",
        '--env', 'PORT=7860', '--env', 'ISEES_AUTH_ENV=production',
        '--env', "ISEES_TRUSTED_HOSTS=$verifiedHost",
        '--env', 'ISEES_CANDIDATE_ACCESS_MODE=enabled',
        '--env', "ISEES_APPROVED_TESTER_EMAILS=$Allowlist",
        '--env', "ISEES_RUNTIME_SECRET=$runtimeMarker", $Image
    )
    Invoke-Docker -Operation 'create and start candidate-access test container' -Arguments $arguments | Out-Null
    Wait-Ready -ContainerName $Name | Out-Null
}

function Stop-TestContainer([string] $Name) {
    $capturedLogs.Add((Invoke-Docker -Operation 'collect test container logs before removal' -Arguments @('logs', $Name) -AllowFailure).Output)
    Invoke-Docker -Operation 'remove test container before host-port reuse' -Arguments @('rm', '--force', $Name) | Out-Null
    $removedState = Invoke-Docker -Operation 'confirm test container removal before host-port reuse' -Arguments @('inspect', $Name) -AllowFailure
    Assert-True ($removedState.Code -ne 0) 'test container still exists after removal'
}

function Get-SameOriginModuleAssetPaths([string] $Html) {
    $assetPaths = [Collections.Generic.List[string]]::new()
    foreach ($scriptMatch in [regex]::Matches($Html, '(?is)<script\b(?<attributes>[^>]*)>')) {
        $attributes = $scriptMatch.Groups['attributes'].Value
        $typeMatch = [regex]::Match($attributes, '(?i)(?:^|\s)type\s*=\s*(["''])(?<value>.*?)\1')
        $sourceMatch = [regex]::Match($attributes, '(?i)(?:^|\s)src\s*=\s*(["''])(?<value>.*?)\1')
        if (-not $typeMatch.Success -or $typeMatch.Groups['value'].Value -ne 'module' -or -not $sourceMatch.Success) { continue }

        $source = [Net.WebUtility]::HtmlDecode($sourceMatch.Groups['value'].Value)
        $assetUri = $null
        if (-not [Uri]::TryCreate([Uri] $baseUri, $source, [ref] $assetUri)) { continue }
        $originUri = [Uri] $baseUri
        if ($assetUri.Scheme -ne $originUri.Scheme -or $assetUri.Host -ne $originUri.Host -or $assetUri.Port -ne $originUri.Port) { continue }
        if ($assetUri.AbsolutePath -notmatch '\.js$') { continue }
        $assetPaths.Add($assetUri.PathAndQuery)
    }
    @($assetPaths | Select-Object -Unique)
}

function Test-GuestEntryMarker([string] $JavaScript) {
    $JavaScript.Contains('Continue as guest', [StringComparison]::Ordinal) -or
        $JavaScript -match 'Continue(?:\\x20|\\u0020|\s)+as(?:\\x20|\\u0020|\s)+guest'
}

function Assert-PublicContract {
    $root = Invoke-Http GET '/'
    Assert-True ($root.Status -eq 200 -and $root.ContentType -match '^text/html' -and
        $root.Body -match '(?is)<!doctype\s+html' -and $root.Body -match '(?is)<html\b' -and
        $root.Body -match '(?is)<div\b[^>]*\bid\s*=\s*(["''])root\1') 'SPA HTML unavailable or invalid at GET /'
    $moduleAssetPaths = @(Get-SameOriginModuleAssetPaths $root.Body)
    Assert-True ($moduleAssetPaths.Count -gt 0) 'SPA HTML unavailable or invalid: no same-origin JavaScript module asset was referenced'
    $guestEntryFound = $false
    foreach ($assetPath in $moduleAssetPaths) {
        $asset = Invoke-Http GET $assetPath
        Assert-True ($asset.Status -eq 200) "compiled JavaScript asset unavailable: $assetPath returned HTTP $($asset.Status)"
        Assert-True (-not $asset.ContentType -or $asset.ContentType -match '^(?:application|text)/(?:javascript|ecmascript)\b') "compiled JavaScript asset unavailable: $assetPath returned non-JavaScript content type"
        if (Test-GuestEntryMarker $asset.Body) { $guestEntryFound = $true }
    }
    Assert-True $guestEntryFound 'guest-entry marker was absent from the compiled application'
    foreach ($route in @('/overview', '/compare', '/studio')) {
        $spa = Invoke-Http GET $route
        Assert-True ($spa.Status -eq 200 -and $spa.ContentType -match '^text/html') "SPA route failed: $route"
    }
    $health = Invoke-Http GET '/health'
    $ready = Invoke-Http GET '/ready'
    Assert-True ($health.Status -eq 200 -and $health.Body -match '"status":"live"') 'health failed'
    Assert-True ($ready.Status -eq 200 -and $ready.Body -match '"status":"ready"') 'readiness failed'
    return @($root, $health, $ready)
}

function Assert-GenericFailure($Response, [int] $Status, [string] $Code) {
    Assert-True ($Response.Status -eq $Status) "expected HTTP $Status, got $($Response.Status)"
    $expectedCode = '"code":"{0}"' -f $Code
    Assert-True ($Response.Body -match [regex]::Escape($expectedCode)) "expected failure code $Code"
}

function Assert-NoSensitiveText([string] $Text, [string] $Context, [switch] $PermitApprovedEcho) {
    foreach ($secret in @($password, $wrongPassword, $runtimeMarker, $replacementEmail, $rejectedEmail)) {
        Assert-True (-not $Text.Contains($secret, [StringComparison]::OrdinalIgnoreCase)) "$Context disclosed synthetic secret input"
    }
    if (-not $PermitApprovedEcho) {
        Assert-True (-not $Text.Contains($approvedEmail, [StringComparison]::OrdinalIgnoreCase)) "$Context disclosed approved address"
    }
    Assert-True ($Text -notmatch '(?i)authentication\.sqlite3') "$Context disclosed a protected storage filename"
}

function Get-RuntimeValueLeakCategories([string] $Text) {
    $categories = [Collections.Generic.List[string]]::new()
    if (@($approvedEmail, $replacementEmail, $rejectedEmail) | Where-Object { $Text.Contains($_, [StringComparison]::OrdinalIgnoreCase) }) {
        $categories.Add('RUNTIME_EMAIL_VALUE')
    }
    if (@($password, $wrongPassword) | Where-Object { $Text.Contains($_, [StringComparison]::Ordinal) }) {
        $categories.Add('RUNTIME_PASSWORD_VALUE')
    }
    if ($Text.Contains($runtimeMarker, [StringComparison]::Ordinal)) {
        $categories.Add('RUNTIME_MARKER_VALUE')
    }
    $categories
}

function Assert-ImageMetadataSafe([string] $Metadata) {
    $categories = [Collections.Generic.List[string]]::new()
    $resolvedRoot = [IO.Path]::GetFullPath($RepositoryRoot).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    $rootForms = @(
        $resolvedRoot,
        $resolvedRoot.Replace('\', '/'),
        $resolvedRoot.Replace('\', '\\')
    ) | Select-Object -Unique
    if ($rootForms | Where-Object { $Metadata.Contains($_, [StringComparison]::OrdinalIgnoreCase) }) {
        $categories.Add('LOCAL_BUILD_PATH')
    }
    foreach ($category in @(Get-RuntimeValueLeakCategories $Metadata)) { $categories.Add($category) }
    if ($categories.Count) {
        throw ($categories -join ',')
    }
}

try {
    Assert-True ((git -C $RepositoryRoot branch --show-current) -eq 'hf-deploy') 'branch is not hf-deploy'
    $head = git -C $RepositoryRoot rev-parse HEAD
    $originHead = git -C $RepositoryRoot rev-parse origin/hf-deploy
    Assert-True ($head -eq $originHead -and $head -eq $ExpectedHead.ToLowerInvariant()) 'HEAD does not match the explicit source authority'

    Invoke-Docker -Operation 'build retained candidate-access image' -Arguments @('build', '--no-cache', '--pull=false', '--provenance=false', '--tag', $Image, $RepositoryRoot) | Out-Null
    $results.imageSha = (Invoke-Docker -Operation 'inspect retained image identifier' -Arguments @('image', 'inspect', $Image, '--format', '{{.Id}}')).Output.Trim()
    Invoke-Docker -Operation 'verify Python package import in image' -Arguments @('run', '--rm', '--entrypoint', 'python', $Image, '-c', 'import isees_uap.api; print("IMPORT_OK")') | Out-Null
    $construction = (Invoke-Docker -Operation 'verify required image content and excluded paths' -Arguments @('run', '--rm', '--entrypoint', '/bin/sh', $Image, '-c', 'test -f /app/frontend/index.html && test -d /app/frontend/assets && test -f /app/isees_uap/api/v1/authentication.py && test -f /app/isees_uap/authentication/candidate_access.py && test -f /app/isees_uap/authentication/service.py && { find / -iname "*marketmind*" -print 2>/dev/null || true; }')).Output
    $marketPaths = @($construction -split "`r?`n" | Where-Object { $_ })
    $results.marketMindPaths = $marketPaths.Count
    Assert-True ($marketPaths.Count -eq 0) 'MarketMind paths were found in the image'
    $metadata = (Invoke-Docker -Operation 'inspect image metadata for sensitive text' -Arguments @('image', 'inspect', $Image)).Output
    Assert-ImageMetadataSafe $metadata
    $filesystemScanner = 'import os,sys; groups=[(1,[os.environ["SCAN_EMAIL_A"],os.environ["SCAN_EMAIL_B"],os.environ["SCAN_EMAIL_C"]]),(2,[os.environ["SCAN_PASSWORD_A"],os.environ["SCAN_PASSWORD_B"]]),(4,[os.environ["SCAN_MARKER"]])]; needles=[(bit,value.encode()) for bit,values in groups for value in values]; found=0; excluded={"/proc","/sys","/dev","/run","/tmp","/data"};' + "`n" + 'for root,dirs,files in os.walk("/",topdown=True,followlinks=False):' + "`n" + ' dirs[:]=[d for d in dirs if os.path.join(root,d) not in excluded]' + "`n" + ' for name in files:' + "`n" + '  try:' + "`n" + '   with open(os.path.join(root,name),"rb") as stream: data=stream.read()' + "`n" + '  except (OSError,MemoryError): continue' + "`n" + '  for bit,value in needles:' + "`n" + '   if value in data: found|=bit' + "`n" + 'sys.exit(found)'
    $filesystemScan = Invoke-Docker -Operation 'scan image filesystem for runtime values' -Arguments @(
        'run', '--rm', '--entrypoint', 'python',
        '--env', "SCAN_EMAIL_A=$approvedEmail", '--env', "SCAN_EMAIL_B=$replacementEmail", '--env', "SCAN_EMAIL_C=$rejectedEmail",
        '--env', "SCAN_PASSWORD_A=$password", '--env', "SCAN_PASSWORD_B=$wrongPassword", '--env', "SCAN_MARKER=$runtimeMarker",
        $Image, '-c', $filesystemScanner
    ) -AllowFailure
    $filesystemCategories = [Collections.Generic.List[string]]::new()
    if (($filesystemScan.Code -band 1) -ne 0) { $filesystemCategories.Add('RUNTIME_EMAIL_VALUE') }
    if (($filesystemScan.Code -band 2) -ne 0) { $filesystemCategories.Add('RUNTIME_PASSWORD_VALUE') }
    if (($filesystemScan.Code -band 4) -ne 0) { $filesystemCategories.Add('RUNTIME_MARKER_VALUE') }
    Assert-True ($filesystemScan.Code -ge 0 -and $filesystemScan.Code -le 7) 'image filesystem scan did not complete'
    if ($filesystemCategories.Count) { throw "image filesystem leakage categories: $($filesystemCategories -join ',')" }

    Invoke-Docker -Operation 'create isolated candidate-access test volume' -Arguments @('volume', 'create', $volume) | Out-Null
    $volumeCreated = $true
    $first = "$containerPrefix-primary"
    Start-TestContainer $first "  APPROVED.TESTER@EXAMPLE.TEST  ,$replacementEmail"
    $publicResponses = Assert-PublicContract
    $results.guestSpa = 'PASS'

    $registrationBody = @{ email = '  APPROVED.TESTER@EXAMPLE.TEST  '; password = $password } | ConvertTo-Json -Compress
    $registration = Invoke-Http POST '/api/v1/auth/accounts' $registrationBody
    Assert-True ($registration.Status -eq 201 -and $registration.Body -match 'approved\.tester@example\.test') 'approved normalized registration failed'
    $issuedCookie = Get-SessionCookie $registration
    $results.approvedRegistration = 'PASS'
    $unapproved = Invoke-Http POST '/api/v1/auth/accounts' (@{ email=$rejectedEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-GenericFailure $unapproved 409 'ACCOUNT_UNAVAILABLE'
    Assert-NoSensitiveText $unapproved.Body 'unapproved registration response'
    $results.unapprovedRegistration = 'PASS'

    $login = Invoke-Http POST '/api/v1/auth/sessions' (@{ email=$approvedEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-True ($login.Status -eq 200) 'approved login failed'
    $loginCookie = Get-SessionCookie $login
    $wrong = Invoke-Http POST '/api/v1/auth/sessions' (@{ email=$approvedEmail; password=$wrongPassword } | ConvertTo-Json -Compress)
    Assert-GenericFailure $wrong 401 'INVALID_CREDENTIALS'
    $restored = Invoke-Http GET '/api/v1/auth/session' '' $loginCookie
    Assert-True ($restored.Status -eq 200 -and $restored.Body -match 'approved\.tester@example\.test') 'session restoration failed'
    $results.loginAndSession = 'PASS'

    $integrityBefore = (Invoke-Docker -Operation 'check persistent database integrity before restart' -Arguments @('exec', $first, 'python', '-c', 'import os,sqlite3; p="/data/isees/databases/authentication.sqlite3"; c=sqlite3.connect(p); print(os.path.getsize(p),c.execute("pragma integrity_check").fetchone()[0],c.execute("select count(*) from researcher_account").fetchone()[0])')).Output.Trim()
    Assert-True ($integrityBefore -match '^\d+ ok 1$') 'persistent account database integrity failed before restart'
    Stop-TestContainer $first
    $second = "$containerPrefix-restart"
    Start-TestContainer $second "$approvedEmail,$replacementEmail"
    $restartLogin = Invoke-Http POST '/api/v1/auth/sessions' (@{ email=$approvedEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-True ($restartLogin.Status -eq 200) 'account did not survive container replacement'
    Assert-PublicContract | Out-Null
    $results.restartSurvival = 'PASS'

    $preRemovalCookie = Get-SessionCookie $restartLogin
    Stop-TestContainer $second
    $removed = "$containerPrefix-removed"
    Start-TestContainer $removed $replacementEmail
    $removedLogin = Invoke-Http POST '/api/v1/auth/sessions' (@{ email=$approvedEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-GenericFailure $removedLogin 401 'INVALID_CREDENTIALS'
    $removedRestore = Invoke-Http GET '/api/v1/auth/session' '' $preRemovalCookie
    Assert-GenericFailure $removedRestore 401 'AUTHENTICATION_REQUIRED'
    Assert-PublicContract | Out-Null
    $integrityRemoved = (Invoke-Docker -Operation 'check persistent database integrity after eligibility removal' -Arguments @('exec', $removed, 'python', '-c', 'import os,sqlite3; p="/data/isees/databases/authentication.sqlite3"; c=sqlite3.connect(p); print(os.path.getsize(p),c.execute("pragma integrity_check").fetchone()[0],c.execute("select count(*) from researcher_account").fetchone()[0])')).Output.Trim()
    Assert-True ($integrityRemoved -match '^\d+ ok 1$') 'account data was deleted or damaged after eligibility removal'
    $results.eligibilityRemoval = 'PASS'
    $results.persistentVolumeIntegrity = 'PASS'
    Stop-TestContainer $removed

    $invalid = "$containerPrefix-invalid"
    Start-TestContainer $invalid 'invalid-policy-entry'
    $invalidRegister = Invoke-Http POST '/api/v1/auth/accounts' (@{ email=$replacementEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-GenericFailure $invalidRegister 409 'ACCOUNT_UNAVAILABLE'
    $invalidLogin = Invoke-Http POST '/api/v1/auth/sessions' (@{ email=$approvedEmail; password=$password } | ConvertTo-Json -Compress)
    Assert-GenericFailure $invalidLogin 401 'INVALID_CREDENTIALS'
    $invalidRestore = Invoke-Http GET '/api/v1/auth/session' '' $issuedCookie
    Assert-GenericFailure $invalidRestore 401 'AUTHENTICATION_REQUIRED'
    $invalidPublic = Assert-PublicContract
    foreach ($response in $invalidPublic) { Assert-NoSensitiveText $response.Body 'public status response' }
    foreach ($response in @($unapproved, $wrong, $removedLogin, $removedRestore, $invalidRegister, $invalidLogin, $invalidRestore)) { Assert-NoSensitiveText $response.Body 'authentication failure response' }
    $results.invalidPolicyFailClosed = 'PASS'

    $capturedLogs.Add((Invoke-Docker -Operation 'collect invalid-policy test container logs' -Arguments @('logs', $invalid) -AllowFailure).Output)
    $allLogs = $capturedLogs -join "`n"
    foreach ($value in @($approvedEmail, $replacementEmail, $rejectedEmail, $password, $wrongPassword, $runtimeMarker)) {
        Assert-True (-not $allLogs.Contains($value, [StringComparison]::OrdinalIgnoreCase)) 'container logs disclosed submitted values'
    }
    $results.secretLeakage = 'PASS'
    $results.result = 'PASS'
} finally {
    foreach ($name in $containers) { Invoke-Docker -Operation 'cleanup uniquely named candidate-access test container' -Arguments @('rm', '--force', $name) -AllowFailure | Out-Null }
    if ($volumeCreated) { Invoke-Docker -Operation 'cleanup isolated candidate-access test volume' -Arguments @('volume', 'rm', $volume) -AllowFailure | Out-Null }
    $remainingContainers = if ($containers.Count) { (Invoke-Docker -Operation 'verify candidate-access test container cleanup' -Arguments @('ps', '--all', '--filter', "name=$containerPrefix", '--format', '{{.Names}}') -AllowFailure).Output.Trim() } else { '' }
    $remainingVolume = if ($volumeCreated) { (Invoke-Docker -Operation 'verify candidate-access test volume cleanup' -Arguments @('volume', 'ls', '--filter', "name=$volume", '--format', '{{.Name}}') -AllowFailure).Output.Trim() } else { '' }
    $results.cleanup = if (-not $remainingContainers -and -not $remainingVolume) { 'PASS' } else { 'FAIL' }
    if ($results.cleanup -ne 'PASS') { $results.result = 'FAIL' }
    $results | ConvertTo-Json -Compress
}

if ($results.result -ne 'PASS') { exit 1 }
