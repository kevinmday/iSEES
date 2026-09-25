# REX-001 — Recursive Epistemic Exploration Runtime Contract

**Status:** Authoritative Contract

**Version:** 1.1

**Implements:** [SC-025 REX Recursive Epistemic Exploration and Deterministic Normalization](../../isees-ui/docs/computational-canon/SC-025_REX_Recursive_Epistemic_Exploration_and_Deterministic_Normalization.md)

**Related:** [SC-026 REX Frontier Agents](../../isees-ui/docs/computational-canon/SC-026_REX_Frontier_Agents.md); [REX-002 Frontier Agent Runtime Contract](REX-002_Frontier_Agent_Runtime_Contract.md)

## 1. Scope

This contract defines the provider-independent execution, normalization, provenance, cost, and authority boundary for REX. It is an architecture contract, not a runtime implementation or deployment authorization.

REX MAY execute when an Investigation Manifold is created, revised, or resolved, or when continuing exploration is explicitly assigned. Old investigations remain eligible: later events or newly available documents, people, organizations, places, systems, capabilities, limitations, contact information, and relationships may create a new frontier.

## 2. Deterministic execution boundary

AI MAY propose searches, discover candidate nodes and edges, extract candidate intelligence, and assist authoring. AI output MUST NOT directly mutate System Canon.

Before execution, deterministic policy MUST verify authorization, immutable manifold revision, purpose and scope, risk and privacy, source eligibility, freshness, duplicate disposition, utility threshold, and remaining budget. Authorization MUST remain valid at dispatch. Failure of any mandatory gate denies execution.

All discoveries MUST enter Candidate Knowledge with explicit provenance and AI-assistance annotations. Human authority governs admission. Contact discovery never authorizes contact. Versioned adapters MUST normalize heterogeneous source material into the canonical candidate schema while preserving raw source material, source spans or fields, content hashes, adapter version, and transformation lineage.

Every candidate projection MUST be deterministically validated against its bound manifold revision, ontology, provenance requirements, and candidate schema. Projection validation does not establish truth or admit knowledge.

## 3. Execution protocol

Each execution MUST proceed through these durable phases:

`ELIGIBILITY → POLICY GATE → BUDGET RESERVATION → DISPATCH → RETRIEVE → EXTRACT → NORMALIZE → QUARANTINE → VALIDATE → RECORD COST → RELEASE OR CHARGE RESERVATION → REVIEW`

The runtime MUST use idempotency keys and deterministic duplicate checks. A retry MUST refer to the original execution and MUST NOT silently create a second charge or provenance root. Cache reuse and duplicate suppression MUST be recorded even when no provider request occurs.

Execution MUST be bounded by time, request, token, byte, source-fee, and monetary or credit limits. Cancellation, timeout, policy revocation, circuit breaker activation, and budget exhaustion MUST stop further external work and preserve partial provenance.

## 4. Search Execution Record

Every attempted authorized execution, including cache hits, suppressed duplicates, partial failures, and zero-candidate results, MUST create one immutable Search Execution Record containing:

- execution, agent, and assignment identity, where applicable;
- immutable assignment revision, where applicable;
- bound immutable manifold revision;
- authorization and policy decision identity;
- trigger and query identity, with sensitive query material protected by policy;
- model, provider, and version;
- input and output tokens;
- source requests and source fees;
- compute duration;
- bytes retrieved, stored, and transferred;
- estimated cost and actual cost;
- budget identity and amount charged;
- cache and duplicate disposition;
- candidates produced, including node, edge, and candidate-update identities;
- provenance, adapter, configuration, and content hashes;
- execution outcome, errors, cancellation, or truncation state; and
- later review and admission disposition, linked append-only without rewriting the execution record.

Unknown actual costs MUST remain explicitly pending and later be reconciled through an append-only cost-ledger entry. Estimated cost MUST NOT be overwritten by actual cost.

## 5. Cost model and utility gate

For each execution:

$$
C_{run} = C_{compute} + C_{AI} + C_{source} + C_{storage} + C_{network}
$$

For an agent during period $T$:

$$
C_{agent}(T) = \sum_{r \in \operatorname{AuthorizedRuns}(T)} C_{run}(r)
$$

For the system:

$$
C_{system} = C_{base} + \sum C_{agent} + C_{review}
$$

The governed utility of proposed execution $a$ is:

$$
U(a) = w_I I(a) + w_B B(a) + w_F F(a) - \lambda \widehat{C}(a) - \mu R(a)
$$

Execution is permitted only when all of the following are true:

- $U(a)$ meets its governed threshold;
- estimated cost is within the remaining budget;
- the query is not a duplicate;
- freshness and source policies permit execution; and
- authorization remains valid.

Weights, estimates, thresholds, and risk classifications MUST be versioned governed configuration. A model may supply bounded inputs but MUST NOT grant itself execution authority.

## 6. Operational and infrastructure requirements

Public application serving and Frontier execution MUST be separable operational concerns. The execution plane MUST use a scheduler, durable queue, bounded workers, source adapters, provenance storage, and an append-only cost ledger. Workers SHOULD scale to zero when idle where supported. Uncontrolled perpetual polling loops are prohibited.

The system MUST enforce circuit breakers per user, investigation, agent, source, and globally. Expensive sources MUST require explicit entitlement, credits, pass-through cost, or institution-provided credentials. Credentials and secrets MUST NOT appear in Candidate Knowledge, Search Execution Records, logs, or cost telemetry.

## 7. Failure and authority invariants

- Denied execution produces no external request.
- Partial work produces no System Canon mutation.
- Adapter failure quarantines input and emits no invalid candidate projection.
- Provider success does not imply candidate validity.
- Candidate validity does not imply admission.
- Admission does not imply Canon promotion.
- Contact discovery does not imply permission to contact.
- Review disposition is attributable and preserves execution history.

## 8. Discovery configuration and scale

Each execution MUST declare one scale: `INVESTIGATION`, `MUTATION`, or `SELECTION`.

- `INVESTIGATION` performs bounded initial discovery for an investigation objective.
- `MUTATION` evaluates and explores a committed Manifold delta and its affected dependency closure.
- `SELECTION` performs focused discovery for an exact selected node or edge in investigation context.

Entity-specific execution remains REX execution under this contract. A versioned **Discovery Profile** selects the applicable subject classifications, source and safety policy, temporal views, completion criteria, and versioned **Objective Packs**. An Objective Pack specifies questions, required output families, query guidance, and stop conditions without predetermining factual conclusions. Executions MUST carry the exact profile and pack identities and versions.

Targets MUST support investigation, node, and edge identity. An edge target MUST bind both endpoint identities, the asserted relationship, direction when known, and temporal scope without treating graph presence as proof.

## 9. Candidate output and provenance contract

Permitted output families are candidate observations, candidate sources, candidate nodes, candidate edges, contradiction candidates, exclusion candidates, refresh candidates, and Research Vectors. Output types MUST remain distinguishable through normalization, validation, projection, and review.

Each output MUST identify its execution, subject or target, exact investigation and Manifold revision, source observation or source record, source locator and provider-neutral acquisition method, retrieval time, content hash where content was retrieved, temporal qualification, applicable restrictions, adapter and evaluator versions, and claim or field lineage. Copied or syndicated material MUST NOT be counted as independent corroboration without an explicit independence assessment. Missing or inaccessible information is a valid result and MUST NOT be replaced by unsupported inference.

An output is `INELIGIBLE`, `ELIGIBLE_FOR_REVIEW`, `PUBLISHED_CANDIDATE`, `REJECTED`, `SUPERSEDED`, or `WITHDRAWN` according to an attributable governed transition. `ELIGIBLE_FOR_REVIEW` is the default maximum status an execution may assign. Only an explicit researcher publication or admission operation may create `PUBLISHED_CANDIDATE` status.

