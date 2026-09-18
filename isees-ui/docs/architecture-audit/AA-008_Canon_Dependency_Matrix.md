\# AA-008 — Canon Dependency Matrix



\*\*Architectural Audit Series\*\*



\*\*Status:\*\* Living Document  

\*\*Classification:\*\* Canonical Architecture Audit  

\*\*Revision:\*\* 0.2 (Governance reconciliation)



\---



\# Mission



This document reconstructs the dependency relationships between every System Canon within the iSEES platform.



Its purpose is to establish how architectural concepts build upon one another and to identify the downstream consequences of future architectural changes.



Rather than documenting implementation, this audit documents architectural dependency.



\---



\# Purpose



As the iSEES System Canon has expanded, architectural concepts have become distributed across numerous canonical documents.



Individual canons rarely exist in isolation.



Most define concepts consumed by later canons, runtimes, engineering packages, and computational objects.



This document reconstructs those dependencies into a single architectural reference.



It answers:



> \*\*How does every System Canon relate to every other System Canon?\*\*



\---



\# Architectural Philosophy



Every System Canon should exist for a single architectural purpose.



Every canonical concept should have clearly defined dependencies.



Architectural dependencies should always flow forward.



Circular dependencies should never exist.



The Canon Dependency Matrix therefore serves as the architectural map of the System Canon itself.



\---



\# Canon Dependency Model



Every System Canon should document:



\- Architectural Purpose

\- Primary Concepts

\- Upstream Dependencies

\- Downstream Consumers

\- Primary Runtime(s)

\- Primary Computational Objects

\- Primary Engineering Packages

\- Implementation Status

\- Architectural Stability



\---



\# Canon Inventory



The following inventory represents the current canonical architecture.



Additional canons should be incorporated as the platform evolves.



\---



\## SC-001



\### Purpose



Resolve–Dissolve Computation



\### Primary Concepts



\- Deterministic Investigation

\- Investigation Manifold

\- Resolve–Dissolve Philosophy



\### Upstream Dependencies



None



\### Downstream Consumers



Nearly every computational subsystem.



\### Primary Runtime



Resolve Runtime



\### Primary Objects



\- Computational Universe

\- Investigation Manifold



\### Architectural Importance



Foundational



\---



\## SC-002



\### Purpose



Computational Layers



\### Primary Concepts



\- Computational Layers

\- Mathematical Assumptions

\- Computational Universe



\### Upstream Dependencies



SC-001



\### Downstream Consumers



Resolve Runtime



Projection



Investigation



\### Primary Runtime



Resolve Runtime



\### Architectural Importance



Foundational



\---



\## SC-003



\### Purpose



Foundational computational architecture.



(Current contents to be verified during audit.)



\### Status



Pending Review



\---



\## SC-004



Pending Audit



\---



\## SC-005



Pending Audit



\---



\## SC-006



Pending Audit



\---



\## SC-007



Pending Audit



\---



\## SC-008



\### Purpose



Deterministic Discovery and Investigative Expansion



\### Depends Upon



SC-001



SC-002



\### Consumed By



Investigation Runtime



Resolve Runtime



Research Runtime



\### Status



Requires Detailed Audit



\---



\## SC-009



\### Purpose



Manifold Instrument Architecture



\### Depends Upon



Workspace Runtime



Projection Architecture



\### Consumed By



Workspace



Operator



Projection



\### Status



Implemented



\---



\## SC-010



\### Purpose



Investigative Provenance and Graph Revision



\### Depends Upon



Knowledge Runtime



Research Runtime



Resolve Runtime



\### Consumed By



Research



Author



Future Resolve



\### Status



Implemented



\---



\## SC-011



\### Purpose



Investigative Expansion and Event-Space Reconstruction



\### Depends Upon



SC-008



SC-010



\### Consumed By



Resolve Runtime



Future Hypothesis Runtime



\### Status



Implemented



\---



\## SC-012



\### Purpose



Computational Projection Architecture



\### Depends Upon



