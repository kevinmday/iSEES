param(
  [Parameter(Mandatory = $true)]
  [string]$ZipPath
)

$ErrorActionPreference = "Stop"
$resolvedZip = (Resolve-Path -LiteralPath $ZipPath).Path
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($resolvedZip)
try {
  $entries = @($archive.Entries | Where-Object { $_.FullName -and -not $_.FullName.EndsWith("/") } | Sort-Object FullName)
  $names = @($entries.FullName)
  if ($names.Count -eq 0) { throw "Edge Add-ons ZIP is empty." }
  $required = @(
    "manifest.json", "popup.html",
    "icons/isees-capture-16.png", "icons/isees-capture-32.png",
    "icons/isees-capture-48.png", "icons/isees-capture-128.png",
    "icons/isees-capture.svg"
  )
  foreach ($requiredEntry in $required) {
    if ($names -notcontains $requiredEntry) { throw "ZIP root is missing $requiredEntry." }
  }
  if (@($names | Where-Object { $_ -match '^assets/popup-[A-Za-z0-9_-]+\.js$' }).Count -ne 1) { throw "ZIP must contain exactly one compiled popup JavaScript asset." }
  if (@($names | Where-Object { $_ -match '^assets/popup-[A-Za-z0-9_-]+\.css$' }).Count -ne 1) { throw "ZIP must contain exactly one compiled popup CSS asset." }
  if ($names.Count -ne 9) { throw "ZIP must contain exactly the nine production runtime files." }
  foreach ($name in $names) {
    if ($required -notcontains $name -and $name -notmatch '^assets/popup-[A-Za-z0-9_-]+\.(js|css)$') { throw "ZIP contains unexpected repository or development file: $name" }
  }
  if ($names | Where-Object { $_ -match '(^|/)dist/' }) { throw "ZIP contains an enclosing dist directory." }
  $forbidden = @(
    '\.pem$', '\.crx$', '\.map$', '(^|/)node_modules/', '(^|/)verification/',
    '(^|/)\.git/', '\.isees-source\.json$', 'cookie', 'credential', 'token',
    'browser[-_ ]?storage', 'request[-_ ]?headers'
  )
  foreach ($pattern in $forbidden) {
    if ($names | Where-Object { $_ -match $pattern }) { throw "ZIP contains prohibited material matching $pattern." }
  }
  foreach ($entry in $entries) {
    $stream = $entry.Open()
    $memory = [System.IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); $text = [System.Text.Encoding]::ASCII.GetString($memory.ToArray()) } finally { $memory.Dispose(); $stream.Dispose() }
    if ($text -match '-----BEGIN [A-Z ]*PRIVATE KEY-----') { throw "ZIP contains private key material." }
  }
  $manifestEntry = $entries | Where-Object FullName -eq "manifest.json"
  $reader = [System.IO.StreamReader]::new($manifestEntry.Open())
  try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
  if ($manifest.name -ne "iSEES Capture") { throw "Unexpected manifest product name." }
  if ($manifest.version -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') { throw "Manifest version is not packageable." }
  if (@($manifest.permissions) -join ',' -ne 'activeTab,scripting,downloads,storage') { throw "Manifest permissions changed." }
  if ($null -ne $manifest.host_permissions) { throw "host_permissions must be absent." }
  if ($null -ne $manifest.background) { throw "background must be absent." }
  $expectedName = "iSEES-Capture-for-Microsoft-Edge-v$($manifest.version).zip"
  if ([System.IO.Path]::GetFileName($resolvedZip) -ne $expectedName) { throw "ZIP filename must be $expectedName." }
  $hash = (Get-FileHash -LiteralPath $resolvedZip -Algorithm SHA256).Hash
  Write-Output "VerifyEdgeAddonsPackage: PASS"
  Write-Output "Path: $resolvedZip"
  Write-Output "SizeBytes: $((Get-Item -LiteralPath $resolvedZip).Length)"
  Write-Output "SHA256: $hash"
  Write-Output "Entries: $($names.Count)"
  $names | ForEach-Object { Write-Output " - $_" }
} finally {
  $archive.Dispose()
}
