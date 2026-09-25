# SC-026 — REX Frontier Agents

**Status:** Canonical

**Version:** REX v0.2

**Category:** Computational Epistemology and Governed Exploration Architecture

**Depends on:** SC-003 Investigation Manifold; SC-008 Deterministic Discovery and Investigative Expansion; SC-010 Investigative Provenance and Graph Revision; SC-018 Computational Provenance and Epistemic Lineage; SC-019 Computational Knowledge Curation and Promotion; SC-025 REX Recursive Epistemic Exploration and Deterministic Normalization

**Runtime contract:** [REX-002 Frontier Agent Runtime Contract](../../../contracts/rex/REX-002_Frontier_Agent_Runtime_Contract.md)

## 1. Authority and purpose

A **Frontier Agent** is a persistent, bounded REX assignment to a node, edge, cluster, investigation, or research vector. It extends the investigation frontier without acquiring epistemic or Canon authority.

Persistent assignment does not mean continuously running AI compute. An assignment normally sleeps. It awakens only through a governed trigger, deterministic authorization, and an available execution budget. “Silent” means non-interrupting; it never means hidden, unaudited, or unrecorded.

The governing economic principle is:

> Persistent assignment is inexpensive; authorized execution consumes budget.

## 2. Assignment identity and lifecycle

Each assignment MUST have a stable identity, owner or governing authority, target scope, research objective, creation time, lifecycle state, trigger policy, source policy, freshness policy, risk policy, authorization state, and execution budget.

The lifecycle MUST support `SLEEPING`, `ELIGIBLE`, `EXECUTING`, `SUSPENDED`, `EXPIRED`, `REVOKED`, and `BUDGET_EXHAUSTED`. Suspension and budget exhaustion preserve the assignment; expiration and revocation preserve its history. Resumption is a governed transition, never an implicit restart.

An execution binds an immutable assignment revision and immutable manifold revision and creates an immutable Search Execution Record. Concurrent or later manifold changes do not change the context under which that execution was authorized.

## 3. Governed triggers

An agent MAY become eligible because of:

- manifold creation or revision;
- a completed Resolve;
- a source cursor or feed change;
- freshness expiration;
- discovery of a connecting node or edge;
- a researcher request;
- a scheduled, bounded refresh; or
- changed System Canon or Candidate Knowledge context.

A trigger creates eligibility only. It does not itself authorize execution. Trigger coalescing, freshness checks, duplicate suppression, authorization, risk, source policy, and budget gates apply before work begins.

## 4. Discovery boundary

Within an authorized execution, AI MAY propose searches, discover candidate nodes and edges, extract candidate intelligence, and assist authoring. An agent MAY add newly discovered candidate nodes or edges and MAY propose updates to existing candidate intelligence.

AI output MUST NOT directly mutate System Canon. Every discovery enters Candidate Knowledge with explicit source provenance, execution lineage, and AI-assistance annotations. Versioned adapters normalize heterogeneous material into the canonical candidate schema without strengthening claims. Deterministic policy gates authorize every execution and validate every projection. Human authority governs admission. Contact discovery never authorizes contact.

## 5. Execution utility and cost

For proposed execution $a$:

$$
U(a) =
w_I I(a) +
w_B B(a) +
w_F F(a) -
\lambda \widehat{C}(a) -
\mu R(a)
$$

$I(a)$ is expected information gain, $B(a)$ bridge or connection value, $F(a)$ freshness value, $\widehat{C}(a)$ estimated cost, and $R(a)$ governed risk. Weights and thresholds are governed configuration and MUST NOT be inferred by a model.

Execution is permitted only when $U(a)$ meets its governed threshold, estimated cost is within the remaining budget, the query is not a duplicate, freshness and source policies permit execution, and authorization remains valid.

Run cost is:

$$
C_{run} = C_{compute} + C_{AI} + C_{source} + C_{storage} + C_{network}
$$

Agent cost over period $T$ is:

$$
C_{agent}(T) = \sum_{r \in \operatorname{AuthorizedRuns}(T)} C_{run}(r)
$$

System cost is:

$$
C_{system} = C_{base} + \sum C_{agent} + C_{review}
$$

Cost telemetry and charging semantics are defined by REX-001 and REX-002.

## 6. Public user tiering

Entitlements express bounded policy capabilities and MUST NOT hard-code commercial prices:

- **Guest:** no persistent Frontier execution.
- **Free researcher:** no execution or a bounded introductory allowance.
- **Explorer:** limited assignments and executions.
- **Researcher:** recurring event-driven or scheduled exploration.
- **Professional:** deeper and more frequent exploration.
- **Institutional:** organization budgets, private connectors, governance, and audit.

