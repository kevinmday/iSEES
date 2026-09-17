\# AA-004 — Runtime Ownership Matrix



\*\*Architectural Audit Series\*\*



\*\*Status:\*\* Living Document  

\*\*Classification:\*\* Canonical Architecture Audit  

\*\*Revision:\*\* 0.2 (Capability-owner reconciliation)



\---



\# Mission



This document establishes the canonical ownership boundaries of every runtime within the iSEES platform.



Where AA-002 describes each runtime individually, this document compares every runtime collectively.



Its purpose is to eliminate ambiguity by explicitly defining ownership, authority, responsibilities, and prohibited responsibilities for every runtime prior to implementation of the Resolve–Dissolve Computational Engine.



\---



\# Purpose



One of the defining architectural principles of iSEES is that every runtime owns exactly one architectural concern.



No runtime should duplicate another runtime's responsibilities.



No runtime should own another runtime's state.



No runtime should perform another runtime's computation.



This document formalizes those ownership boundaries.



\---



\# Ownership Philosophy



Every runtime is responsible for:



\- owning its own state

\- managing its own lifecycle

\- exposing deterministic services

\- publishing deterministic state



Every runtime must avoid:



\- duplicate ownership

\- presentation logic

\- unauthorized computation

\- unauthorized persistence



Ownership must always remain explicit.



\---



\# Runtime Ownership Matrix



| Runtime | Primary Responsibility | Owns | Creates | Updates | Consumes | Projects | Persists | Never Owns |

|----------|------------------------|-------|----------|----------|-----------|-----------|------------|--------------|

| Operator Session Runtime | Operator session lifecycle | Operator Session | Sessions | Session State | Workspace | No | Session Metadata | Investigation, Knowledge, Computation |

| Workspace Runtime | Workspace composition | Workspace State | Layouts | Layout State | Session | Workspace Views | Workspace Preferences | Investigation, Knowledge, Computation |

| Investigation Runtime | Investigation lifecycle | Investigation | Investigations | Investigation State | Knowledge Objects, Observations | Investigation Context | Investigation Metadata | Execution, Projection |

| Observation Runtime | Observation lifecycle | Observations | Observations | Observation State | External Sources | Observation Views | Observation Metadata | Knowledge Objects, Investigation |

| Knowledge Runtime | Canonical Knowledge | Knowledge Objects | Knowledge Objects | Knowledge Revisions | Observations | Knowledge Projections | .knowledge Artifacts | Workspace, UI |

| Research Runtime | Research collection | Research Anchors | Anchors | Anchor State | Investigation, Knowledge | Research Inbox | Research Metadata | Knowledge Persistence, Author Documents |

| Author Runtime | Computational authoring | Author Documents | .author Documents | Document State | Research Anchors | Author Projections | .author Artifacts | Investigation, Knowledge |

| Projection Architecture | Visual projections | Projection Objects | Projections | Projection State | Computational Objects | All Visualizations | None | Computational State |

| Resolve Runtime \*(Planned)\* | Deterministic computation | Computational Universe, Execution | Executions | Execution State | Investigation, Knowledge, Observations | Computational Results | Execution History | UI, Projection, Author Documents |



\---



\# Runtime Authority



The following ownership principles are considered architectural law.



\---



\## Operator Session Runtime



Authoritative for:



\- active operator session

\- operator identity

\- session lifecycle



Not authoritative for:



\- investigations

\- computation

\- workspace composition



\---



\## Workspace Runtime



Authoritative for:



\- workspace state

\- layout

\- active instruments



Not authoritative for:



\- investigation state

\- computational state

\- knowledge



\---



\## Investigation Runtime



Authoritative for:



\- investigation lifecycle

\- investigation metadata

\- investigation revision



Not authoritative for:



\- computational execution

\- projection

\- rendering



\---



\## Observation Runtime



Authoritative for:



\- observations

\- observation provenance

\- observation normalization



Not authoritative for:



\- knowledge promotion

\- investigation execution



\---



\## Knowledge Runtime



Authoritative for:



\- Knowledge Objects

\- Relationship Objects

\- knowledge promotion

\- knowledge revisions



Not authoritative for:



\- investigation execution

\- workspace

\- rendering



\---



\## Research Runtime



Authoritative for:



\- Research Anchors

\- Research Inbox

\- collected computational artifacts



Not authoritative for:



\- author documents

\- computational execution



\---



\## Author Runtime



Authoritative for:



\- .author documents

\- author references

\- computational provenance preserved within authored works



Not authoritative for:



\- investigation computation

\- knowledge promotion

\- workspace



\---



\## Projection Architecture



Authoritative for:



\- visual representation

\- computational projections

\- visualization composition



Not authoritative for:



\- computation

\- persistence

\- runtime state



Projection owns presentation.



Projection never owns truth.



\---



\## Resolve Runtime



Authoritative for:



\- Computational Universe

\- execution lifecycle

\- execution history

\- deterministic recomputation

\- Investigation Manifold construction



Not authoritative for:



\- rendering

\- workspace

\- authoring

