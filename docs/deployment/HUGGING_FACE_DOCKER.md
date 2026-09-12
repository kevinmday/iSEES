# Hugging Face Docker candidate contract

This source tree prepares a fresh, permanent-name candidate Space. It does not name or modify a remote Space, and it must never be used to push to `kevinmday/iSEES-Operator` or `kevinmday/iSEES-UAP`.

The root metadata selects the Docker SDK and public port 7860. The image builds the locked React application in a Node stage, then copies only its compiled `dist` plus the `isees_uap` Python package into a Python 3.12 runtime. Startup is one Uvicorn worker at `isees_uap.api:app`, bound to `0.0.0.0` and `${PORT:-7860}`.

In production, FastAPI owns both browser and API traffic. Existing API/core routes are registered before the frontend adapter. Exact `GET /report` is therefore a React route, while `POST /report` and `GET /report/{event_id}` remain backend routes. `/api`, `/run`, `/clusters`, and backend-owned report descendants cannot fall through to React. Missing files and traversal requests return 404. If `/app/frontend/index.html` is absent, the adapter is not registered and local API-only development retains the existing root live response.

Production startup requires `ISEES_AUTH_ENV=production` and a comma-separated `ISEES_TRUSTED_HOSTS` containing exact DNS hostnames, including `kevinmday-isees-cloud.hf.space` for the current Space. Empty or malformed values, duplicates, wildcards, localhost, loopback, and `testserver` fail closed. Development and test default only to `testserver`, `localhost`, and `127.0.0.1`. The host list is not returned by health or readiness diagnostics.

Candidate Evidence uses relative same-origin URLs by default and includes cookies. `VITE_CANDIDATE_EVIDENCE_API_BASE_URL` remains an explicit build-time override; cross-origin use also requires an intentional CORS and cookie deployment configuration. Mutating calls continue to supply the existing `X-ISEES-CSRF` header contract.

PublicIntake uses the shared API-origin authority and submits to same-origin `/report` in production. Local development continues through the Vite proxy. `VITE_API_BASE_URL` is the only shared explicit build-time override; production builds should leave it empty unless a separately approved cross-origin deployment is intentional.

Login throttling is durable SQLite state keyed by normalized email. Defaults are five failures in a 15-minute observation window followed by a 15-minute temporary lockout. `ISEES_LOGIN_MAX_FAILURES` is bounded to 3–20, `ISEES_LOGIN_WINDOW_SECONDS` to 60–3600, and `ISEES_LOGIN_LOCKOUT_SECONDS` to 60–86400. A successful login clears the identity's throttle row; expired windows and lockouts recover deterministically. Login failures for missing, disabled, ineligible, locked, and wrong-password identities all retain the same `INVALID_CREDENTIALS` response. Repository failure instead fails closed as `AUTHENTICATION_UNAVAILABLE`.

Account control is local/operator-only and creates no HTTP route. Supply either an absolute database path or an absolute persistent root. Mutation confirmation must repeat the normalized email and action exactly. Examples use placeholders only:

```powershell
./scripts/Manage-IseesPilotAccount.ps1 -Action lookup -Email operator@example.invalid -PersistentRoot /absolute/persistent/root
./scripts/Manage-IseesPilotAccount.ps1 -Action disable -Email operator@example.invalid -PersistentRoot /absolute/persistent/root -ConfirmEmail operator@example.invalid -ConfirmAction disable
./scripts/Manage-IseesPilotAccount.ps1 -Action enable -Email operator@example.invalid -PersistentRoot /absolute/persistent/root -ConfirmEmail operator@example.invalid -ConfirmAction enable
./scripts/Manage-IseesPilotAccount.ps1 -Action revoke -Email operator@example.invalid -PersistentRoot /absolute/persistent/root -ConfirmEmail operator@example.invalid -ConfirmAction revoke
```

Disabling also revokes all active sessions. Output is limited to account ID, normalized email, final status, and mutation session count; it never displays passwords or session secrets. Stop if the path is missing/relative, identity is absent, confirmation differs, the repository is unavailable, or the output contains unexpected sensitive data.

MarketMind directories, local databases, outputs, secrets, environment files, backups, patches, discoveries, caches, and Git data are excluded. Dockerfile `COPY` boundaries are explicit. Review the effective build context and run `scripts/Verify-HfDockerContract.ps1` before release.

Run the candidate-access Docker verifier with explicit immutable source authority; it also requires `HEAD` to equal `origin/hf-deploy`:

```powershell
./scripts/Verify-CandidateAccessDocker.ps1 -ExpectedHead <full-40-character-commit-sha>
```

I2 remains responsible for attaching and verifying persistent storage, selecting `/data/isees` database/output paths, migration and recovery, and dependency-aware readiness. Current Hugging Face documentation describes attached storage buckets as runtime volumes mounted at a selected path; no storage mutation is performed here. The Python base and direct dependencies are pinned, but transitive Python dependencies are not hash-locked; completing a hash-locked dependency graph is a documented reproducibility gap.

No health check is added in I1 because dependency-aware readiness is explicitly deferred to I2. Hugging Face startup health is governed by the platform startup timeout and successful reachability of the configured application port.