Tier labels do not override authorization, privacy, source, risk, or budget policy. Expensive sources require explicit entitlement, credits, pass-through cost, or institution-provided credentials.

When entitlement ends, execution MUST be suspended without deleting the investigation. Assignments, discoveries, provenance, cursors, and history MUST remain preserved and available for governed resumption. Ending entitlement MUST NOT degrade or mutate System Canon.

## 7. Infrastructure boundary

The public application and Frontier execution are separate operational concerns. A conforming future runtime uses a scheduler, durable queue, bounded workers, source adapters, provenance storage, and cost ledger. Workers SHOULD scale to zero when idle where the execution environment supports it.

Uncontrolled perpetual polling loops are prohibited. Circuit breakers MUST exist at per-user, per-investigation, per-agent, per-source, and global scopes. Each breaker fails closed for new execution while preserving assignments and audit history.

This Canon specifies architecture and authority. It does not implement a scheduler, worker, source connector, billing system, or application behavior.

## 8. Required invariants

1. Assignment is not execution.
2. Trigger is not authorization.
3. Silence is not secrecy.
4. Discovery is Candidate Knowledge, not System Canon.
5. Contact discovery is not contact authorization.
6. Every execution binds immutable assignment and manifold revisions.
7. Every execution is recorded and cost-attributed.
8. Suspension preserves investigation state, provenance, and history.
9. Budget or entitlement cannot change epistemic status.
10. No agent runs an uncontrolled perpetual polling loop.

## 9. Revision-triggered attention and assignment scope

A committed Manifold revision MAY create an attention trigger. Before agent execution, deterministic attention evaluation MUST identify the changed dependency closure, freshness and duplicate state, unresolved frontier, authorization, and applicable attention policy. A trigger that produces no eligible delta MUST NOT dispatch an agent.

Assignments MAY have investigation, mutation, or selection scope and MAY target a node, edge, cluster, investigation, Research Vector, focused dependency closure, or the Manifold as a whole. Mutation-triggered assignments SHOULD be delta-based. Manifold-wide work is permitted only when governed attention evaluation establishes that focused work is insufficient or cannot be proven equivalent.

Researcher-controlled attention policies are:

- `MANUAL`: only explicit researcher initiation may create eligible execution.
- `FOCUSED`: eligibility is restricted to named targets or affected dependency closures.
- `GOVERNED_ACTIVE`: authorized triggers may create eligibility within declared policy and budget boundaries.

Every assignment MUST declare cost, provider capability, privacy, source, and stopping boundaries. These boundaries fail closed and cannot be relaxed by a model or source adapter. SC-025 governs the epistemic doctrine, candidate output families, REX Entity Discovery, and publication boundary.

## 10. Cancellation, invalidation, and completion

Dependency declarations MUST permit a later committed Manifold revision, policy revocation, target removal, or authorization change to cancel pending work or invalidate affected current projections. Cancellation stops further external work where safe and preserves the durable assignment, execution, receipt, partial provenance, and cost history required by REX-001 and REX-002.

A completion MUST be rejected from the current projection when its assignment revision, Manifold revision, input fingerprint, target, or declared dependency state no longer matches the active context. Rejection from the current projection does not erase historical execution records.

Frontier Agent execution MUST NOT automatically publish to Research Inbox, create Published Candidate Knowledge, accept a candidate node or edge, or promote content to System Canon.

## 16. Manifold-centered frontier proposal boundary

A Frontier mission is anchored at a selected node with missing intelligence, a selected edge requiring validation, a contradiction, unresolved similarity, hypothesis, or evidence gap. The anchor supplies context and scope. Before any external or paid execution, the agent MUST create a free bounded proposal stating the question, relevance, providers, searches, expected evidence, capabilities, limitations, maximum cost, and stop conditions. The researcher may approve, modify, reject, or postpone it; no paid discovery begins without explicit authorization.

Future live-source results enter the existing Candidate Evidence authority and remain quarantined outside canonical Manifold membership until researcher-governed acceptance. A Frontier Agent has no independent authority to modify the Manifold, promote Candidate Evidence, insert material into Research Inbox, resolve uncertainty as fact, change conclusions, begin additional paid work, or decide meaning. Governed acceptance may conditionally supply eligible input to deterministic recomputation; it does not itself establish truth.

The scheduler, lifecycle, and bounded-refresh provisions above remain future runtime authority. Frontier Agents, proposal persistence, and Authorization Envelope persistence are not currently implemented, and this Canon does not present autonomous recurring execution as current behavior.