\- persistence of Knowledge Objects



Resolve Runtime owns computation.



Nothing else.



\---



\# Ownership Rules



Every runtime shall own exactly one primary architectural concern.



No runtime shall assume ownership of another runtime's computational state.



Every runtime shall expose deterministic behavior through explicit interfaces.



Ownership conflicts shall be resolved by architectural reassignment rather than shared ownership.



\---



\# Runtime Communication



Runtimes communicate through explicit contracts.



Communication should occur by:



\- deterministic interfaces

\- published state

\- subscription mechanisms

\- execution events



Runtimes should never directly manipulate another runtime's internal state.



\---



\# Ownership Invariants



The following principles govern the runtime architecture.



\- State has exactly one owner.

\- Every runtime owns one architectural concern.

\- Projection owns presentation.

\- Resolve owns computation.

\- Knowledge owns canonical knowledge.

\- Research owns collected computational artifacts.

\- Author owns authored computational knowledge.

\- Workspace owns operator interaction.

\- Operator Session owns operator context.

\- Investigation owns investigative state.

\- Observation owns observations.



\---



\# Architectural Observations



The runtime architecture demonstrates a consistent separation of concerns.



Every runtime contributes one well-defined capability to the overall computational ecosystem.



No runtime should evolve beyond its assigned architectural authority.



When new capabilities are introduced, they should result in new runtimes rather than expanding existing ownership beyond its intended purpose.



\---



\# Relationship to Other Audit Documents



AA-001 establishes the computational philosophy.



AA-002 reconstructs the runtime architecture.



AA-003 establishes the computational ontology.



This document defines ownership boundaries across every runtime.



Subsequent audit documents describing execution pipelines and architectural invariants shall reference this ownership model as the canonical source of runtime authority.



Accordingly, this Runtime Ownership Matrix should be considered constitutional guidance for all future architectural development within the iSEES platform.



\---



\# Authoritative Subsystem and Capability Owners



This matrix supplements the runtime-level matrix with evidence-supported capability ownership. `PROPOSED` and `REQUIRES_OWNER_CONFIRMATION` identify unresolved authority; they do not authorize a new owner. Last verified commit records the local repository revision inspected, not a claim that every runtime behavior was executed.



