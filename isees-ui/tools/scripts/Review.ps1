# ============================================================
# Review.ps1
#
# iSEES Engineering Review Tool
#
# Version: 0.1
#
# Usage:
#
#   .\Review.ps1 SC-001 AA-001
#
# Opens the requested System Canon and Architectural Audit
# side-by-side in Visual Studio Code.
#
# ============================================================

param(

    [Parameter(Mandatory=$true)]
    [string]$Left,

    [Parameter(Mandatory=$true)]
    [string]$Right

)

# ------------------------------------------------------------
# Repository Root
# ------------------------------------------------------------

$Repo = "C:\dev\IntentionalTradingSystem\isees-ui"

Set-Location $Repo

# ------------------------------------------------------------
# Resolve Alias
# ------------------------------------------------------------

function Resolve-Document {

    param([string]$Id)

    if ($Id -match "^SC-\d+$") {

        $file = Get-ChildItem `
            "$Repo\docs\computational-canon" `
            -Filter "$Id*" |
            Select-Object -First 1

        return $file.FullName

    }

    elseif ($Id -match "^AA-\d+$") {

        $file = Get-ChildItem `
            "$Repo\docs\architecture-audit" `
            -Filter "$Id*" |
            Select-Object -First 1

        return $file.FullName

    }

    elseif ($Id -match "^IR-\d+$") {

        $file = Get-ChildItem `
            "$Repo\docs\innovation-review" `
            -Filter "$Id*" |
            Select-Object -First 1

        return $file.FullName

    }

    else {

        Write-Host ""
        Write-Host "Unknown document: $Id" -ForegroundColor Red
        exit

    }

}

# ------------------------------------------------------------
# Resolve Files
# ------------------------------------------------------------

$LeftFile  = Resolve-Document $Left
$RightFile = Resolve-Document $Right

if (!(Test-Path $LeftFile)) {

    Write-Host ""
    Write-Host "Cannot locate $Left" -ForegroundColor Red
    exit

}

if (!(Test-Path $RightFile)) {

    Write-Host ""
    Write-Host "Cannot locate $Right" -ForegroundColor Red
    exit

}

# ------------------------------------------------------------
# Session Banner
# ------------------------------------------------------------

Clear-Host

Write-Host ""
Write-Host "====================================================="
Write-Host " iSEES Architecture Review"
Write-Host "====================================================="
Write-Host ""
Write-Host " Left : $Left"
Write-Host " Right: $Right"
Write-Host ""
Write-Host " Checklist"
Write-Host ""
Write-Host "   [ ] Missing architectural concepts"
Write-Host "   [ ] Added architectural concepts"
Write-Host "   [ ] Terminology preserved"
Write-Host "   [ ] Ownership preserved"
Write-Host "   [ ] Invariants identified"
Write-Host "   [ ] Open questions recorded"
Write-Host ""
Write-Host "====================================================="
Write-Host ""

# ------------------------------------------------------------
# Launch VS Code
# ------------------------------------------------------------

code --reuse-window `
     --goto "$LeftFile" `
     "$RightFile"