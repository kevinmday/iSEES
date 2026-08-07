\# AA-004 — Runtime Ownership Matrix



\*\*Architectural Audit Series\*\*



\*\*Status:\*\* Living Document  

\*\*Classification:\*\* Canonical Architecture Audit  

\*\*Revision:\*\* 0.1 (Foundation)



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