Knowledge Runtime



Resolve Runtime



\### Consumed By



Workspace



Research



Author



\### Status



Implemented



\---



\## SC-013



\### Purpose



Computational Observation Architecture



\### Depends Upon



Observation Runtime



\### Consumed By



Knowledge Runtime



Resolve Runtime



\### Status



Implemented



\---



\## SC-014



\### Purpose



Knowledge Promotion



\### Depends Upon



Knowledge Runtime



Observation Runtime



\### Consumed By



Knowledge Runtime



\### Status



Implemented



\---



\## SC-015



\### Purpose



Canonical Artifact Architecture



\### Depends Upon



Knowledge Runtime



Author Runtime



\### Consumed By



Author Runtime



Publication



\### Status



Implemented



\---



\# Dependency Principles



Architectural dependencies should satisfy the following principles.



\- Dependencies flow in one direction.

\- Circular dependencies are prohibited.

\- Higher-level architecture depends upon lower-level architecture.

\- Runtime implementation follows System Canon.

\- Engineering Packages implement System Canon.

\- Source Code realizes Engineering Packages.



\---



\# Dependency Hierarchy



The architectural dependency hierarchy is intended to resemble the following.



```text

SC-001

&#x20;       │

&#x20;       ▼

SC-002

&#x20;       │

&#x20;       ▼

SC-008

&#x20;       │

&#x20;       ▼

SC-010

&#x20;       │

&#x20;       ▼

SC-011

&#x20;       │

&#x20;       ▼

SC-012

&#x20;       │

&#x20;       ▼

SC-013

&#x20;       │

&#x20;       ▼

SC-014

&#x20;       │

&#x20;       ▼

SC-015

```



Additional dependencies should be incorporated as the audit progresses.



\---



\# Runtime Relationships



Each System Canon should ultimately identify:



\- owning runtime

\- primary computational objects

\- downstream projections

\- produced artifacts

\- architectural dependencies



This mapping will eventually provide complete traceability from architecture to implementation.



\---



\# Canon Stability



Every System Canon should eventually receive one of the following classifications.



\- Experimental

\- Emerging

\- Stable

\- Constitutional

\- Historical



These classifications help identify which architectural concepts are expected to evolve and which should remain stable.



\---



\# Future Expansion



Future revisions should include:



\- Complete dependency graph

\- Runtime dependency mapping

\- Engineering Package mapping

\- Computational object mapping

\- Artifact mapping

\- Source-code mapping

\- Canon evolution timeline



\---



\# Relationship to Other Audit Documents



AA-001 reconstructs the computational foundation.



AA-002 reconstructs runtime architecture.



AA-003 reconstructs computational objects.



AA-004 reconstructs runtime ownership.



AA-005 reconstructs the computational pipeline.



AA-006 establishes architectural invariants.



AA-007 captures unresolved architectural questions.



This document establishes the dependency relationships between every System Canon and provides the architectural roadmap connecting the entire canonical body of knowledge.



Ultimately, this document should serve as the master dependency map of the iSEES architecture, allowing future engineering work to identify precisely which architectural concepts are affected by any proposed change.



\---



\# Reconciled REX and Engineering Governance Dependencies



The following are actual authority dependencies established by the current Canon and contracts. They supplement the incomplete foundation inventory above without changing its historical entries.



