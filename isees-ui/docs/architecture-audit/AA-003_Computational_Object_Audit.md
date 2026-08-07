\# AA-003 — Computational Object Audit



\*\*Architectural Audit Series\*\*



\*\*Status:\*\* Living Document  

\*\*Classification:\*\* Canonical Architecture Audit  

\*\*Revision:\*\* 0.1 (Foundation)



\---



\# Mission



This document reconstructs the canonical computational object model of the iSEES platform.



Its purpose is to establish every first-class computational object that exists within the computational universe prior to implementation of the Resolve–Dissolve Computational Engine (RDC).



Unlike runtime architecture, which defines ownership, the Computational Object Audit defines \*\*what exists\*\* within the computational universe.



Every future computational subsystem shall operate upon these canonical objects.



\---



\# Purpose



The iSEES platform is fundamentally object-oriented.



Every investigation is composed of computational objects.



Every runtime owns computational objects.



Every computational process transforms computational objects.



Every persistent artifact represents computational objects.



This document establishes the complete ontology of those objects.



It answers:



> \*\*What are the canonical computational objects of iSEES?\*\*



\---



\# Architectural Philosophy



A Computational Object is a first-class architectural entity.



It possesses:



\- identity

\- lifecycle

\- ownership

\- provenance

\- revision history

\- computational meaning



A Computational Object is not:



\- a UI widget

\- a rendering primitive

\- a database record

\- a serialization format



Persistent artifacts may represent computational objects.



Visual projections may display computational objects.



Neither defines the object.



The computational object remains canonical.



\---



\# Canonical Object Categories



The computational universe currently consists of the following object domains.



\---



\## Observation Objects



Mission



Represent observations entering the computational universe.



Examples



\- Sensor Observation

\- Human Observation

\- Imported Observation

\- Derived Observation



Primary Owner



Observation Runtime



Lifecycle



Observation



↓



Normalization



↓



Validation



↓



Promotion Candidate



↓



Knowledge Object



\---



\## Knowledge Objects



Mission



Represent canonical knowledge.



Examples



\- Person

\- Event

\- Organization

\- Facility

\- Location

\- Artifact

\- Narrative

\- Hypothesis

\- Custom Object



Primary Owner



Knowledge Runtime



Lifecycle



Promotion



↓



Knowledge Object



↓



Revision



↓



Projection



↓



Reference



\---



\## Relationship Objects



Mission



Represent deterministic computational relationships.



Relationships are first-class computational objects.



They are not graphical connections.



They represent computational conclusions produced by investigation.



Examples



\- Observed At

\- Associated With

\- Supports

\- Contradicts

\- Derived From

\- References

\- Investigates

\- Similarity



Primary Owner



Knowledge Runtime



Future Computational Consumer



Resolve Runtime



Lifecycle



Construction



↓



Revision



↓



Projection



↓



Author Reference



\---



\## Investigation Objects



Mission



Represent investigative state.



Examples



\- Investigation

\- Investigation Session

\- Investigation Metadata



Primary Owner



Investigation Runtime



\---



\## Workspace Objects



Mission



Represent operator workspace state.



Examples



\- Workspace

\- Layout

\- Instrument State



Primary Owner



Workspace Runtime



\---



\## Session Objects



Mission



Represent operator sessions.



Examples



\- Operator Session

\- Active Session

\- Session Metadata



Primary Owner



Operator Session Runtime



\---



\## Research Objects



Mission



Represent collected investigative artifacts.



Examples



\- Research Anchor

\- Candidate Reference

\- Collection



Primary Owner



Research Runtime



\---



\## Projection Objects



Mission



Represent computational projections.



Examples



\- Node Projection

\- Edge Projection

\- Timeline Projection

\- Cluster Projection

\- Author Projection

\- Workspace Projection



Primary Owner



Projection Architecture



Projection objects own presentation.



They never own computation.



\---



\## Author Objects



Mission



Represent authored computational knowledge.



Examples



\- Author Document

\- Author Node

\- Reference Node

\- Citation

\- Embedded Relationship



Primary Owner



Author Runtime



\---



\## Computational Universe Objects



Mission



Represent execution inputs.



Examples



\- Computational Layer

\- Layer Group

\- Temporal Context

\- Investigative Scale

\- Execution Configuration



Primary Owner



Resolve Runtime



\---



\## Execution Objects



Mission



Represent deterministic computation.



Examples



\- Execution

\- Execution Context

\- Execution Revision

\- Execution History

\- Execution Event



Primary Owner



Resolve Runtime



\---



\## Investigation Manifold



Mission



Represent the emergent computational topology produced by Resolve–Dissolve Computation.



The Investigation Manifold is itself a first-class computational object.



It is computed.



It is inspectable.



It is reproducible.



It is never manually authored.



Primary Owner



Resolve Runtime



\---



\## Hypothesis Objects (Planned)



Mission



Represent computational hypotheses generated from investigation.



Primary Owner



Future Hypothesis Runtime



\---



\## Intention Objects (Planned)



Mission



Represent computational intentions produced through deterministic analysis.



Primary Owner



Future Intention Runtime



\---



\# Computational Object Characteristics



Every first-class computational object should possess the following architectural characteristics.



\---



\## Identity



Every object possesses a unique computational identity.



\---



\## Ownership



Every object has exactly one primary owning runtime.



Ownership must never be ambiguous.



\---



\## Lifecycle



Every object participates in a deterministic lifecycle.



Lifecycle transitions are owned by the object's runtime.



\---



\## Revision



Every object participates in revision history.



Revision tracking is deterministic.



\---



\## Provenance



Every object preserves computational provenance.



The origin of every object must be inspectable.



\---



\## Projection



Objects may be projected into one or more visual or computational forms.



Projection never changes canonical object identity.



\---



\## Persistence



Objects may be serialized into persistent artifacts.



Persistence is a representation.



Not the object itself.



\---



\# Canonical Object Relationships



Objects participate in deterministic relationships.



Examples include:



Observation



↓



Knowledge Object



↓



Investigation



↓



Resolve Computation



↓



Investigation Manifold



↓



Projection



↓



Research Anchor



↓



Author Reference



↓



Publication



\---



\# Relationship Philosophy



Relationships deserve special architectural consideration.



Within iSEES:



Relationships are first-class computational objects.



They possess:



\- identity

\- provenance

\- revision

\- computational history

\- inspection

\- projection

\- publication

\- author references



Relationships are therefore computational artifacts rather than graphical edges.



\---



\# Computational Object Invariants



Every computational object shall satisfy the following principles.



\- Possess identity.

\- Possess ownership.

\- Possess provenance.

\- Participate in deterministic revision.

\- Support inspection.

\- Support projection.

\- Remain computationally canonical.

\- Never derive identity from visualization.

\- Never derive identity from persistence.



\---



\# Relationship to Other Audit Documents



AA-001 establishes the computational philosophy.



AA-002 establishes runtime ownership.



This document establishes the canonical ontology of the computational universe.



Subsequent Architectural Audit documents build upon these object definitions when reconstructing runtime ownership, computational pipelines, and Resolve–Dissolve execution.



Accordingly, this document should be considered the canonical computational object reference for the iSEES platform immediately prior to implementation of the Resolve–Dissolve Computational Engine.

