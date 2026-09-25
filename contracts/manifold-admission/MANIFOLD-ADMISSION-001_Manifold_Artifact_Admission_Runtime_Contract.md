# MANIFOLD-ADMISSION-001 — Manifold Artifact Admission Runtime Contract

**Status:** Authoritative
**Subordinate authority:** authenticated investigation ownership; Phase D1 operational revisions; Studio immutable projections; SC-003, SC-010, SC-019, SC-020, SC-029, SC-030; P57-UI-A23-STUDIO-V1-CANON.

This contract defines only the subtype adapter from a verified Studio `MANIFOLD_ARTIFACT` projection to the existing investigation event-space. It creates no repository, graph store, revision service, database, or browser commit authority.

## Authority and effects

Projection creation has `CanonEffect.NONE` and `ManifoldEffect.NONE`. Inspection and relationship selection have no graph effect. Admission requires an explicit CSRF-protected action by the authenticated owning researcher. The backend loads exactly one stored projection through Studio authority, verifies its stored bytes and hash, strict manifest, source `.author` revision identity/number/content hash, investigation, and principal, then admits exactly one `ARTIFACT` node with subtype `MANIFOLD_ARTIFACT`.

No relationship is selected by default. Only explicitly selected `PROPOSED_RELATIONSHIP` declaration identities may materialize as edges. Unselected proposals and every research vector remain qualified machine-readable metadata. Assertions, unknowns, contradictions, constraints, and exclusions retain their declared qualification and are not established facts. Admission does not parse prose, infer, calculate confidence, promote Canon, execute REX, call Tavily/Web Discovery, create Candidate Evidence, publish Research Inbox entries, expand research vectors, or bill.

## Verification and commit

The sole schema-v1 reference for the node created by admission is `{ "kind": "ARTIFACT", "identity": "$ADMITTED_ARTIFACT" }`. No alias is supported. The reserved identity paired with another kind, an `ARTIFACT` kind paired with another identity, or any unresolved endpoint fails closed.

Browser input is limited to projection identity, expected operational head, explicitly selected relationship declaration identities, and client idempotency key. Browser manifests, bytes, hashes, source identities, nodes, edges, and declarations are never trusted.

The adapter derives the artifact node from immutable projection identity and verified output hash, validates selected declarations and eligible endpoints against the current operational graph or new artifact node, and rejects dangling, self-invalid, duplicate, conflicting, unsupported, and unselected relationships. One successful command appends exactly one immutable child operational revision through Phase D1 and atomically advances the head, aggregate projection, investigation version, immutable receipt, idempotency result, and active-investigation continuity.

Same-key/same-command replay returns the original receipt. Same-key/different-command fails. A projection cannot be admitted twice under another key. A stale expected head or any validation/persistence failure has zero effect. The receipt, resulting revision, current head, and returned activation are authoritative; browser state never commits.

## Successful receipt effects

- Canon: `NONE`
- Manifold: `REVISION_APPENDED`
- REX: `NONE`
- Tavily: `NONE`
- Candidate Evidence: `NONE`
- Research Inbox: `NONE`
- billing: `NONE`

Guests receive the established authenticated-action response and no temporary admission is created.
