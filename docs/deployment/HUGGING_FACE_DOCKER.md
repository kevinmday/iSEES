# Hugging Face Docker candidate contract

This source tree prepares a fresh, permanent-name candidate Space. It does not name or modify a remote Space, and it must never be used to push to `kevinmday/iSEES-Operator` or `kevinmday/iSEES-UAP`.

The root metadata selects the Docker SDK and public port 7860. The image builds the locked React application in a Node stage, then copies only its compiled `dist` plus the `isees_uap` Python package into a Python 3.12 runtime. Startup is one Uvicorn worker at `isees_uap.api:app`, bound to `0.0.0.0` and `${PORT:-7860}`.

In production, FastAPI owns both browser and API traffic. Existing API/core routes are registered before the frontend adapter. Exact `GET /report` is therefore a React route, while `POST /report` and `GET /report/{event_id}` remain backend routes. `/api`, `/run`, `/clusters`, and backend-owned report descendants cannot fall through to React. Missing files and traversal requests return 404. If `/app/frontend/index.html` is absent, the adapter is not registered and local API-only development retains the existing root live response.

Candidate Evidence uses relative same-origin URLs by default and includes cookies. `VITE_CANDIDATE_EVIDENCE_API_BASE_URL` remains an explicit build-time override; cross-origin use also requires an intentional CORS and cookie deployment configuration. Mutating calls continue to supply the existing `X-ISEES-CSRF` header contract.

MarketMind directories, local databases, outputs, secrets, environment files, backups, patches, discoveries, caches, and Git data are excluded. Dockerfile `COPY` boundaries are explicit. Review the effective build context and run `scripts/Verify-HfDockerContract.ps1` before release.

I2 remains responsible for attaching and verifying persistent storage, selecting `/data/isees` database/output paths, migration and recovery, and dependency-aware readiness. Current Hugging Face documentation describes attached storage buckets as runtime volumes mounted at a selected path; no storage mutation is performed here. The Python base and direct dependencies are pinned, but transitive Python dependencies are not hash-locked; completing a hash-locked dependency graph is a documented reproducibility gap.

No health check is added in I1 because dependency-aware readiness is explicitly deferred to I2. Hugging Face startup health is governed by the platform startup timeout and successful reachability of the configured application port.
