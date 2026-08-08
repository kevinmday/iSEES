\# ============================================================

\# KOM

\# COMPUTATIONAL KNOWLEDGE CURATION ENGINEERING DESIGN

\#

\# Engineering Design

\#

\# iSEES Computational Knowledge Runtime

\#

\# P53B

\#

\# ============================================================



\# 1. PURPOSE



This document defines the engineering realization of the

Computational Knowledge Curation Architecture established in

SC-014.



Where SC-014 defines the conceptual architecture and operator

workflow, this document specifies the runtime ownership,

component responsibilities, data flow, and implementation

contracts required to realize Knowledge Promotion within iSEES.



This document is implementation-oriented.



\---



\# 2. ENGINEERING OBJECTIVES



The implementation shall



• preserve deterministic computation



• maintain complete provenance



• prevent accidental promotion



• support immutable Knowledge Objects



• support composite Knowledge Objects



• separate temporary research from permanent knowledge



• provide future AI+ integration points



• remain independent of persistence and networking



\---



\# 3. ARCHITECTURAL RESPONSIBILITIES



The Knowledge Runtime owns



• Knowledge Objects



• active Knowledge Object



• Knowledge navigation



• selection



• inspection



• promotion state



• revision



The runtime never owns



• React state



• persistence



• storage



• networking



• AI inference



\---



\# 4. COMPUTATIONAL PIPELINE



Operator



↓



Investigation Graph



↓



Research Inbox



↓



Knowledge Promotion Workspace



↓



Knowledge Object Factory



↓



Knowledge Runtime



↓



Knowledge Library



↓



Author Runtime



↓



Projection Runtime



↓



Publication



Each stage has exactly one computational responsibility.



\---



\# 5. KNOWLEDGE PROMOTION WORKSPACE



The Knowledge Workspace is the engineering realization of

Knowledge Mode.



Unlike Manifold, it does not visualize investigative topology.



Unlike Research, it does not collect candidate artifacts.



Instead it performs computational curation.



Primary operator actions include



Review Candidates



Assign Knowledge Type



Edit Metadata



Assign Confidence



Assign Tags



Create Relationships



Compose Composite Objects



Promote



Revise



Archive



\---



\# 6. RUNTIME OWNERSHIP



KnowledgeObjectRuntime owns



KnowledgeRuntimeState



KnowledgeObject collection



Active Knowledge Object



Selection



Inspection



Presentation state



Promotion workflow



Revision notifications



React components observe the runtime.



React never owns computational knowledge.



\---



\# 7. RESEARCH INTEGRATION



Research remains a temporary staging area.



Research Inbox entries represent



Candidate Knowledge Artifacts.



A Research artifact possesses no permanent computational identity.



Promotion creates that identity.



Research therefore becomes



collect



review



discard



promote



rather than



store forever.



\---



\# 8. KNOWLEDGE PROMOTION



Promotion always originates from operator intent.



The workflow becomes



Research Candidate



↓



Review



↓



Assign Knowledge Type



↓



Assign Metadata



↓



Assign Confidence



↓



Assign Relationships



↓



Promote



↓



Knowledge Object



No automatic promotion exists.



No background promotion exists.



Knowledge creation always represents an intentional operator act.



\---



\# 9. KNOWLEDGE OBJECT FACTORY



Knowledge Objects are constructed through a dedicated factory.



Responsibilities include



Identity generation



Lifecycle initialization



Revision initialization



Confidence initialization



Provenance construction



Relationship initialization



Capability assignment



Payload attachment



The factory guarantees deterministic creation of canonical

Knowledge Objects.



\---



\# 10. COMPOSITE KNOWLEDGE OBJECTS



Multiple Research artifacts may participate in a single

Knowledge Object.



Example



Research



USS Nimitz



Radar



FLIR



Pilot



↓



Knowledge Object Factory



↓



Knowledge Object



"Nimitz Encounter"



