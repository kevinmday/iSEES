# ============================================
# iSEES SESSION SNAPSHOT
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES SESSION SNAPSHOT"
Write-Host "============================================"
Write-Host ""

$root =
"C:\dev\IntentionalTradingSystem"

Set-Location $root

Write-Host "Current Branch:"
git branch --show-current

Write-Host ""

Write-Host "Recent Commits:"
git log --oneline -3

Write-Host ""

& "$root\scripts\handoff.ps1"