| Authority | Upstream dependencies | Downstream consumers | Relationship |
|---|---|---|---|
| SC-025 REX | SC-003; SC-008; SC-010; SC-018; SC-019 | SC-026; REX-001; Selection Intelligence as inspection consumer | REX discovery, normalization, candidacy, revision binding, and publication doctrine |
| SC-026 Frontier Agents | SC-003; SC-008; SC-010; SC-018; SC-019; SC-025 | REX-002 | Persistent assignment, trigger, attention, cancellation, and resumption doctrine |
| REX-001 | SC-025 | REX runtime; REX-002; Selection Intelligence and explicit publication consumers | Provider-neutral durable execution and Entity Discovery contract |
| REX-002 | SC-026; REX-001 | Frontier Agent execution implementations | Assignment lifecycle and execution-trigger contract |
| EA-002 Engineering Change Governance | Knowledge Architecture; Knowledge Document Classification Standard; Knowledge Governance; AA-004; AA-008 | Engineering packages and final change handoffs | Existing-code-first discovery, ownership, mutation, verification, and Git-authority gates |
| SC-027 Researcher-Directed Evidence Intake and Web Discovery | SC-003; SC-008; SC-010; SC-018; SC-019; SC-025; SC-026 | EVIDENCE-001; existing Candidate Evidence/EVIDENCE owners; Research Inbox publication; governed operational revision | Canonical intake, Web Discovery, review, explicit publication, Candidate Knowledge, provenance, contradiction, cost, and no-silent-progression doctrine |
| SC-028 Governed Frontier Agent Research Authorization | SC-025; SC-026; SC-027 | Future Research Proposal, Authorization Envelope, Research Credit ledger, execution reconciliation, and receipt implementations | Tavily discovery-reference boundary; bounded Frontier Agent authorization; pooled-provider economics; account metering; researcher-only capture; zero automatic epistemic mutation; optional paid REX acceleration |
| EVIDENCE-001 | SC-027; existing Candidate Evidence canon and lifecycle contracts; SC-010 operational revision authority; SC-018 provenance authority; SC-019 Candidate Knowledge and Research Inbox authority; SC-025 and REX-001/REX-002 producer boundaries; REX cost transparency concepts; EA-002 | Existing frontend/backend Candidate Evidence owners; Research Bridge and `research_sources`; typed Research sources; Operational Graph Revision; future provider adapters and reviewed REX producers | Single runtime contract for revision-bound intake, independent acquisition/review/publication states, explicit durable publication, receipts, isolation, and governed revision proposals |
| Existing Candidate Evidence contracts and lifecycle | SC-027; EVIDENCE-001; SC-018 | EVIDENCE workspace; backend Candidate Evidence service/repository; explicit publication command | Authoritative Candidate Evidence identity, origin, review, provenance, concurrency, and persistence boundary; Web Discovery remains typed `DISCOVERY` lineage |
| Research Inbox authority | SC-019; SC-027; EVIDENCE-001 | Research Bridge, `research_sources`, Studio typed source consumers | Explicit publication projection through distinct Candidate Knowledge and Research Anchor records; never automatic publication or graph mutation |
| Operational revision authority | SC-003; SC-010; SC-027; EVIDENCE-001 | `OperationalGraphRevision` and revision engine consumers | Sole approval path from published node/directed-edge proposals to one new immutable Manifold revision |
| Provenance authority | SC-010; SC-018; SC-027; EVIDENCE-001 | Candidate Evidence, Candidate Knowledge, Research Anchors, revision proposals, REX producer lineage | End-to-end origin, source, authority, operation, content, contradiction, investigation, and revision lineage |
| REX canon and contracts | SC-025; SC-026; REX-001; REX-002 | Later reviewed REX-to-EVIDENCE producer integration | REX may produce review-only results and reusable cost vocabulary; it does not own Web Discovery, EVIDENCE, Inbox publication, or revision |
| Cost transparency | SC-025; REX-001; SC-027; EVIDENCE-001 | Web Discovery and intake operation receipts; UI capability/cost projections | Truthful zero cost, visible bounded preauthorization for metered work, final reconciliation, released authorization, and no paid epistemic privilege |



These dependencies create no new REX contract, owner registry, runtime, or implementation. SC-025 remains the epistemic owner, SC-026 remains the Frontier assignment owner, SC-027 remains the researcher-directed Evidence and Web Discovery owner, SC-028 governs bounded Frontier Agent research authorization and its commercial boundary, REX-001 remains the execution contract, REX-002 remains the Frontier runtime contract, AA-004 remains the ownership matrix, and EA-002 governs engineering change procedure.

