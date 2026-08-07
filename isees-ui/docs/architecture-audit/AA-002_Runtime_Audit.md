\# AA-002 — Runtime Audit



\*\*Architectural Audit Series\*\*



\*\*Status:\*\* Living Document  

\*\*Classification:\*\* Canonical Architecture Audit  

\*\*Revision:\*\* 0.1 (Foundation)



\---



\# Mission



This document reconstructs the complete runtime architecture of iSEES.



Its purpose is to establish explicit ownership boundaries for every runtime prior to implementation of the Resolve–Dissolve Computational Engine.



Rather than documenting implementation details, this audit answers a fundamental architectural question:



> \*\*Which runtime owns what?\*\*



Every future subsystem shall derive its responsibilities from this ownership model.



\---



\# Purpose



The runtime architecture of iSEES has evolved incrementally throughout multiple engineering packages.



Individual runtimes have been introduced as the computational platform matured.



This document reconstructs those runtimes into a single architectural model.



Specifically it documents:



\- runtime responsibilities

\- runtime ownership

\- runtime dependencies

\- runtime boundaries

\- computational authority

\- lifecycle ownership

\- architectural interactions



The objective is to eliminate ambiguity before implementation of Resolve–Dissolve Computation.



\---



\# Architectural Philosophy



Every runtime exists for a single purpose.



A runtime owns state.



A runtime manages lifecycle.



A runtime exposes deterministic services.



A runtime does \*\*not\*\* own another runtime's responsibilities.



Ownership should be explicit.



Responsibilities should never overlap.



The architecture therefore favors clear separation over convenience.



\---



\# Runtime Inventory



The current runtime architecture consists of the following major subsystems.



\---



\## Operator Session Runtime



\### Mission



Own the operator's active investigative session.



\---



\### Responsibilities



\- Session lifecycle

\- Active operator session

\- Session state

\- Session coordination



\---



\### Owns



\- Operator Session

\- Session revision

\- Session lifecycle



\---



\### Never Owns



\- Knowledge Objects

\- Computation

\- Rendering

\- Projection



\---



\### Depends On



\- Workspace Runtime

\- Investigation Runtime



\---



\## Workspace Runtime



\### Mission



Own the current operator workspace.



\---



\### Responsibilities



\- Workspace state

\- Active workspace

\- Layout

\- Instrument composition

\- Workspace lifecycle



\---



\### Owns



\- Workspace state

\- Layout state

\- Active instruments



\---



\### Never Owns



\- Investigation computation

\- Knowledge

\- Projection

\- Author documents



\---



\### Depends On



\- Operator Session Runtime



\---



\## Investigation Runtime



\### Mission



Own the active investigation.



\---



\### Responsibilities



\- Investigation lifecycle

\- Investigation state

\- Active investigation

\- Investigation revision



\---



\### Owns



\- Investigation

\- Investigation metadata

\- Investigation revision



\---



\### Never Owns



\- Computational execution

\- Projection

\- Rendering

\- Workspace



\---



\### Depends On



\- Knowledge Runtime

\- Observation Runtime



\---



\## Research Runtime



\### Mission



Own computational research collection.



\---



\### Responsibilities



\- Research Inbox

\- Research Anchors

\- Collection workflow

\- Candidate references



\---



\### Owns



\- Research Anchors

\- Inbox state

\- Anchor lifecycle



\---



\### Never Owns



\- Knowledge Objects

\- Author documents

\- Resolve computation



\---



\### Depends On



\- Investigation Runtime



\---



\## Knowledge Runtime



\### Mission



Own canonical Computational Knowledge Objects.



\---



\### Responsibilities



\- Knowledge Objects

\- Promotion

\- Object lifecycle

\- Object revision

\- Knowledge persistence



\---



\### Owns



\- Knowledge Objects

\- Knowledge revisions

\- Knowledge metadata



\---



\### Never Owns



\- Workspace

\- Rendering

\- Resolve execution



\---



\### Depends On



\- Observation Runtime



\---



\## Observation Runtime



\### Mission



Own computational observations.



\---



\### Responsibilities



\- Observation lifecycle

\- Observation ingestion

\- Observation normalization

\- Observation provenance



\---



\### Owns



\- Observations

\- Observation metadata

\- Observation revision



\---



\### Never Owns



\- Knowledge promotion

\- Projection

\- Workspace



\---



\### Depends On



\- External corpus

\- Sensor ingestion



\---



\## Author Runtime



\### Mission



Own computational authoring.



\---



\### Responsibilities



\- Author documents

\- Document lifecycle

\- References

\- Computational provenance

\- Projection into editable form



\---



\### Owns



\- .author documents

\- Author references

\- Author metadata

\- Author revision



\---



\### Never Owns



\- Knowledge Objects

\- Computational execution

\- Investigation state



\---



\### Depends On



\- Research Runtime

\- Projection Architecture



\---



\## Resolve Runtime (Planned)



\### Mission



Own execution of Resolve–Dissolve Computation.



\---



\### Responsibilities



\- Computational execution

\- Execution lifecycle

\- Computational state

\- Computational history

\- Execution events

\- Deterministic recomputation



\---



\### Owns



\- Computational Universe

\- Execution state

\- Execution revision

\- Execution history



\---



\### Never Owns



\- Rendering

\- Projection

\- Workspace

\- Author documents

\- Knowledge persistence



\---



\### Depends On



\- Investigation Runtime

\- Knowledge Runtime

\- Observation Runtime



\---



\# Runtime Dependency Model



The runtime hierarchy is intentionally layered.



```text

Operator Session Runtime



↓



Workspace Runtime



↓



Investigation Runtime



↓



Resolve Runtime



↓



Knowledge Runtime



↓



Observation Runtime



↓



Projection Runtime



↓



Research Runtime



↓



Author Runtime

```



This hierarchy represents architectural dependency rather than execution order.



No runtime should violate its dependency boundaries.



\---



\# Runtime Ownership Principles



Every runtime must satisfy the following principles.



\- Own exactly one architectural concern.

\- Maintain deterministic state.

\- Expose deterministic behavior.

\- Never duplicate ownership.

\- Never own presentation.

\- Never perform another runtime's responsibilities.



\---



\# Runtime Interaction



Runtimes communicate through explicit architectural boundaries.



Interactions should occur through well-defined runtime contracts.



Direct ownership transfer between runtimes should be avoided.



Instead, runtimes publish state while dependent runtimes consume it.



\---



\# Runtime Lifecycle



Every runtime is expected to provide:



\- Initialization

\- Ready state

\- Active state

\- Revision tracking

\- Subscription model

\- Deterministic shutdown



Lifecycle management should remain consistent across all runtime implementations.



\---



\# Architectural Observations



The runtime architecture demonstrates a consistent engineering pattern.



Every runtime:



\- owns a single domain

\- manages deterministic state

\- exposes revision tracking

\- supports subscriptions

\- avoids presentation logic

\- avoids computational overlap



This consistency forms one of the defining architectural characteristics of the iSEES platform.



\---



\# Relationship to Other Audit Documents



AA-001 establishes the computational philosophy.



This document establishes runtime ownership.



AA-003 will establish ownership of computational objects.



AA-004 will formally compare runtime ownership boundaries.



AA-005 will reconstruct the computational execution pipeline.



Together these documents establish the complete runtime architecture of iSEES immediately prior to implementation of the Resolve–Dissolve Computational Engine.

