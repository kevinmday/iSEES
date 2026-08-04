\# ============================================================



\# SC-010



\# INVESTIGATIVE PROVENANCE AND GRAPH REVISION ARCHITECTURE



\#



\# SYSTEM CANON



\#



\# Status:



\# CANONICAL



\#



\# Author:



\# Kevin M. Day



\#



\# ============================================================



\# SC-010



\# Investigative Provenance and Graph Revision Architecture



\---



\# Purpose



This canon establishes the permanent computational architecture governing investigative provenance within iSEES.



It defines how investigations evolve through immutable graph revisions, how research artifacts preserve analytical state, and how every conclusion remains reproducible regardless of future computational evolution.



The objective is simple:



\*\*Nothing of investigative value is ever lost.\*\*



Every authored observation shall preserve the complete computational context from which it was produced.



\---



\# Philosophy



Scientific investigation is not merely the accumulation of facts.



It is the preservation of reasoning.



A research paper does not simply cite a graph node.



It cites a moment of understanding.



Accordingly, Research Anchors are \*\*not bookmarks\*\*.



They are immutable records of an investigator's computational observation.



\---



\# Computational Principles



\## Principle 1



Graphs evolve.



Observations do not.



\---



\## Principle 2



Every computational state is reproducible.



\---



\## Principle 3



Every research artifact preserves sufficient information to reconstruct the original analytical context.



\---



\## Principle 4



Historical observations are never modified.



Future understanding is layered upon them.



\---



\## Principle 5



Presentation state is valuable.



Computational provenance is mandatory.



\---



\# Canonical Architecture



```

Investigation



&#x20;       │



&#x20;       ▼



Resolve–Dissolve Computation



&#x20;       │



&#x20;       ▼



Graph Revision



&#x20;       │



&#x20;       ▼



Research Anchor



&#x20;       │



&#x20;       ▼



Research Artifact



&#x20;       │



&#x20;       ▼



Published Knowledge

```



\---



\# Graph Revision



A Graph Revision represents a complete immutable computational state of an investigation.



It is \*\*not\*\* merely a version number.



It is the deterministic result of:



\* evidence

\* computational layers

\* Resolve–Dissolve computation

\* runtime parameters



at one point in investigative history.



\---



\## Responsibilities



A Graph Revision SHALL:



\* preserve investigation state

\* preserve computational state

\* preserve provenance

\* permit deterministic reconstruction

\* support historical comparison

\* support future replay



\---



\## Canonical Structure



```

GraphRevision



revisionId



investigationId



parentRevisionId



createdAt



graphHash



layerSet



resolveParameters



runtimeVersion



canonVersion



metadata

```



\---



\# Revision Lineage



Every Graph Revision SHALL maintain lineage.



```

Revision 1



&#x20;     │



&#x20;     ▼



Revision 2



&#x20;     │



&#x20;     ▼



Revision 3



&#x20;     │



&#x20;     ▼



Revision 4

```



Lineage permits:



\* investigation history

\* computational replay

\* revision comparison

\* provenance inspection



\---



\# Graph Hash



Every Graph Revision SHALL possess a deterministic graph hash.



The hash uniquely identifies the computational graph produced by the Resolve–Dissolve engine.



Equivalent investigations SHALL produce equivalent graph hashes.



\---



\# Research Anchor



A Research Anchor represents an immutable investigative observation.



It binds authored knowledge to a specific Graph Revision.



Research Anchors SHALL NEVER reference only graph objects.



They SHALL reference graph objects \*\*within a Graph Revision\*\*.



\---



\# Responsibilities



Research Anchors SHALL preserve:



\* computational provenance

\* observational context

\* authored intent

\* investigative history



\---



\# Canonical Structure



```

ResearchAnchor



anchorId



investigationId



revisionId



graphObjectId



graphObjectType



snapshot



provenance



createdAt



createdBy



metadata

```



\---



\# Snapshot



Snapshot preserves what the investigator observed.



It exists to reconstruct the original analytical experience.



