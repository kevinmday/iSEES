# ============================================
# iSEES CONTINUITY REHYDRATION
# ============================================

Set-Location "C:\dev\IntentionalTradingSystem"

$path =
"C:\dev\IntentionalTradingSystem\isees_uap\epistemic\handover_states"

$latest =
Get-ChildItem `
    $path `
    -Filter "HANDOFF_*.json" `
    -ErrorAction SilentlyContinue |
Sort-Object LastWriteTime -Descending |
Select-Object -First 1

if (-not $latest) {

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host " NO HANDOFF FOUND" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""

    exit
}

$state =
    Get-Content `
        $latest.FullName `
        -Raw |
    ConvertFrom-Json

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " iSEES CONTINUITY REHYDRATION" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Latest Handoff:" -ForegroundColor Green
Write-Host $latest.Name
Write-Host ""

Write-Host "Timestamp:" -ForegroundColor Green
Write-Host $state.timestamp
Write-Host ""

Write-Host "System Mode:" -ForegroundColor Green
Write-Host $state.system_mode
Write-Host ""

Write-Host "Replay Posture:" -ForegroundColor Green
Write-Host $state.replay_posture
Write-Host ""

Write-Host "Active Branch:" -ForegroundColor Green
Write-Host $state.git_state.active_branch
Write-Host ""

Write-Host "Recent Commits:" -ForegroundColor Green
Write-Host "---------------"

foreach ($commit in $state.git_state.recent_commits) {

    Write-Host $commit
}

Write-Host ""

Write-Host "Operator Notes:" -ForegroundColor Green
Write-Host "---------------"
Write-Host $state.operator_notes
Write-Host ""

Write-Host "Recent Modified Files:" -ForegroundColor Green
Write-Host "----------------------"

foreach ($file in $state.recent_modified_files) {

    Write-Host $file
}

Write-Host ""

Write-Host "Repository Root:" -ForegroundColor Green
Write-Host $state.repo_root
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " CONTINUITY RESTORED" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""