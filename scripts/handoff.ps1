param()

# ============================================
# COGNITIVE HANDOFF GENERATOR
# V1.0 — SESSION-DRIVEN HANDOFF
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES COGNITIVE HANDOFF"
Write-Host "============================================"
Write-Host ""

# ============================================
# REPO ROOT
# ============================================

$repoRoot =
    "C:\dev\IntentionalTradingSystem"

Set-Location $repoRoot

# ============================================
# TIMESTAMP
# ============================================

$timestamp =
    Get-Date -Format "yyyy-MM-ddTHH-mm-ss"

# ============================================
# OPERATOR COGNITION CAPTURE
# ============================================

$systemMode =
    "LIVE EPISTEMIC COGNITION"

$replayPosture =
    "REPLAY-SAFE LINEAGE ACTIVE"

Write-Host ""

# ============================================
# OPERATOR CONTEXT (OPTIONAL)
# ============================================

Write-Host ""
Write-Host "Anything not captured automatically?"
Write-Host "Press ENTER to skip."
Write-Host ""

$operatorNotes =
    Read-Host "Additional Context"

$phase =
    "AUTO_INFERRED"

$objective =
    "AUTO_INFERRED"

$classification =
    "AUTO_INFERRED"

$continuityPosture =
    "AUTO_CAPTURED"

$architectureDiscovery =
    "AUTO_INFERRED"

$discoveries = @()

$dangerZones = @()

$nextTasks = @()

# ============================================
# GIT STATE
# ============================================

$gitBranch =
    git branch --show-current

$gitStatus =
    git status --short

$gitRecentCommits =
    git log --oneline -3

$recentFiles =
    Get-ChildItem `
        -Path . `
        -Recurse `
        -File `
    | Where-Object {

        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\dist\\" -and
        $_.FullName -notmatch "\\handover_states\\" -and
        $_.Name -notmatch "\.tsbuildinfo$"

    } `
    | Sort-Object LastWriteTime -Descending `
    | Select-Object -First 10 `
    | ForEach-Object {

        $_.FullName.Replace(
            (Get-Location).Path + "\",
            ""
        )
    }

# ============================================
# BUILD ARTIFACT
# ============================================

$artifact = @{

    artifact_type =
        "COGNITIVE_HANDOFF_STATE"

    artifact_version =
        "1.0"

    timestamp =
        $timestamp

    repo_root =
        $repoRoot

    system_mode =
        $systemMode

    replay_posture =
        $replayPosture

    phase = @{

        name =
            $phase

        classification =
            $classification

        primary_objective =
            $objective
    }

    git_state = @{

        active_branch =
            $gitBranch

        recent_commits =
            $gitRecentCommits

        status =
            $gitStatus
    }

    recent_modified_files =
        $recentFiles

    operator_notes =
        $operatorNotes

  continuity = @{

    posture =
        $continuityPosture

    next_objective =
        $objective

    architecture_discovery =
        $architectureDiscovery
}

    handoff = @{

        generated_by =
            $env:USERNAME

        generated_at =
            $timestamp

        purpose =
            "Transfer engineering cognition state to future session"

        workflow = @{

            session_end =
                "handoff"

            session_start =
                "resume"
        }
    }
}

# ============================================
# OUTPUT DIRECTORY
# ============================================

$outputDir =
    "C:\dev\IntentionalTradingSystem\isees_uap\epistemic\handover_states"

if (!(Test-Path $outputDir)) {

    New-Item `
        -ItemType Directory `
        -Path $outputDir `
        -Force | Out-Null
}

# ============================================
# SANITIZE PHASE NAME
# ============================================

$sanitizedPhase =
    $phase `
        -replace '[^a-zA-Z0-9_\- ]','' `
        -replace ' ','_'

# ============================================
# OUTPUT FILE
# ============================================

$fileName =
    "HANDOFF_$($timestamp)_$($sanitizedPhase).json"

$outputPath =
    Join-Path `
        $outputDir `
        $fileName

# ============================================
# WRITE JSON
# ============================================

$artifact |
    ConvertTo-Json -Depth 10 |
    Set-Content $outputPath

# ============================================
# COMPLETE
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " COGNITIVE HANDOFF GENERATED"
Write-Host "============================================"
Write-Host ""

Write-Host "Saved To:"
Write-Host $outputPath

Write-Host ""

Write-Host "Active Branch:"
Write-Host $gitBranch

Write-Host ""

Write-Host "Recent Commits:"

$gitRecentCommits |
    ForEach-Object {
        Write-Host $_
    }

Write-Host ""