| Logical concern | Authoritative canon | Engineering contract | Runtime or type owner | Persistence owner | Projection or UI owner | Verification owner | Prohibited alternate owners | Status | Last verified commit |
|---|---|---|---|---|---|---|---|---|---|
| Workspace selection | SC-003; SC-012 | EA-001 | `isees-ui/src/workspace/context/WorkspaceContext.tsx`; `isees-ui/src/workspace/runtime/` | Workspace runtime and authorized workspace persistence policies | `isees-ui/src/workspace/`; Overview selection context where scoped | Workspace verification and consuming surface tests | Individual workspaces or panels creating a second workspace-selection owner | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Selection Intelligence | SC-012; SC-017; SC-025 | EA-001; REX-001 for REX provenance inputs | `isees-ui/src/intelligence/selection/`; `isees-ui/src/manifold/selection/` | None as an independent intelligence database; source owners retain durable state | Existing Selection Intelligence surface | `isees-ui/tools/verification/VerifyCanonicalSelectionIntelligence.ts` and coherence verification | A second selection owner, second right panel, or discovery-owned inspector | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Operational Manifold revisions | SC-003; SC-010; SC-025 | Source-owned Manifold contracts | `isees-ui/src/manifold/engine/`; `isees-ui/src/manifold/graphTypes.ts` | Investigation/Manifold persistence boundary; exact durable owner requires runtime confirmation | Manifold projections and graph components | Manifold engine and projection verification | REX, Selection Intelligence, Research Inbox, or Studio owning revision state | `REQUIRES_OWNER_CONFIRMATION` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| REX execution | SC-025 | REX-001 | `isees_uap/rex/`; frontend client boundary `isees-ui/src/rex/` | `isees_uap/rex/repository.py`; `sqlite_repository.py`; REX migrations | Existing REX controls and Selection Intelligence/Research Inbox projections under their own authority | `isees_uap/testing/rex/` | Entity Discovery, providers, UI panels, or Research Inbox becoming a parallel execution owner | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Frontier Agent execution | SC-026 | REX-002; REX-001 | Governed REX execution plane; no separately proven active scheduler owner | Durable REX assignment/execution repositories when implemented | Existing REX audit/projection consumers | `isees_uap/testing/rex/`; future assignment verification | Resident UI loops, providers, or a parallel REX execution plane | `REQUIRES_RUNTIME_CONFIRMATION` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Entity Discovery | SC-025 | REX-001 | Existing REX owner is canonical; `isees_uap/rex/entity_discovery/` is untracked proposal evidence only | Existing REX durable execution model; no separate intelligence database authorized | Existing Selection Intelligence inspection boundary | Existing REX verification plus future authorized Entity Discovery verification | Untracked implementation as authority, REX-003, parallel discovery runtime, or second Selection Intelligence surface | `PROPOSED` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Known Object Detection | SC-008 and applicable observation/provenance canon | Domain runtime contract requires owner confirmation | `isees_uap/kod/`; KOD means Known Object Detection | KOD data/provider records under backend policy; exact persistence owner requires confirmation | Authorized observation/result consumers; no independent owner established here | `isees_uap/testing/kod/` | REX Entity Discovery or any “Knowledge Object Discovery” reinterpretation | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Observability | Applicable observation and computational-field canon | `isees_uap/observability/CONTRACT.md` | `isees_uap/observability/` | Contract-authorized source/cache owners only | Authorized downstream projections | Observability domain tests and contract verification | KOD, Resolve, REX, or UI projections owning observability computation | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Resolve | SC-001; SC-002; SC-008 | `isees-ui/src/resolve/contracts/ResolveRuntimeContract.ts` | `isees-ui/src/resolve/runtime/`; `isees-ui/src/resolve/engine/` | Resolve execution/history owner defined by its runtime contract | Resolve consumers and Selection Intelligence | `isees-ui/tools/verification/VerifyResolve*.ts` | Manifold rendering, Selection Intelligence, or REX owning Resolve computation | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Metric Intelligence | SC-017 and applicable metric canon | Source-owned metric-intelligence types and registry | `isees-ui/src/metric-intelligence/` | None as a separate truth store; source and publication owners retain durable state | Existing contextual Metric Intelligence projection/trigger | Metric Intelligence verification associated with the domain | Selection Intelligence, layers, or individual metrics creating parallel registries | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Research Inbox | SC-019; SC-025; cognitive Research Desk canon | `isees-ui/src/research/ResearchAnchorContract.ts`; EA-001 | `isees-ui/src/research/ResearchBridgeRuntime.ts`; research bridge types | Research runtime/anchor persistence boundary; exact backend owner requires confirmation | `isees-ui/src/manifold/components/ResearchInboxInstrument.tsx`; Studio consumes the same investigation inbox | Research bridge and publication verification | REX auto-publication, Studio-local duplicate inbox, or Selection Intelligence persistence | `REQUIRES_OWNER_CONFIRMATION` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Researcher-Directed Evidence Intake and Web Discovery | SC-027 | EVIDENCE-001; EA-002 | Frontend: `EvidenceWorkspace.tsx`, `CandidateEvidenceTypes.ts`, `CandidateEvidenceLifecycle.ts`, `CandidateEvidenceApi.ts`, `CandidateEvidenceRuntime.ts`, `CandidateEvidenceQuery.ts`, `EvidenceWorkspaceProjection.ts`; backend: `isees_uap/api/v1/candidate_evidence.py` and `isees_uap/candidate_evidence/` schemas, service, repository, and SQLite repository | Existing Candidate Evidence persistence; `isees_uap/research_sources/` is the carefully extended durable Research Inbox publication owner, not a Candidate Evidence or graph store | Existing EVIDENCE workspace; publication through `researchBridgeTypes.ts`, `ResearchBridgeRuntime.ts`, and `TypedResearchSourceAdapters.ts`; revision through `OperationalGraphRevision.ts` | Existing Candidate Evidence verification plus future EVIDENCE-001 deterministic verification | Parallel Evidence/Candidate stores, Web Discovery Inbox, provider or REX ownership, automatic REX hydration/publication, second Candidate Knowledge or revision system, untracked experiments as owners | `CONTRACTED_NOT_IMPLEMENTED` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Candidate Knowledge | SC-019; SC-025 | REX-001 plus domain lifecycle contracts | Knowledge Runtime and governed domain candidate adapters | Domain-authorized Candidate Knowledge/evidence repositories | Manifold, Evidence, Research Inbox, and Studio projections of shared identities | Candidate evidence and domain lifecycle verification | Persistence alone, REX execution history, or a UI projection conferring candidacy or Canon | `REQUIRES_OWNER_CONFIRMATION` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| Studio | SC-014; SC-015; Studio V1 Canon | EA-001; `isees-ui/src/studio/contracts/` | `isees-ui/src/studio/`; `isees_uap/studio/` | Studio repositories, V1 persistence, and migrations | Existing Studio surfaces | `isees_uap/testing/studio/` and Studio verification | Research Inbox, workspace, or legacy author paths creating a second Studio lifecycle owner | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |
| `.author` | SC-014; SC-015; Studio V1 Canon | `StudioV1Contract.ts`; `StudioCanonicalSerialization.ts` | Studio V1 author adapter and save orchestrator | `isees_uap/studio/v1/persistence.py`; `sqlite_store.py`; immutable revision services | Existing Studio editor, artifact family, and inspector | Studio V1 backend tests and serialization validation | REX, Research Inbox, or generic workspace persistence owning `.author` authority | `EXISTING_AND_OPERATIONAL` | `76980cf02c489c21a800c132f8e4741009ce4d05` |



Capability ownership remains singular even when persistence, computation, and projection are implemented by cooperating modules. A durable record does not transfer epistemic authority to its persistence owner, and a projection does not become a state owner.

