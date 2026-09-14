# SC-025 — REX: Recursive Epistemic Exploration and Deterministic Normalization

**Status:** Canonical

**Version:** REX v0.3

**Category:** Computational Epistemology and Candidate Knowledge Architecture

**Depends on:** SC-003 Investigation Manifold; SC-008 Deterministic Discovery and Investigative Expansion; SC-010 Investigative Provenance and Graph Revision; SC-018 Computational Provenance and Epistemic Lineage; SC-019 Computational Knowledge Curation and Promotion

**Governed by:** [REX-001 Recursive Epistemic Exploration Runtime Contract](../../../contracts/rex/REX-001_Recursive_Epistemic_Exploration_Runtime_Contract.md)

**Extended by:** [SC-026 REX Frontier Agents](SC-026_REX_Frontier_Agents.md); [REX-002 Frontier Agent Runtime Contract](../../../contracts/rex/REX-002_Frontier_Agent_Runtime_Contract.md)

## 1. Authority and scope

This document is the authoritative System Canon for REX v0.3. REX means **Recursive Epistemic Exploration**.

REX combines probabilistic AI discovery, deterministic manifold computation, immutable provenance, researcher-governed admission, and strict separation between Candidate Knowledge and System Canon. It governs epistemic behavior; it does not define or authorize a REX runtime, provider contract, global relationship redesign, or confidence-model migration.

REX seeks outward from the current Investigation Manifold. An investigation remains eligible for governed exploration after creation, revision, or resolution because later events and newly discoverable documents, people, organizations, places, systems, capabilities, limitations, contact information, and relationships may change its frontier. REX MAY also continue when a researcher or other authorized authority explicitly assigns continuing exploration.

Its permanent principle is:

> AI discovers the possible manifold.
>
> Adapters normalize the candidate manifold.
>
> Deterministic iSEES governs the admissible manifold.

Where earlier discovery language excludes AI entirely, this Canon controls the narrower REX process: AI may propose and extract, but deterministic gates and human governance retain all authority.

# Part I — Recursive Epistemic Exploration

## 2. Manifold state

At authoritative revision $k$, the investigation manifold is:

$$
\mathcal{M}_k =
\left(
V_k,
E_k,
\Phi_k,
\Omega_k,
\Pi_k,
\Sigma_k,
t_k
\right)
$$

- $V_k$: admitted Knowledge Objects.
- $E_k$: admitted relationships.
- $\Phi_k$: analytical, temporal, contextual, and intentional fields.
- $\Omega_k$: ontology, rules, and admissibility constraints.
- $\Pi_k$: provenance and epistemic classifications.
- $\Sigma_k$: immutable sources and Search Execution Records.
- $t_k$: authoritative manifold revision.

“Admitted” does not mean true or part of System Canon. Admission status remains explicit.

## 3. Localization and frontier

Given research objective $q$, localization selects a bounded research neighborhood:

$$
N_0 = L(q,\mathcal{M}_k)
$$

$N$ is the localized research neighborhood relevant to the objective. Its frontier is:

$$
U_k = \partial N_k
$$

$U_k$ consists of unresolved questions, missing objects, incomplete relationships, contradictions, ambiguities, and provenance gaps.

## 4. AI action proposals and deterministic gate

AI may propose possible research actions from the objective, neighborhood, frontier, and governed history $H_k$:

$$
A_k \sim P_\theta(a \mid q,N_k,U_k,H_k)
$$

This probability distribution proposes possibilities; it grants no authority to execute them.

Every action passes through the deterministic gate:

$$
\widehat{A}_k =
\Gamma(A_k;\Omega_k,B_k,\rho_k)
$$

Here $B_k$ is the governed budget and $\rho_k$ is the applicable risk and privacy state. For an individual action:

$$
\Gamma(a) = I_P I_B I_A I_R I_N
$$

$I_P$ means permitted, $I_B$ bounded, $I_A$ auditable, $I_R$ risk/privacy compliant, and $I_N$ unable to mutate System Canon. Each indicator is mandatory and binary. If any mandatory term is zero, the action MUST NOT execute.

## 5. Provider-independent retrieval

Approved actions retrieve evidence from a governed set of sources and repositories $\mathcal{S}$:

