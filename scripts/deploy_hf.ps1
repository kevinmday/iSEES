# =========================================================
# iSEES Hugging Face Deployment Script
# Deterministic Static Deployment Pipeline
# =========================================================

Write-Host ""
Write-Host "========================================="
Write-Host " iSEES HF Deployment Pipeline"
Write-Host "========================================="
Write-Host ""

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------

$ROOT = "C:\dev\IntentionalTradingSystem"
$UI = "$ROOT\isees-ui"
$DIST = "$UI\dist"
$BRANCH = "hf-deploy"

# ---------------------------------------------------------
# VALIDATE ROOT
# ---------------------------------------------------------

if (!(Test-Path $ROOT)) {
    Write-Host "ERROR: Root path missing."
    exit 1
}

if (!(Test-Path $UI)) {
    Write-Host "ERROR: UI path missing."
    exit 1
}

# ---------------------------------------------------------
# SWITCH TO ROOT
# ---------------------------------------------------------

Set-Location $ROOT

Write-Host "[1/9] Switching to deployment branch..."
git checkout $BRANCH

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to switch branch."
    exit 1
}

# ---------------------------------------------------------
# BUILD FRONTEND
# ---------------------------------------------------------

Write-Host ""
Write-Host "[2/9] Building Vite frontend..."

Set-Location $UI

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Vite build failed."
    exit 1
}

# ---------------------------------------------------------
# VALIDATE DIST
# ---------------------------------------------------------

Write-Host ""
Write-Host "[3/9] Validating build output..."

if (!(Test-Path "$DIST\index.html")) {
    Write-Host "ERROR: dist/index.html missing."
    exit 1
}

if (!(Test-Path "$DIST\assets")) {
    Write-Host "ERROR: dist/assets missing."
    exit 1
}

Write-Host "Build validation successful."

# ---------------------------------------------------------
# CLEAN OLD DEPLOYMENT ASSETS
# ---------------------------------------------------------

Write-Host ""
Write-Host "[4/9] Cleaning old deployment assets..."

Set-Location $ROOT

if (Test-Path "$ROOT\assets") {
    Remove-Item "$ROOT\assets" -Recurse -Force
}

if (Test-Path "$ROOT\index.html") {
    Remove-Item "$ROOT\index.html" -Force
}

# ---------------------------------------------------------
# COPY NEW BUILD
# ---------------------------------------------------------

Write-Host ""
Write-Host "[5/9] Hydrating deployment root..."

Copy-Item -Path "$DIST\*" -Destination $ROOT -Recurse -Force

# ---------------------------------------------------------
# VALIDATE DEPLOYMENT ROOT
# ---------------------------------------------------------

Write-Host ""
Write-Host "[6/9] Validating deployment root..."

if (!(Test-Path "$ROOT\index.html")) {
    Write-Host "ERROR: Deployment root missing index.html"
    exit 1
}

if (!(Test-Path "$ROOT\assets")) {
    Write-Host "ERROR: Deployment root missing assets folder"
    exit 1
}

if (!(Test-Path "$ROOT\README.md")) {
    Write-Host "ERROR: README.md missing"
    exit 1
}

Write-Host "Deployment root validation successful."

# ---------------------------------------------------------
# GIT STATUS
# ---------------------------------------------------------

Write-Host ""
Write-Host "[7/9] Git status..."
git status

# ---------------------------------------------------------
# COMMIT
# ---------------------------------------------------------

Write-Host ""
Write-Host "[8/9] Creating deployment commit..."

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

git add .

git commit -m "HF deployment hydration $timestamp"

# ---------------------------------------------------------
# PUSH
# ---------------------------------------------------------

Write-Host ""
Write-Host "[9/9] Pushing deployment branch..."

git push origin $BRANCH

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Push failed."
    exit 1
}

# ---------------------------------------------------------
# COMPLETE
# ---------------------------------------------------------

Write-Host ""
Write-Host "========================================="
Write-Host " HF deployment completed successfully."
Write-Host "========================================="
Write-Host ""