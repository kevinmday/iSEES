# ============================================
# P34.3
# ENGINEERING SESSION WRAP
# ============================================

Clear-Host

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "        iSEES Engineering Session Wrap"
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Engineering session successfully closed." -ForegroundColor Green

# ============================================
# SNAPSHOT NOTES
# ============================================

Write-Host ""
Write-Host "Snapshot Notes" -ForegroundColor Yellow
Write-Host "--------------"
Write-Host ""

$SnapshotNotes = Read-Host "Paste one-line snapshot (press Enter to skip)"

if (![string]::IsNullOrWhiteSpace($SnapshotNotes)) {

    Write-Host ""
    Write-Host "Snapshot:" -ForegroundColor Green
    Write-Host $SnapshotNotes
}

# ============================================
# NEXT SESSION
# ============================================

Write-Host ""
Write-Host "Next Steps" -ForegroundColor Yellow
Write-Host "----------"
Write-Host "1. Commit any remaining work (if applicable)."
Write-Host "2. Push changes (if applicable)."
Write-Host "3. Open a NEW ChatGPT conversation."
Write-Host "4. Type:"
Write-Host ""

Write-Host "    resume" -ForegroundColor Cyan

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""