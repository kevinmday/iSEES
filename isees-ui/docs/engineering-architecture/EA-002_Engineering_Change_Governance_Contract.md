# EA-002 — Engineering Change Governance Contract

**Status:** Canonical

**Version:** 1.0

**Knowledge Type:** Engineering Architecture

**Architectural Owner:** System Engineering Governance

**Scope:** System

**Depends on:** [Knowledge Architecture](../knowledge-architecture/Knowledge_Architecture.md); [Knowledge Document Classification Standard](../knowledge-architecture/Knowledge_Document_Classification_Standard.md); [Knowledge Governance](../knowledge-architecture/Knowledge_Governance.md); [AA-004 Runtime Ownership Matrix](../architecture-audit/AA-004_Runtime_Ownership_Matrix.md); [AA-008 Canon Dependency Matrix](../architecture-audit/AA-008_Canon_Dependency_Matrix.md)

## 1. Purpose

This contract governs how engineering packages discover, classify, authorize, mutate, verify, and deliver changes to iSEES. It makes existing-code-first discovery, singular ownership, minimal mutation, evidence, and explicit repository authority operational requirements.

## 2. Scope

This contract applies to engineering packages that may add or change files, types, components, state owners, execution paths, persistence models, user-interface surfaces, routes, contracts, or subsystems. It governs engineering procedure; it does not replace computational, cognitive, runtime, domain, security, release, or knowledge Canon.

## 3. Relationship to existing knowledge governance

Knowledge Architecture defines primary homes and singular responsibility. The Knowledge Document Classification Standard defines identity, owner, lifecycle, dependencies, and implementation traceability. Knowledge Governance controls progression from observation through Canon and maintenance. AA-004 records runtime and capability ownership; AA-008 records architectural dependencies.

EA-002 adds the mutation workflow and evidence gates. It MUST reference, not duplicate or silently supersede, those authorities. A discovery report, proposal, implementation, test, generated artifact, or untracked file does not become authority by existence or naming.

## 4. Existing-code-first rule

iSEES is a mature, actively developed system. No capability described by an engineering package may be presumed absent. Before adding a file, type, component, state owner, execution path, persistence model, UI surface, route, or subsystem, read-only discovery must locate and trace all potentially equivalent existing implementations. Existing authoritative code shall be extended in place. Parallel implementations are prohibited unless repository evidence demonstrates distinct ownership and Kevin explicitly authorizes the new boundary.

Search by responsibility, behavior, data shape, persisted identity, route, consumer, test, and historical terminology—not only by the proposed name. Age, imperfect structure, incomplete documentation, or inconvenient location does not by itself make an existing owner obsolete.

## 5. No-capability-presumed-absent rule

An engineering package MUST state what repositories, source trees, contracts, tests, documentation, history, and runtime paths were inspected. “Not found” is valid only after a recorded search broad enough to find renamed, indirect, disconnected, partial, or legacy equivalents. Untracked and generated material may inform discovery but MUST NOT be promoted as authority without the applicable governance decision.

## 6. Read-only discovery gate

Before mutation, discovery MUST be read-only and have zero repository, runtime, dependency, service, account, remote, or external-system effects. It MUST establish:

- worktree, branch, and local revision baseline;
- applicable repository instructions and authorized scope;
- current Canon, contracts, owners, implementations, consumers, persistence, projections, and verification;
- potentially equivalent, partial, legacy, disconnected, and proposed implementations;
- conflicts, dirty-worktree state, uncertainties, and decisions requiring authorization.

Discovery MUST NOT install packages, start services, invoke mutations, alter files, stage changes, contact remotes, or treat a proposal as ratified authority unless separately authorized.

## 7. Authoritative-owner gate

Before design or mutation, the package MUST identify one authoritative owner for each state, computation, persistence path, projection, contract, and lifecycle it affects. Evidence MUST trace from governing Canon and engineering contract to runtime or type owner, persistence owner, consumers, and verification.

If evidence does not establish one owner, the package MUST use `REQUIRES_OWNER_CONFIRMATION`, stop any ownership-creating mutation, and escalate. Shared or parallel ownership MUST NOT be invented to resolve ambiguity.

## 8. Exact mutation-scope gate

The package MUST list the exact authorized files and permitted changes before mutation. Everything else is prohibited. Mutation MUST be the smallest coherent change that closes the proven gap and MUST preserve nonconflicting behavior, history, terminology, identifiers, and user work.

Authorization for documentation does not authorize code; authorization for code does not authorize schema, routes, packages, deployment, external effects, commit, or push. A newly discovered need outside scope requires escalation and additional authorization.

## 9. Verification and final-diff gate

Verification MUST be proportional to the mutation and MUST include:

1. targeted contract, type, test, or documentation checks;
2. regression checks for affected owners and consumers;
3. repository status and staged-state inspection;
4. complete diff review for every changed file;
5. changed-file comparison against the authorized scope and recorded baseline;
6. confirmation that manifests, lockfiles, generated files, code, data, and external state were not changed unless explicitly authorized; and
7. resolution of new references and confirmation that identifiers and authorities are not duplicated.

A passing test does not excuse an unauthorized file. An authorized file does not excuse an unreviewed diff. Verification failures and unverified requirements MUST be reported, not concealed.

## 10. Capability classifications

Every proposed capability MUST receive exactly one discovery classification:

- `EXISTING_AND_OPERATIONAL`: an authoritative implementation and active consumer are evidenced.
- `EXISTING_BUT_INCOMPLETE`: the authoritative owner exists but a precise requirement is missing.
- `REUSABLE_FOUNDATION`: an existing owner or primitive can contain the responsibility without creating parallel authority.
- `DISCONNECTED_OR_OBSOLETE`: evidence shows the implementation is not an active authority; disposition still requires approval.
- `GENUINELY_MISSING`: exhaustive recorded discovery found no equivalent or suitable owner.
- `REQUIRES_RUNTIME_CONFIRMATION`: static evidence cannot establish operational ownership or behavior.

Classification MUST include evidence and uncertainty. Only `GENUINELY_MISSING`, or a proven distinct lifecycle that existing owners cannot contain, may support a new authoritative boundary, and still requires authorization.

## 11. New-file justification

Every proposed new file MUST record:

- **Responsibility:** its single bounded responsibility.
- **Existing equivalents inspected:** files and owners evaluated.
- **Why authoritative owners cannot contain the responsibility:** evidence, not preference.
- **Why the file does not create parallel authority:** ownership and dependency explanation.
- **Immediate consumer:** the existing or concurrently authorized consumer.
- **Verification:** how identity, integration, and nonduplication are proven.
- **Authorization:** the explicit authority permitting creation.

A file without an immediate governed responsibility and consumer SHOULD remain a proposal rather than production architecture.

## 12. New-subsystem justification

A new subsystem requires evidence of an independent state and lifecycle, a distinct authority boundary, contracts with existing owners, persistence and projection ownership, operational and failure behavior, migration or coexistence rules, verification, and Kevin's explicit authorization. Scale, naming convenience, anticipated future use, or an incomplete existing implementation is insufficient.

## 13. Duplication declaration

Every engineering package and final handoff MUST declare `YES` or `NO` for:

| Declaration | Required answer |
|---|---|
| New subsystem created | `YES` / `NO` |
| New state owner created | `YES` / `NO` |
| Parallel contract created | `YES` / `NO` |
| Parallel persistence path created | `YES` / `NO` |
| Existing authoritative implementation extended | `YES` / `NO` |

Every `YES` answer requires explicit justification. `YES` for a new subsystem, new state owner, parallel contract, or parallel persistence path additionally requires Kevin authorization. An omitted declaration is noncompliant.

## 14. Dirty-worktree preservation

Pre-existing tracked, untracked, staged, ignored, generated, temporary, or backup material belongs to its existing owner. The package MUST record the baseline, avoid formatting or cleanup outside scope, and distinguish pre-existing state from increment changes. It MUST NOT reset, revert, delete, move, overwrite, stage, stash, or incorporate unrelated work without explicit authorization.

## 15. Documentation-authority rules

Documents MUST retain one primary architectural home, identifier, owner, status, dependencies, and lifecycle. Canon belongs in its established Canon; runtime contracts belong in their established registry; living ownership belongs in the established ownership audit. Proposals and discoveries are evidence only until ratified through the applicable authority.

Existing documents MUST be extended in place when they already own the responsibility. Conflicting doctrine MUST be reconciled explicitly; it MUST NOT be copied into a second authority. Persistence, implementation, naming, or local existence does not create Canon status.

## 16. Zero-effects requirements

Read-only discovery has zero mutation effects. Documentation-only work has zero application, backend, database, package, lockfile, route, deployment, test-program, runtime, account, remote, and external-system effects. Code work MUST enumerate and verify every authorized effect and confirm zero effects outside that set.

Commands used for inspection SHOULD be deterministic, local, and non-mutating. Network access, service startup, package installation, database migration, external messaging, and deployment each require separate authority when not already intrinsic to the explicitly approved task.

## 17. Commit and push authority

Mutation authority does not include Git staging, commit, branch switching, history rewriting, remote fetch, or push. Commit requires explicit commit authorization from Kevin after the final diff and verification results are available. Push requires a separate explicit push authorization from Kevin after the commit identity and destination are known. Commit authorization does not imply push authorization.

## 18. Exception and escalation process

Stop and escalate when scope is insufficient, ownership is ambiguous, evidence conflicts, a destructive action is required, a verification invariant fails, an external effect is necessary, or a new boundary appears justified. The escalation MUST state the evidence, blocker, affected authority, safe alternatives, requested decision, and consequences of each choice. No exception may be inferred from urgency.

An approved exception MUST name its scope, authority, duration or increment, affected invariants, required mitigation, and verification. It does not weaken this contract outside the named exception.

## 19. Required engineering-package language

Every change-authorizing engineering package MUST include language equivalent to:

```text
CONCEPT
-> READ-ONLY DISCOVERY
-> AUTHORITATIVE OWNER IDENTIFICATION
-> EXISTING CAPABILITY CLASSIFICATION
-> PRECISE GAP ANALYSIS
-> APPROVED MINIMAL MUTATION
-> REGRESSION VERIFICATION
-> FINAL DIFF REVIEW
-> EXPLICIT COMMIT AUTHORIZATION
-> EXPLICIT PUSH AUTHORIZATION
```

It MUST also include exact authorized and prohibited scope, the capability classification and evidence, new-file and new-subsystem justifications when applicable, the duplication declaration, dirty-worktree baseline, expected effects, verification plan, unresolved decisions, and commit/push authority.

## 20. Definition of compliance

An engineering change complies only when read-only discovery preceded mutation; equivalent implementations were traced; authoritative owners were identified or uncertainty was escalated; every capability was classified; the gap and scope were precise; the smallest authorized owner was extended; new files and boundaries were justified and authorized; unrelated work was preserved; verification passed or exceptions were disclosed; the complete final diff matched scope; the duplication declaration was complete; effects remained within authorization; and no stage, commit, or push occurred without its explicit authority.

Compliance is an evidence-backed property of the whole change process. Documentation, tests, implementation, or approval alone cannot establish it.