Snapshot SHALL preserve:



```

camera



projection



viewport



zoom



selection



focusedNode



focusedEdge



activeWorkspace



displayFilters



visibleLayers



statistics



evidenceSnapshot

```



Snapshot exists for human reconstruction.



\---



\# Provenance



Provenance preserves why the observation existed.



It enables deterministic replay.



Provenance SHALL preserve:



```

graphHash



layerSet



resolveParameters



parentRevision



runtimeVersion



canonVersion



softwareVersion



timestamp

```



Provenance exists for computational reconstruction.



\---



\# Immutable Observations



Research Anchors SHALL NEVER be modified after creation.



If investigation knowledge changes:



the Graph Revision changes.



The Anchor remains historically correct.



\---



\# Current Resolution



An Anchor may optionally expose current investigative state.



```

Historical Observation



↓



Current Resolution

```



Current Resolution SHALL NOT overwrite the historical observation.



Instead it provides:



```

latestRevision



currentGraphObject



confidenceDelta



clusterDelta



resolutionStatus

```



\---



\# Resolution States



A Research Anchor may resolve as:



```

UNCHANGED



UPDATED



MERGED



SPLIT



DISSOLVED



UNRESOLVED

```



Historical provenance remains unchanged regardless of current status.



\---



\# Research Artifacts



Research Artifacts SHALL reference Research Anchors.



They SHALL NOT directly reference graph objects.



This guarantees:



\* historical stability

\* computational replay

\* deterministic provenance

\* future compatibility



\---



\# Living Documents



Research documents are computationally alive.



Selecting an Anchor SHALL permit restoration of:



\* graph revision

\* viewport

\* camera

\* layer configuration

\* evidence context

\* computational provenance



The investigator returns to the original analytical moment.



\---



\# Computational Diff



Graph Revisions SHALL support deterministic comparison.



Comparison SHALL identify:



\* added nodes

\* removed nodes

\* added edges

\* removed edges

\* confidence changes

\* topology evolution

\* narrative evolution



Diffs compare investigations.



They do not modify investigations.



\---



\# Workspace Persistence



All investigation workspaces SHALL operate against Graph Revisions.



Workspace transitions SHALL preserve:



\* revision

\* selection

\* focus

\* investigative context



The operator changes perspective.



The investigation remains identical.



\---



\# Runtime Responsibilities



The Graph Runtime SHALL own Graph Revision creation.



The Research Bridge SHALL consume Graph Revisions.



The Research Runtime SHALL preserve Graph Revisions.



Authoring SHALL reference Graph Revisions.



No subsystem shall independently manufacture revision identifiers.



\---



\# Canon Versioning



Research provenance SHALL preserve:



\* Runtime Version

\* Software Version

\* Canon Version



This permits future investigators to determine which computational doctrine produced an observation.



Changes to canonical computation SHALL NEVER invalidate historical research.



\---



\# Deterministic Guarantees



Given:



\* identical evidence

\* identical computational layers

\* identical Resolve–Dissolve parameters

\* identical runtime

\* identical canon



the system SHALL reproduce the identical Graph Revision.



\---



\# Computational Invariants



The following invariants SHALL always hold.



A Graph Revision is immutable.



Research Anchors are immutable.



Historical observations are immutable.



Current Resolution is mutable.



Presentation state never replaces provenance.



Provenance never replaces presentation state.



Nothing of investigative value is discarded.



\---



\# Relationship to Other Canon



SC-001 defines Resolve–Dissolve computation.



SC-002 defines computational layers.



SC-003 defines the Investigation Manifold.



SC-004 defines Investigation Control.



SC-005 defines the Intention Engine.



SC-006 defines the Research Authoring Framework.



SC-007 defines the Cognitive Architecture.



SC-008 defines Deterministic Discovery and Investigative Expansion.



SC-009 defines the Manifold Instrument Architecture.



\*\*SC-010 defines how every investigative observation is preserved, reproduced, and revisited throughout the lifetime of an investigation.\*\*



