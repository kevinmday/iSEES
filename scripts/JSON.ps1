param()

# ============================================
# ENGINEERING COGNITION SNAPSHOT GENERATOR
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES EPISTEMIC CONTINUITY CHECKPOINT"
Write-Host "============================================"
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"

$phase = Read-Host "Phase Name"
$classification = Read-Host "Phase Classification"
$objective = Read-Host "Primary Objective"

Write-Host ""
Write-Host "Enter stabilized discoveries separated by commas."
$discoveriesInput = Read-Host "Discoveries"

Write-Host ""
Write-Host "Enter danger zones separated by commas."
$dangerInput = Read-Host "Danger Zones"

Write-Host ""
Write-Host "Enter next tasks separated by commas."
$tasksInput = Read-Host "Next Tasks"

Write-Host ""
$continuityPosture = Read-Host "Continuity Posture"

$discoveries = $discoveriesInput -split "," | ForEach-Object {
    $_.Trim()
}

$dangerZones = $dangerInput -split "," | ForEach-Object {
    $_.Trim()
}

$nextTasks = $tasksInput -split "," | ForEach-Object {
    $_.Trim()
}

$artifact = @{
    artifact_type = "ENGINEERING_COGNITION_STATE"
    artifact_version = "0.1"

    timestamp = $timestamp

    phase = @{
        name = $phase
        classification = $classification
        primary_objective = $objective
    }

    stabilized_discoveries = $discoveries

    danger_zones = $dangerZones

    next_tasks = $nextTasks

    continuity = @{
        posture = $continuityPosture
    }
}

$fileName = "ECS_$($timestamp)_$($phase -replace ' ','_').json"

$outputPath = Join-Path `
    "C:\dev\IntentionalTradingSystem\isees_uap\epistemic\handover_states" `
    $fileName

$artifact | ConvertTo-Json -Depth 10 | Set-Content $outputPath

Write-Host ""
Write-Host "============================================"
Write-Host " EPISTEMIC SNAPSHOT GENERATED"
Write-Host "============================================"
Write-Host ""
Write-Host $outputPath
Write-Host ""