$$
D_k =
\bigcup_{a\in\widehat{A}_k}
\operatorname{Retrieve}(a,\mathcal{S})
$$

REX requires searchable evidence but MUST NOT depend on Google, Bing, any single AI provider, or any single repository. Search providers possess no epistemic authority.

### 5.1 Search Execution Record

Every retrieval produces an immutable Search Execution Record:

$$
\sigma_i =
\left(
u_i,
s_i,
\tau_i,
h_i,
a_i,
m_i,
\theta_i,
\rho_i
\right)
$$

- $u_i$: source locator.
- $s_i$: source repository or provider.
- $\tau_i$: retrieval time.
- $h_i$: content hash.
- $a_i$: originating governed action.
- $m_i$: retrieval method.
- $\theta_i$: model and configuration, when applicable.
- $\rho_i$: restrictions, including access, privacy, rights, and use constraints.

An execution MUST bind one immutable manifold revision. Its Search Execution Record MUST additionally identify the governing assignment when one exists and carry the cost and disposition telemetry required by REX-001. Contact information is Candidate Knowledge subject to the same provenance, privacy, and review requirements as every other discovery. Discovering contact information never authorizes contacting a person or organization.

## 6. AI extraction and candidate quarantine

AI may extract candidates from retrieved material:

$$
C_k \sim P_\theta(c \mid D_k,N_k,\Omega_k)
$$

AI-extracted candidates remain proposals. Model confidence $p_i$ is not truth $T(c_i)$:

$$
p_i \neq T(c_i)
$$

Every AI-originated candidate MUST be classified as all of:

- `AI_DISCOVERED`
- `CANDIDATE_KNOWLEDGE`
- `RESEARCHER_REVIEW_REQUIRED`
- `CANON_EFFECT_NONE`

These classifications remain until an explicit governed operation changes an eligible classification. Quarantine is an authority boundary, not merely a user-interface state.

# Part II — Deterministic Normalization

## 7. Adapter authority

A versioned, ontology-governed adapter transforms preserved input $X$ into normalized Candidate Knowledge:

$$
K^C =
\mathcal{A}_{\Omega}^{\,v}(X)
$$

- $X$: preserved researcher-supplied or AI-extracted input.
- $\mathcal{A}$: deterministic adapter.
- $\Omega$: ontology and normalization rules.
- $v$: adapter version.
- $K^C$: normalized Candidate Knowledge.

The result is:

$$
K^C =
\left(
V^C,
E^C,
\Lambda,
X
\right)
$$

$V^C$ is the candidate-node collection, $E^C$ the candidate-relationship collection, $\Lambda$ normalization lineage, and $X$ the recoverable raw input.

## 8. Normalization boundary

$$
\text{Normalization}
\neq
\text{Inference}
\neq
\text{Promotion}
$$

An adapter MAY preserve raw supplied values, normalize vocabulary, convert explicit meaning into ontology objects, create deterministic identities, create relationships justified by supplied fields, attach Candidate Knowledge classifications, and preserve source-field lineage.

An adapter MUST NOT invent facts, strengthen claims, validate truth, merge identities, promote Candidate Knowledge, or mutate System Canon.

## 9. Semantic conservation

Normalization is claim-conserving:

$$
\operatorname{Claims}
\left(
\mathcal{A}_{\Omega}^{\,v}(X)
\right)
\subseteq
\operatorname{Claims}(X)
$$

Its epistemic strength $\mathcal{E}$ cannot exceed that of its source:

$$
\mathcal{E}
\left(
\mathcal{A}_{\Omega}^{\,v}(x)
\right)
\leq
\mathcal{E}(x)
$$

Normalized meaning may be equal to or more cautious than the source, never stronger.

## 10. Object and relationship normalization

Each candidate object is normalized under the ontology and adapter version:

$$
V_i^C =
\mathcal{N}_V(x_i,\Omega,v)
$$

$$
V^C =
\bigcup_i V_i^C
$$

Relationships are normalized only after candidate endpoints exist:

$$
E^C =
\mathcal{N}_E(X,V^C,\Omega,v)
$$

Every generated relationship MUST be traceable to source fields, a normalization rule, and the adapter version.

## 11. Normalization lineage

For every normalized object and edge, lineage is:

$$
\lambda_j =
\left(
id_X,
F_j,
r_j,
v,
t,
a
\right)
$$

- $id_X$: source identity.
- $F_j$: exact source fields and, where extracted from text, source spans.
- $r_j$: named normalization rule.
- $v$: adapter version.
- $t$: source or revision time.
- $a$: supplying actor.

Lineage is mandatory for every normalized object and relationship. If the global relationship contract cannot carry it, a candidate-owned immutable payload or lineage record MUST preserve it until that contract is extended; implementations MUST disclose this limitation.

## 12. Deterministic equivalence

$$
X_1 \equiv X_2
\Rightarrow
\mathcal{A}_{\Omega}^{\,v}(X_1)
=
\mathcal{A}_{\Omega}^{\,v}(X_2)
$$

Equivalent input MUST produce identical identities, ordering, classifications, and serialized topology. “Canonical serialization” and “canonical ordering” below describe deterministic representations; neither makes content part of System Canon.

## 13. Embedded structure

Deterministic extraction from researcher-supplied free text is permitted only when the parser is deterministic, versioned, general rather than case-specific, source-span preserving, ontology governed, incapable of inventing missing facts, and explicit about ambiguity and failure. Failure to match creates no object. Ambiguity MUST NOT be silently resolved.

## 14. Normalization certainty and truth confidence

$$
C_N \neq C_T
$$

$C_N$ is certainty that the adapter faithfully normalized the supplied statement. $C_T$ is confidence that the underlying statement is true. An adapter may be certain that a researcher reported two videos while the existence, contents, and authenticity of those videos remain unverified. A software field named only `confidence` MUST NOT silently conflate these quantities.

## 15. Aggregate observations

“Eight adults witnessed the event” does not authorize eight fabricated `PERSON` objects. An adapter MUST use a valid aggregate-observer representation if the ontology supports one. Otherwise it MUST preserve witness count and observer context as structured `EVENT` metadata until an appropriate ontology type exists. Identity MUST NOT be fabricated to satisfy topology expectations.

## 16. One authoritative normalized collection

$$
K_{\text{stored}}^C =
K_{\text{operational}}^C
$$

MANIFOLD, COMPARE, Resolve, and LAYERS may project different views of the same Candidate Knowledge collection. They MUST NOT independently reconstruct semantically different versions. A stored normalized collection or an authoritative stored specification may be used, provided projections are deterministically and byte-equivalently derived. The same object identity MUST NOT have contradictory relationship collections.

# Part III — Validation, priority, and governance

## 17. Validation

$$
Z_i =
V(c_i,\Sigma_i^C,\Omega_k,\Pi_k)
$$

Validation may establish source, hash, claim span, ontology validity, relationship endpoints, reproducibility, identity state, source independence, contradictions, and restrictions. Validation neither establishes truth nor causes promotion.

## 18. Research priority

$$
R_i =
\frac{
\alpha r_i +
\beta n_i +
\gamma b_i +
\delta s_i +
\eta g_i +
\kappa x_i
}{
1 +
\lambda u_i +
\mu d_i +
\nu \rho_i
}
$$

$r_i$ is relevance, $n_i$ novelty, $b_i$ bridge value, $s_i$ source quality, $g_i$ information gain, $x_i$ investigative reach, $u_i$ uncertainty, $d_i$ duplication, and $\rho_i$ risk. Coefficients are governed configuration.

Research priority is not truth:

$$
R_i \neq T(c_i)
$$

Information gain is:

$$
IG(c_i) =
H_{\text{before}}
-
\mathbb{E}
\left[
H_{\text{after}}
\right]
$$

Topological bridge value is the positive reduction in governed graph distance produced by provisionally considering a candidate. It measures investigative importance, not proof.

## 19. Researcher dispositions

The governed researcher dispositions are:

- `REJECT`
- `HOLD`
- `COLLECT`
- `ACCEPT_AS_CANDIDATE`

Accepting Candidate Knowledge does not accept it as truth and does not promote it to System Canon. Relationship acceptance is a separate explicit act governing an edge and does not imply acceptance of either endpoint as truth.

## 20. Governed transition and System Canon invariant

An admitted candidate transition is:

$$
\mathcal{M}_{k+1}
=
G(
\mathcal{M}_k,
K_k^C,
Z_k,
d_k,
\Omega_k
)
$$

$d_k$ is the attributable researcher disposition. Probabilistic output cannot cause the transition:

$$
P_\theta(c\mid X)
\not\Rightarrow
\mathcal{M}_{k+1}
$$

System Canon remains unchanged:

$$
\mathcal{M}_{k+1}^{\mathrm{Canon}}
=
\mathcal{M}_k^{\mathrm{Canon}}
$$

unless a separate, explicit Canon-governance operation is performed.

## 21. Recursive expansion and convergence

Accepted candidate nodes and relationships may expand the research neighborhood:

$$
N_{k+1}
=
N_k
\cup
V_k^{\mathrm{accepted}}
\cup
E_k^{\mathrm{accepted}}
$$

Cycle value consists of new-node value, new-edge value, information gain, bridge value, and contradiction or explanatory value, minus computational cost, retrieval cost, risk, and duplication. REX stops when cycle value remains below governed threshold $\epsilon$ for a governed number of iterations, or when budget, risk, policy, provenance, duplication, auditability, or researcher-stop conditions require termination.

## 22. Canonical REX cycle

`LOCALIZE → FIND GAPS → PROPOSE SEARCHES → GATE → RETRIEVE → EXTRACT → NORMALIZE → QUARANTINE → RANK → VALIDATE → REVIEW → ACCEPT AS CANDIDATE → EXPAND → REPEAT OR STOP`

No arrow in this cycle implies truth, admission, relationship acceptance, or Canon promotion unless the named governed operation explicitly performs it.

## 23. Required invariants

1. Discovery is not truth.
2. Probability is not authority.
3. Ranking is not validation.
4. Validation is not promotion.
5. Normalization is not inference.
6. Normalization is not promotion.
7. Normalization cannot strengthen source meaning.
8. Raw source content remains recoverable.
9. Candidate Knowledge retains its classification.
10. AI cannot mutate System Canon.
11. Every admitted object has provenance and lineage.
12. Every admitted relationship has provenance and lineage.
13. Every manifold transition is versioned and attributable.
14. Search providers possess no epistemic authority.
15. Candidate admission and Canon promotion are separate.
16. AI-assisted authoring remains identifiable.
17. REX may broaden the research field but not its own authority.
18. Normalization certainty and truth confidence are distinct.
19. Stored and operational Candidate Knowledge cannot diverge semantically.
20. Every execution is authorized by deterministic policy and bound to an immutable manifold revision.
21. Every discovery enters Candidate Knowledge with explicit provenance and AI-assistance annotations.
22. Contact discovery is not contact authorization.

## 24. Controlled terminology

- **System Canon:** architecturally accepted, governance-controlled system truth. Only explicit Canon governance may change it.
- **Canonical serialization:** one deterministic byte representation of given content; it conveys no System Canon status.
- **Canonical ordering:** one deterministic order for equivalent collections; it conveys no System Canon status.
- **Canonical Knowledge identity:** the governed stable identity of a System Canon Knowledge Object; it is not a candidate identity.
- **Operational manifold:** the versioned graph state used by active computation, including properly classified admitted candidates.
- **Candidate Knowledge:** preserved, normalized proposed knowledge that remains outside System Canon.
- **Normalization:** deterministic, ontology-governed, meaning-conserving representation of supplied input.
- **Validation:** deterministic checking of source, lineage, form, constraints, and reproducibility; not truth establishment.
- **Candidate admission:** a researcher-governed decision to admit an item as Candidate Knowledge.
- **Relationship acceptance:** a separate governed decision to admit a candidate edge.
- **Canon promotion:** a separate explicit governance operation that may admit eligible knowledge to System Canon.

The unqualified word “canonical” MUST NOT be used when one of these precise terms is intended.

## 25. Deferred software contracts

The REX execution boundary and Search Execution Record are specified by REX-001. Persistent Frontier assignments are governed by SC-026 and REX-002. Provider/repository adapter implementations, the global relationship-lineage contract, aggregate-observer ontology type, global normalization-certainty/truth-confidence model, candidate admission workflow, and Canon-promotion workflow remain deferred. Deferral grants no implementation permission and weakens none of the invariants above.