Composite objects preserve provenance back to every originating

Research artifact.



No provenance is discarded.



\---



\# 11. PROVENANCE



Every promoted Knowledge Object records



originating Research artifact



source graph node



source graph edge



source investigation



promotion timestamp



promotion revision



operator attribution



Subsequent revisions extend provenance rather than replacing it.



\---



\# 12. KNOWLEDGE LIBRARY



The Knowledge Library contains every promoted Knowledge Object.



It functions as the canonical computational memory of iSEES.



Objects remain independently addressable.



Knowledge Objects never require their originating graph node

to remain active.



\---



\# 13. USER INTERFACE RESPONSIBILITIES



Persistent instruments remain unchanged.



Explorer



Displays Knowledge Objects.



Inspector



Displays the currently selected computational element.



Knowledge Workspace



Performs promotion, curation, composition,

and lifecycle management.



This prevents duplication of operator instruments across

workspace modes.



\---



\# 14. COMPONENT RESPONSIBILITIES



KnowledgeWorkspace



Primary computational curation surface.



KnowledgePromotionPanel



Displays Research candidates awaiting promotion.



KnowledgeObjectFactory



Constructs immutable Knowledge Objects.



KnowledgeObjectRuntime



Owns runtime state.



KnowledgeExplorer



Observes runtime.



KnowledgeInspector



Observes runtime.



ResearchInboxInstrument



Supplies promotion candidates.



\---



\# 15. ENGINEERING SEQUENCE



Operator clicks graph node



↓



Research Inbox receives candidate



↓



Operator enters Knowledge Mode



↓



Knowledge Promotion Workspace displays candidate



↓



Operator selects computational type



↓



Operator edits metadata



↓



Operator assigns confidence



↓



Operator reviews provenance



↓



Knowledge Object Factory constructs object



↓



Knowledge Runtime registers object



↓



Knowledge Library updates



↓



Research candidate marked promoted or removed



↓



Explorer refreshes



↓



Inspector refreshes



All transitions occur through deterministic runtime operations.



\---



\# 16. FUTURE AI+ INTEGRATION



AI+ does not operate directly upon Research.



AI+ operates upon curated Knowledge Objects.



Future AI+ capabilities include



Relationship discovery



Contradiction analysis



Knowledge expansion



Hypothesis generation



Knowledge summarization



Knowledge clustering



Computational manifold expansion



Because every object has undergone intentional promotion,

AI+ reasons over curated computational knowledge rather than

temporary investigative collections.



\---



\# 17. EXTENSIBILITY



The architecture supports future additions including



Knowledge validation workflows



Peer review



Digital signatures



Multi-operator promotion



Promotion approval queues



Version branching



Knowledge merging



Knowledge conflict resolution



Knowledge publication pipelines



No architectural changes are required to support these

capabilities.



\---



\# 18. IMPLEMENTATION PRINCIPLES



1\. Promotion is deterministic.



2\. Promotion is intentional.



3\. Knowledge Objects are immutable after creation except through

controlled revision.



4\. Research remains temporary.



5\. Knowledge remains persistent.



6\. Explorer and Inspector remain persistent operator

instruments.



7\. Knowledge Workspace performs computational curation rather

than graph exploration.



8\. Knowledge Object Factory is the sole constructor of canonical

Knowledge Objects.



9\. Runtime owns computation.



10\. React observes computation.



11\. AI+ operates upon curated knowledge rather than temporary

research collections.



12\. Computational Knowledge becomes the permanent memory layer of

the iSEES platform.



\---



\# 19. IMPLEMENTATION ROADMAP



P53B



Knowledge Promotion Workspace



P53C



Knowledge Object Factory



P53D



Promotion Pipeline



Research → Knowledge



P53E



Knowledge Library



P54



Knowledge Workspace visualization



P55



Knowledge → Author integration



P56



AI+ Knowledge reasoning



\---



\# END

\# ============================================================

