param()

# ============================================
# ENGINEERING COGNITION SNAPSHOT GENERATOR
# V0.5 — CONTEXT-AWARE AUTO-HYDRATION
# ============================================

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES EPISTEMIC CONTINUITY CHECKPOINT"
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
# AUTO-HYDRATED CORE FIELDS
# ============================================

$phase =
    "P18 EVENT LINEAGE STABILIZATION"

$classification =
    "FOUNDATIONAL EPISTEMIC ARCHITECTURE STABILIZATION"

$continuityPosture =
    "DETERMINISTIC AUTHORITY PRESERVATION"

$systemMode =
    "LIVE EPISTEMIC COGNITION"

$replayPosture =
    "REPLAY-SAFE LINEAGE ACTIVE"

# ============================================
# CONTEXT-AWARE SESSION AUTO-DRAFTS
# ============================================

$objective =
    "Inspect event_inference.py for replay authority boundaries and canonical event lineage propagation"

$discoveries = @(
    "EventContext identified as cognition authority spine",
    "InvestigationWorkspace identified as surface projection layer",
    "RightPanel contains render-time cognition mutation leak",
    "objectRegistry stabilized as canonical ontology substrate",
    "buildContextualIntel identified as deterministic cognition synthesis layer",
    "pattern_memory identified as persistent longitudinal epistemic memory",
    "replay lineage now mandatory architecture concern"
)

$dangerZones = @(
    "render-time state mutation",
    "replay divergence from pattern_memory",
    "derived cognition blended into substrate authority",
    "implicit shared cognition propagation"
)

$nextTasks = @(
    "inspect event_inference.py",
    "map canonical event boundaries",
    "trace replay lineage propagation",
    "identify topology mutation paths",
    "inspect escalation authority flow"
)

# ============================================
# GIT STATE
# ============================================

$gitBranch =
    git branch --show-current

$gitStatus =
    git status --short

$gitRecentCommits =
    git log --oneline -3

# ============================================
# DISPLAY AUTO-HYDRATED STATE
# ============================================

Write-Host "Phase:"
Write-Host $phase

Write-Host ""

Write-Host "Classification:"
Write-Host $classification

Write-Host ""

Write-Host "Primary Objective:"
Write-Host $objective

Write-Host ""

Write-Host "Continuity Posture:"
Write-Host $continuityPosture

Write-Host ""

Write-Host "Stabilized Discoveries:"
$discoveries | ForEach-Object {
    Write-Host " - $_"
}

Write-Host ""

Write-Host "Danger Zones:"
$dangerZones | ForEach-Object {
    Write-Host " - $_"
}

Write-Host ""

Write-Host "Next Tasks:"
$nextTasks | ForEach-Object {
    Write-Host " - $_"
}

Write-Host ""

# ============================================
# OPTIONAL MANUAL OVERRIDE
# ============================================

$override =
    Read-Host "Press ENTER to accept or type OVERRIDE"

if ($override -eq "OVERRIDE") {

    Write-Host ""

    $objective =
        Read-Host "Primary Objective"

    Write-Host ""
    Write-Host "Enter discoveries separated by commas."

    $discoveriesInput =
        Read-Host "Discoveries"

    Write-Host ""
    Write-Host "Enter danger zones separated by commas."

    $dangerInput =
        Read-Host "Danger Zones"

    Write-Host ""
    Write-Host "Enter next tasks separated by commas."

    $tasksInput =
        Read-Host "Next Tasks"

    $discoveries =
        $discoveriesInput -split "," |
        ForEach-Object {
            $_.Trim()
        }

    $dangerZones =
        $dangerInput -split "," |
        ForEach-Object {
            $_.Trim()
        }

    $nextTasks =
        $tasksInput -split "," |
        ForEach-Object {
            $_.Trim()
        }
}

# ============================================
# RECENTLY MODIFIED FILES
# ============================================

$recentFiles =
    Get-ChildItem `
        -Path . `
        -Recurse `
        -File `
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
        "ENGINEERING_COGNITION_STATE"

    artifact_version =
        "0.5"

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

    stabilized_discoveries =
        $discoveries

    danger_zones =
        $dangerZones

    next_tasks =
        $nextTasks

    recent_modified_files =
        $recentFiles

    continuity = @{

        posture =
            $continuityPosture
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
    "ECS_$($timestamp)_$($sanitizedPhase).json"

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
Write-Host " EPISTEMIC SNAPSHOT GENERATED"
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