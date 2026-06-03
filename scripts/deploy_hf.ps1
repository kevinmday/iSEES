# =========================================================

# iSEES OPERATOR DEPLOYMENT PIPELINE

# GitHub + Hugging Face Deployment

# =========================================================

Write-Host ""
Write-Host "========================================="
Write-Host " iSEES OPERATOR DEPLOYMENT PIPELINE"
Write-Host "========================================="
Write-Host ""

# ---------------------------------------------------------

# CONFIG

# ---------------------------------------------------------

$ENGINEERING_ROOT = "C:\dev\IntentionalTradingSystem"
$UI = "$ENGINEERING_ROOT\isees-ui"
$DIST = "$UI\dist"

$ENGINEERING_BRANCH = "hf-deploy"

$HF_ROOT = "C:\dev\iSEES-Operator"

# ---------------------------------------------------------

# VALIDATE PATHS

# ---------------------------------------------------------

if (!(Test-Path $ENGINEERING_ROOT)) {
Write-Host "ERROR: Engineering repo missing."
exit 1
}

if (!(Test-Path $UI)) {
Write-Host "ERROR: UI path missing."
exit 1
}

if (!(Test-Path $HF_ROOT)) {
Write-Host "ERROR: HF deployment repo missing."
exit 1
}

# ---------------------------------------------------------

# ENGINEERING REPO

# ---------------------------------------------------------

Set-Location $ENGINEERING_ROOT

Write-Host "[1/10] Switching to engineering branch..."

git checkout $ENGINEERING_BRANCH

if ($LASTEXITCODE -ne 0) {
Write-Host "ERROR: Failed to switch branch."
exit 1
}

# ---------------------------------------------------------

# VERIFY CLEAN REPO

# ---------------------------------------------------------

Write-Host ""
Write-Host "[2/10] Verifying clean engineering repository..."

$gitStatus =
git status --porcelain

if ($gitStatus) {

Write-Host ""
Write-Host "ERROR: Engineering repository is not clean."
Write-Host ""
git status
Write-Host ""

exit 1


}

Write-Host "Engineering repository clean."

# ---------------------------------------------------------

# BUILD UI

# ---------------------------------------------------------

Write-Host ""
Write-Host "[3/10] Building Vite frontend..."

Set-Location $UI

npm run build

if ($LASTEXITCODE -ne 0) {
Write-Host "ERROR: Build failed."
exit 1
}

# ---------------------------------------------------------

# VALIDATE BUILD

# ---------------------------------------------------------

Write-Host ""
Write-Host "[4/10] Validating build output..."

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

# PUSH GITHUB

# ---------------------------------------------------------

Write-Host ""
Write-Host "[5/10] Pushing engineering repository..."

Set-Location $ENGINEERING_ROOT

git push origin $ENGINEERING_BRANCH

if ($LASTEXITCODE -ne 0) {
Write-Host "ERROR: GitHub push failed."
exit 1
}

# ---------------------------------------------------------

# CLEAN HF DEPLOYMENT REPO

# ---------------------------------------------------------

Write-Host ""
Write-Host "[6/10] Cleaning HF deployment repository..."

Set-Location $HF_ROOT

Get-ChildItem -Force | Where-Object {

$_.Name -ne ".git" `
-and $_.Name -ne ".gitattributes" `
-and $_.Name -ne "README.md"

} | Remove-Item -Recurse -Force

# ---------------------------------------------------------

# COPY BUILD

# ---------------------------------------------------------

Write-Host ""
Write-Host "[7/10] Hydrating HF deployment repository..."

Copy-Item `
    -Path "$DIST\*" `
    -Destination $HF_ROOT `
    -Recurse `
    -Force

# ---------------------------------------------------------

# VALIDATE HF DEPLOYMENT

# ---------------------------------------------------------

Write-Host ""
Write-Host "[8/10] Validating HF deployment repository..."

if (!(Test-Path "$HF_ROOT\index.html")) {
Write-Host "ERROR: index.html missing."
exit 1
}

if (!(Test-Path "$HF_ROOT\assets")) {
Write-Host "ERROR: assets folder missing."
exit 1
}

Write-Host "HF deployment validation successful."

# ---------------------------------------------------------

# COMMIT HF REPO

# ---------------------------------------------------------

Write-Host ""
Write-Host "[9/10] Committing HF deployment..."

Set-Location $HF_ROOT

git add .

$timestamp =
Get-Date -Format "yyyy-MM-dd HH:mm:ss"

git commit `
-m "Operator deployment hydration $timestamp"

# ---------------------------------------------------------

# PUSH HF

# ---------------------------------------------------------

Write-Host ""
Write-Host "[10/10] Publishing to Hugging Face..."

git push origin main

if ($LASTEXITCODE -ne 0) {
Write-Host "ERROR: HF push failed."
exit 1
}

Write-Host ""
Write-Host "========================================="
Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY"
Write-Host "========================================="
Write-Host ""

Write-Host "GitHub:"
Write-Host "  IntentionalTradingSystem"

Write-Host ""
Write-Host "Hugging Face:"
Write-Host "  kevinmday/iSEES-Operator"

Write-Host ""
