# Release candidate hygiene

## Authoritative boundary

Only reviewed, committed files selected from the clean release ref are authoritative tracked source. A release path manifest or explicit allowlist must name every included path; nearby working files are not implicitly included. The release-verification tooling is `scripts/Verify-ReleaseCandidateHygiene.ps1` and its deterministic suite is `scripts/tests/Verify-ReleaseCandidateHygiene.Tests.ps1`.

Dependency resolution is authoritative only when its lockfile is committed and selected with the owning application. The required lockfiles are `isees-ui/package-lock.json` and `regime_ui/package-lock.json`; a release that includes either application must include its corresponding lockfile without regeneration drift.

For backend releases, schema history is source. Include the applicable complete migration directories: `isees_uap/authentication/migrations`, `isees_uap/candidate_evidence/migrations`, `isees_uap/epistemic/migrations`, `isees_uap/investigations/migrations`, and `isees_uap/studio/migrations`. Do not cherry-pick only the latest migration.

## Forbidden release content

Release inputs must exclude discovery reports, patches and diffs, logs, backups and dev-backups, archives, runtime databases, generated/build/coverage/runtime outputs, native-draft outputs, and every MarketMind path. The verifier rejects these categories when staged or supplied through `-ReleasePath`. Diagnostic-mode untracked files are reported, not silently treated as release inputs.

## Verification policy

Build and final verification must run in a fresh clone or a separately created, isolated release worktree at the intended ref. Pass its exact root, expected branch, remote-tracking branch, clean-workspace requirement, and release path manifest entries to the verifier. Example:

```powershell
pwsh -NoProfile -File scripts/Verify-ReleaseCandidateHygiene.ps1 `
  -RepositoryRoot C:\release\IntentionalTradingSystem `
  -ExpectedBranch hf-deploy `
  -RemoteTrackingBranch origin/hf-deploy `
  -RequireCleanReleaseWorkspace `
  -ReleasePath @('isees-ui/src/App.tsx', 'isees-ui/package-lock.json')
```

The verifier is read-only: it disables optional Git index locking, compares branch/ref and content state, inventories untracked paths, validates release paths, and emits one compact JSON record. A passing diagnostic run may contain ordinary untracked files; a release run using `-RequireCleanReleaseWorkspace` may not.

Preserve the current development workspace exactly as working context. Never use checkout, reset, clean, restore, stash, bulk deletion, ignore-rule changes, or other destructive cleanup to manufacture a clean result. Release cleanliness must come from the clean clone or isolated worktree, not from erasing or hiding development artifacts.
