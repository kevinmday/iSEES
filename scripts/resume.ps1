# ============================================
# iSEES CONTINUITY REHYDRATION
# ============================================

$path =
"C:\dev\IntentionalTradingSystem\isees_uap\epistemic\handover_states"

$latest =
Get-ChildItem `
    $path `
| Sort-Object LastWriteTime -Descending `
| Select-Object -First 1

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES CONTINUITY REHYDRATION"
Write-Host "============================================"
Write-Host ""

Write-Host "Opening Latest Checkpoint:"
Write-Host $latest.Name

Write-Host ""

notepad $latest.FullName