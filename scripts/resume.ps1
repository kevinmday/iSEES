# ============================================
# iSEES CONTINUITY REHYDRATION
# ============================================

$path =
"C:\dev\IntentionalTradingSystem\isees_uap\epistemic\handover_states"

$latest =
Get-ChildItem `
    $path `
    -Filter "HANDOFF_*.json" |
Sort-Object LastWriteTime -Descending |
Select-Object -First 1

if (-not $latest) {

    Write-Host ""
    Write-Host "============================================"
    Write-Host " NO HANDOFF FOUND"
    Write-Host "============================================"
    Write-Host ""

    exit
}

$state =
    Get-Content `
        $latest.FullName `
        -Raw |
    ConvertFrom-Json

# ============================================
# LIVE GIT STATE
# ============================================

$branch = "(unknown)"
$commit = "(unknown)"
$workingTreeClean = $false
$remoteStatus = "(unknown)"

try {

    Push-Location "C:\dev\IntentionalTradingSystem"

    $branch =
        (git branch --show-current 2>$null).Trim()

    if ([string]::IsNullOrWhiteSpace($branch)) {

        $branch = "(detached HEAD)"
    }

    $commit =
        (git rev-parse --short HEAD 2>$null).Trim()

    $status =
        (git status --porcelain 2>$null)

    $workingTreeClean =
        [string]::IsNullOrWhiteSpace($status)

    try {

        git fetch origin *> $null

        $local =
            (git rev-parse HEAD 2>$null).Trim()

        $upstream =
            (git rev-parse "@{u}" 2>$null).Trim()

        if ($local -eq $upstream) {

            $remoteStatus = "SYNCED"
        }
        else {

            $ahead =
                git rev-list --count "@{u}..HEAD" 2>$null

            $behind =
                git rev-list --count "HEAD..@{u}" 2>$null

            if ($ahead -gt 0 -and $behind -eq 0) {

                $remoteStatus = "AHEAD ($ahead commit(s))"
            }
            elseif ($behind -gt 0 -and $ahead -eq 0) {

                $remoteStatus = "BEHIND ($behind commit(s))"
            }
            else {

                $remoteStatus =
                    "DIVERGED (ahead=$ahead behind=$behind)"
            }
        }
    }
    catch {

        $remoteStatus = "NO UPSTREAM"
    }

    Pop-Location
}
catch {

    $branch = "(unknown)"
    $commit = "(unknown)"
    $workingTreeClean = $false
    $remoteStatus = "(unknown)"
}

Write-Host ""
Write-Host "============================================"
Write-Host " iSEES CONTINUITY REHYDRATION"
Write-Host "============================================"
Write-Host ""

Write-Host "Latest Handoff:"
Write-Host $latest.Name

Write-Host ""

Write-Host "Timestamp:"
Write-Host $state.timestamp

Write-Host ""

Write-Host "============================================"
Write-Host " LIVE GIT STATE"
Write-Host "============================================"
Write-Host ""

Write-Host "Branch:"
Write-Host $branch

Write-Host ""

Write-Host "Commit:"
Write-Host $commit

Write-Host ""

Write-Host "Working Tree:"

if ($workingTreeClean) {

    Write-Host "CLEAN" -ForegroundColor Green
}
else {

    Write-Host "UNCOMMITTED CHANGES PRESENT" `
        -ForegroundColor Yellow
}

Write-Host ""

Write-Host "Remote Status:"
Write-Host $remoteStatus

Write-Host ""

Write-Host "============================================"
Write-Host " CHECKPOINT GIT STATE"
Write-Host "============================================"
Write-Host ""

Write-Host "Branch:"
Write-Host $state.git_state.active_branch

Write-Host ""

Write-Host "Recent Commits:"

$state.git_state.recent_commits |
ForEach-Object {

    Write-Host " - $_"
}

Write-Host ""

Write-Host "Recent Modified Files:"

$state.recent_modified_files |
ForEach-Object {

    Write-Host " - $_"
}

Write-Host ""

if ($state.operator_notes) {

    Write-Host "Operator Notes:"
    Write-Host $state.operator_notes

    Write-Host ""
}

# ============================================
# SESSION BRIEFING GENERATION
# ============================================

$briefing = @"
Branch:
$branch

Last Commit:
$commit

Recent Commits:
$(
    ($state.git_state.recent_commits |
        ForEach-Object { $_ }) -join "`r`n"
)

Recent Files:
$(
    ($state.recent_modified_files |
        ForEach-Object { $_ }) -join "`r`n"
)

Operator Notes:
$($state.operator_notes)

Current Focus:
$(
    if ($state.git_state.recent_commits.Count -gt 0) {
        $state.git_state.recent_commits[0]
    }
)

Suggested Next Action:
Continue from latest commit and modified files.
"@

$briefingPath =
"C:\dev\IntentionalTradingSystem\SESSION_BRIEFING.txt"

$briefing |
    Set-Content `
        $briefingPath

$briefing |
    Set-Clipboard

Write-Host ""
Write-Host "============================================"
Write-Host " SESSION BRIEFING GENERATED"
Write-Host "============================================"
Write-Host ""

Write-Host "Saved To:"
Write-Host $briefingPath

Write-Host ""

Write-Host "Copied To Clipboard"
Write-Host ""

Write-Host "Paste directly into a new ChatGPT session."
Write-Host ""