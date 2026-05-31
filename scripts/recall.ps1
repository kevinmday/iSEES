param()

# ============================================

# COGNITIVE CONTINUITY RECALL

# ============================================

$path =
"C:\dev\IntentionalTradingSystem\isees_uap\epistemic\cognition_states"

$latest =
Get-ChildItem `    $path`
-Filter "BRAINSTORM_*.json" |
Sort-Object LastWriteTime -Descending |
Select-Object -First 1

if (-not $latest) {

```
Write-Host ""
Write-Host "============================================"
Write-Host " NO COGNITION ARTIFACT FOUND"
Write-Host "============================================"
Write-Host ""

exit
```

}

$artifact =
Get-Content `        $latest.FullName`
-Raw |
ConvertFrom-Json

Write-Host ""
Write-Host "============================================"
Write-Host " COGNITIVE CONTINUITY RECALL"
Write-Host "============================================"
Write-Host ""

Write-Host "Latest Artifact:"
Write-Host $latest.Name

Write-Host ""

if ($artifact.timestamp) {

```
Write-Host "Timestamp:"
Write-Host $artifact.timestamp

Write-Host ""
```

}

if ($artifact.title) {

```
Write-Host "Title:"
Write-Host $artifact.title

Write-Host ""
```

}

if ($artifact.primary_insight) {

```
Write-Host "Primary Insight:"
Write-Host $artifact.primary_insight

Write-Host ""
```

}

if ($artifact.summary) {

```
Write-Host "Summary:"
Write-Host $artifact.summary

Write-Host ""
```

}

if ($artifact.key_discoveries) {

```
Write-Host "Key Discoveries:"
Write-Host "----------------"

$artifact.key_discoveries |
    ForEach-Object {

        Write-Host "• $_"
    }

Write-Host ""
```

}

if ($artifact.architectural_implications) {

```
Write-Host "Architectural Implications:"
Write-Host "---------------------------"

$artifact.architectural_implications |
    ForEach-Object {

        Write-Host "• $_"
    }

Write-Host ""
```

}

if ($artifact.research_vectors) {

```
Write-Host "Research Vectors:"
Write-Host "-----------------"

$artifact.research_vectors |
    ForEach-Object {

        Write-Host "• $_"
    }

Write-Host ""
```

}

if ($artifact.open_questions) {

```
Write-Host "Open Questions:"
Write-Host "---------------"

$artifact.open_questions |
    ForEach-Object {

        Write-Host "• $_"
    }

Write-Host ""
```

}

if ($artifact.future_scaffolding_candidates) {

```
Write-Host "Future Scaffolding Candidates:"
Write-Host "------------------------------"

$artifact.future_scaffolding_candidates |
    ForEach-Object {

        Write-Host "• $_"
    }

Write-Host ""
```

}

Write-Host ""
Write-Host "============================================"
Write-Host " COGNITION RESTORED"
Write-Host "============================================"
Write-Host ""

Write-Host "Opening Artifact:"
Write-Host $latest.Name

Write-Host ""

notepad $latest.FullName
