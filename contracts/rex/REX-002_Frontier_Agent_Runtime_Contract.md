# REX-002 — Frontier Agent Runtime Contract

**Status:** Authoritative Contract

**Version:** 1.0

**Implements:** [SC-026 REX Frontier Agents](../../isees-ui/docs/computational-canon/SC-026_REX_Frontier_Agents.md)

**Depends on:** [REX-001 Recursive Epistemic Exploration Runtime Contract](REX-001_Recursive_Epistemic_Exploration_Runtime_Contract.md)

## 1. Assignment contract

A Frontier Agent runtime record represents a persistent bounded assignment, not a resident process. It MUST contain:

- stable agent and assignment identities and immutable assignment revision;
- owning user, organization, or governing authority;
- assignment kind: node, edge, cluster, investigation, or research vector;
- target identity, objective, scope, and exclusions;
- lifecycle state and attributable transition history;
- trigger, schedule, freshness, duplicate, source, privacy, and risk policies;
- entitlement and authorization references;
- per-execution and period budgets;
- source cursors and last successful exploration state; and
- creation, suspension, expiration, revocation, and resumption metadata.

Assignment state MUST support `SLEEPING`, `ELIGIBLE`, `EXECUTING`, `SUSPENDED`, `EXPIRED`, `REVOKED`, and `BUDGET_EXHAUSTED`. Only governed transitions may change state. A persistent record MUST consume no AI or source budget while sleeping.

## 2. Trigger and authorization contract

Supported triggers are manifold creation or revision, completed Resolve, source cursor or feed change, freshness expiration, discovery of a connecting node or edge, researcher request, scheduled bounded refresh, and changed System Canon or Candidate Knowledge context.

A trigger MUST create an eligibility event with identity, time, cause, target assignment, observed cursor or context revision, and coalescing key. It MUST NOT directly dispatch AI or source work.

Before dispatch, the runtime MUST:

1. coalesce equivalent pending triggers;
2. bind immutable assignment and manifold revisions;
3. confirm lifecycle, entitlement, and authorization;
4. apply source, freshness, risk, privacy, and duplicate policies;
5. evaluate the SC-026 utility gate;
6. reserve budget under every applicable limit; and
7. create the immutable Search Execution Record identity.

## 3. Budget hierarchy and circuit breakers

Budget enforcement MUST cover per-execution limits and aggregate per-user, per-investigation, per-agent, per-source, and global limits. The same scopes MUST expose circuit breakers for spend, rate, repeated failure, abuse, provider degradation, and policy revocation.

Budget reservation MUST be atomic with dispatch eligibility. Final charging and release MUST reconcile against actual cost through the REX-001 cost ledger. Budget exhaustion transitions the assignment to `BUDGET_EXHAUSTED` or leaves it sleeping under policy; it MUST NOT delete state or permit uncharged continuation.

## 4. Execution and result contract

The agent runtime MUST dispatch bounded work through a durable queue to bounded workers. Workers MUST honor time, token, request, byte, source-fee, and cost ceilings and SHOULD scale to zero when idle where supported. Uncontrolled perpetual polling loops are prohibited.

Each execution MUST comply with REX-001 and produce one immutable Search Execution Record. It MAY discover candidate nodes and edges or propose updates to existing candidate intelligence. Every result MUST remain Candidate Knowledge with explicit provenance and AI-assistance annotations until human-governed admission. Contact information MUST remain subject to privacy and use policy, and its discovery MUST NOT authorize contact.

Source adapters MUST convert heterogeneous material to the canonical candidate schema. Adapters MUST NOT promote, strengthen, or silently merge claims.

## 5. Entitlement tiers

The runtime MUST express policy-compatible capabilities without embedding commercial prices:

- `GUEST`: no persistent Frontier execution;
- `FREE_RESEARCHER`: none or a bounded introductory allowance;
- `EXPLORER`: limited assignments and executions;
- `RESEARCHER`: recurring event-driven or scheduled exploration;
- `PROFESSIONAL`: deeper and more frequent exploration; and
- `INSTITUTIONAL`: organization budgets, private connectors, governance, and audit.

Entitlement controls eligibility and limits; it grants no epistemic authority. Expensive sources require explicit entitlement, credits, pass-through cost, or institution-provided credentials.

## 6. Cost-offboarding and resumption

When entitlement or funding ends, the runtime MUST suspend execution without deleting the investigation. It MUST preserve assignments, Candidate Knowledge discoveries, provenance, source cursors, Search Execution Records, review history, and cost history. It MUST cancel or safely finish already-dispatched work according to the governing policy and prevent new dispatch.

Resumption requires renewed entitlement, valid authorization, a governed state transition, fresh policy evaluation, and a new immutable manifold binding. Neither suspension nor resumption may degrade, rewrite, or mutate System Canon.

## 7. Audit invariants

- “Silent” execution is non-interrupting but always visible in audit records.
- An assignment never implies continuous compute.
- Every dispatch has a causal trigger and deterministic authorization decision.
- Every execution has immutable assignment and manifold bindings.
- Every cost is estimated, reserved, measured, charged or released, and reconcilable.
- Lifecycle, entitlement, and budget transitions preserve historical state.
