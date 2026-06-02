# ============================================================
# checkpoint_and_deploy.ps1
# EPISTEMIC CHECKPOINT + HF DEPLOYMENT PIPELINE
# ============================================================

Write-Host ""
Write-Host "================================================"
Write-Host " iSEES CHECKPOINT + DEPLOY PIPELINE"
Write-Host "================================================"
Write-Host ""

# ------------------------------------------------------------
# ROOT
# ------------------------------------------------------------

$ROOT = "C:\dev\IntentionalTradingSystem"

if (!(Test-Path $ROOT)) {

    Write-Host "ERROR: Root path missing."
    exit 1
}

Set-Location $ROOT

# ------------------------------------------------------------
# CHECKPOINT
# ------------------------------------------------------------

Write-Host "[1/4] Generating epistemic continuity checkpoint..."
Write-Host ""

powershell `
    -ExecutionPolicy Bypass `
    -File ".\scripts\JSON.ps1"

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "ERROR: JSON checkpoint failed."
    exit 1
}

# ------------------------------------------------------------
# DEPLOY
# ------------------------------------------------------------

Write-Host ""
Write-Host "[2/4] Launching HF deployment pipeline..."
Write-Host ""

powershell `
    -ExecutionPolicy Bypass `
    -File ".\scripts\deploy_hf.ps1"

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "ERROR: HF deployment failed."
    exit 1
}

# ------------------------------------------------------------
# FINAL STATUS
# ------------------------------------------------------------

Write-Host ""
Write-Host "[3/4] Final git status..."
Write-Host ""

git status

# ------------------------------------------------------------
# COMPLETE
# ------------------------------------------------------------

Write-Host ""
Write-Host "[4/4] Pipeline complete."
Write-Host ""

Write-Host "================================================"
Write-Host " EPISTEMIC CHECKPOINT + DEPLOY COMPLETE"
Write-Host "================================================"
Write-Host ""

Write-Host "Operational State:"
Write-Host " - Continuity checkpoint generated"
Write-Host " - Runtime cognition lineage preserved"
Write-Host " - HF deployment synchronized"
Write-Host " - Git worktree validated"
Write-Host ""

Write-Host "Safe Resume Flow:"
Write-Host " 1. Open clean chat"
Write-Host " 2. Paste latest ECS snapshot"
Write-Host " 3. Type: resume"
Write-Host ""