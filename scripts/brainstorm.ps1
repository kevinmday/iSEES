param()

# ============================================
# BRAINSTORM ARTIFACT ARCHIVER
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES BRAINSTORM ARCHIVER"
Write-Host "============================================"
Write-Host ""

$sourceFile =
    "C:\dev\IntentionalTradingSystem\brainstorm.json"

$outputDir =
    "C:\dev\IntentionalTradingSystem\isees_uap\epistemic\cognition_states"

if (!(Test-Path $sourceFile)) {

    Write-Host "brainstorm.json not found."
    Write-Host ""

    exit
}

if (!(Test-Path $outputDir)) {

    New-Item `
        -ItemType Directory `
        -Path $outputDir `
        -Force | Out-Null
}

try {

    $artifact =
        Get-Content `
            $sourceFile `
            -Raw |
        ConvertFrom-Json

}
catch {

    Write-Host "Invalid JSON."
    Write-Host ""

    exit
}

$timestamp =
    Get-Date -Format "yyyy-MM-ddTHH-mm-ss"

$title =
    $artifact.title

if ([string]::IsNullOrWhiteSpace($title)) {

    $title = "UNTITLED"
}

$safeTitle =
    $title `
        -replace '[^a-zA-Z0-9_\- ]','' `
        -replace ' ','_'

$fileName =
    "BRAINSTORM_$($timestamp)_$($safeTitle).json"

$outputPath =
    Join-Path `
        $outputDir `
        $fileName

Copy-Item `
    $sourceFile `
    $outputPath `
    -Force

Write-Host ""
Write-Host "============================================"
Write-Host " BRAINSTORM SAVED"
Write-Host "============================================"
Write-Host ""

Write-Host "Title:"
Write-Host $title

Write-Host ""

Write-Host "Saved To:"
Write-Host $outputPath

Write-Host ""