## 10. Binding and execution fingerprint

Every plan, route, execution, result bundle, and current projection MUST bind the exact investigation identity and immutable Manifold revision. Selection-scale work MUST additionally bind the selected node or edge. The binding MUST include the Discovery Profile and Objective Pack versions, declared dependencies, contract and evaluator versions, source-policy version, and retrieval-as-of time where retrieval occurs.

The runtime MUST derive a deterministic execution fingerprint from all authority-bearing inputs, including investigation, revision, scale, target, objective, profile, packs, dependency set, policy versions, evaluator and adapter versions, and normalized query plan. Equivalent governed inputs MUST yield an equivalent fingerprint. The fingerprint is an idempotency and applicability control; it is not an epistemic claim.

Dependency declarations MUST identify the Manifold objects, fields, source cursors, policies, and versions whose change can affect the result. Mutation-scale planning MUST evaluate the changed dependency closure and prefer a delta execution. Manifold-wide execution is allowed only when policy requires it or deterministic equivalence of focused work cannot be established.

## 11. Staleness, invalidation, cancellation, and late results

A result becomes stale when its revision, fingerprint, target, temporal qualification, freshness policy, or declared dependency state no longer matches the active context. Staleness MUST be explicit and MUST prevent use in the current projection.

Invalidation marks an affected plan, result, or projection inapplicable without deleting its durable history. Cancellation MUST stop pending or executing external work where safe after authorization loss, policy revocation, dependency invalidation, target removal, timeout, circuit breaker activation, or researcher cancellation. Cancellation MUST preserve the execution record, receipts, partial provenance, and reconciled costs.

Late or stale completions MUST be recorded against their original execution and rejected from the current projection. They MUST NOT overwrite, merge into, or impersonate a result for the active revision.

## 12. Durable history, current projection, and publication

The runtime MUST distinguish:

- durable operational execution records, including assignments, executions, receipts, governed result bundles, costs, dispositions, and restoration history;
- the current revision-qualified Selection Intelligence projection; and
- Published Candidate Knowledge created through an explicit publication or admission operation.

A durable execution record or result bundle may remain historically inspectable while being stale, invalid, superseded, unpublished, or non-canonical. Durability does not establish current applicability, Candidate Knowledge publication, truth, admission, or Canon status. Restoration MUST restore historical identity and status; it MUST NOT silently restore stale content into a current projection.

Research Inbox insertion and Candidate Knowledge publication require separate explicit, attributable, idempotent operations with ownership, revision, provenance, eligibility, and effect validation. REX execution itself has zero automatic Research Inbox, operational Manifold, or System Canon mutation.

## 13. Provider-neutral boundaries and bounded execution

Capability requirements MUST be expressed independently of a named model, search provider, source repository, framework, or storage engine. Source adapters retrieve and preserve source material; they possess no authority to perform topology ownership, candidacy decisions, publication, or Canon promotion.

Every execution MUST declare and enforce cost, capability, privacy, source, temporal, and stopping policies. Stopping rules MUST cover completion criteria, marginal utility, duplication, time, request, token, byte, source-fee, monetary or credit, privacy, risk, cancellation, and researcher stop. Provider success cannot relax any boundary.

## Future live-discovery and commercial boundary amendment

The implemented runtime remains a deterministic, zero-cost local fixture producing Candidate Knowledge. It is not connected to Tavily; billing is disabled; and no production Candidate Evidence admission-to-Manifold recomputation bridge exists.

A future Tavily execution MUST route discovered material through the existing Candidate Evidence authority, quarantined outside canonical Manifold membership until explicit researcher-governed acceptance. It MUST NOT create a parallel store or admission authority, automatically publish to Research Inbox, or mutate the Manifold. Before paid execution, the contract MUST expose the Tavily provider charge, disclosed iSEES service margin, maximum authorized total, and—after implementation—actual reconciled final charge. Revised cost requires a revised proposal and new authorization.
