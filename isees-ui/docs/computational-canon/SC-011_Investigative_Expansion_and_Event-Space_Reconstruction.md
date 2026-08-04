\# ============================================================



\# SC-011



\# INVESTIGATIVE EXPANSION AND EVENT-SPACE RECONSTRUCTION



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



\# SC-011



\# Investigative Expansion and Event-Space Reconstruction



\---



\# Purpose



This canon establishes the permanent computational architecture governing how new knowledge enters iSEES.



It defines the deterministic transformation of real-world investigative artifacts into canonical Event-Space knowledge and the subsequent expansion of the Investigative Corpus and Event-Space Manifold.



The objective is simple:



\*\*New knowledge expands the investigation, not merely the database.\*\*



\---



\# Philosophy



Investigations do not grow because more documents exist.



Investigations grow because our understanding of reality becomes more complete.



Accordingly:



Artifacts are never graphed.



Artifacts reconstruct reality.



The graph is merely one deterministic computational projection of that reconstructed reality.



\---



\# Computational Principles



\## Principle 1



Reality exists independent of documentation.



\---



\## Principle 2



Artifacts describe reality.



They are not reality.



\---



\## Principle 3



The Investigative Corpus is the canonical representation of reconstructed Event-Space knowledge.



\---



\## Principle 4



The Event-Space Manifold is a deterministic computational projection of the Investigative Corpus.



\---



\## Principle 5



Every accepted artifact shall deterministically enrich the Investigative Corpus.



\---



\## Principle 6



Graphs are computed.



They are never manually authored.



\---



\# Canonical Computational Pipeline



```

World



&#x20;       ↓



Observation



&#x20;       ↓



Evidence



&#x20;       ↓



Artifact



&#x20;       ↓



Artifact Runtime



&#x20;       ↓



Evidence Extraction Runtime



&#x20;       ↓



Canonical Evidence Objects



&#x20;       ↓



Event Reconstruction Runtime



&#x20;       ↓



Canonical Event Objects



&#x20;       ↓



Corpus Runtime



&#x20;       ↓



Resolve–Dissolve Runtime



&#x20;       ↓



Graph Revision Runtime



&#x20;       ↓



Event-Space Manifold

```



\---



\# Runtime Responsibilities



Each computational stage owns one responsibility and one responsibility only.



No runtime shall duplicate another runtime's responsibilities.



\---



\# Artifact Runtime



The Artifact Runtime owns ingestion.



It preserves immutable investigative source material.



It SHALL:



\* register artifacts

\* fingerprint artifacts

\* version artifacts

\* preserve metadata

\* preserve provenance

\* maintain immutable storage



It SHALL NOT perform graph construction.



\---



\## Canonical Interface



```text

ArtifactRuntime



ingest()



register()



validate()



fingerprint()



version()



metadata()



provenance()

```



\---



\# Evidence Extraction Runtime



The Evidence Extraction Runtime transforms artifacts into canonical Evidence Objects.



Examples include:



\* radar observations

\* witness statements

\* imagery

\* telemetry

\* documents

\* engineering records

\* sensor measurements



The runtime SHALL normalize heterogeneous evidence into a common computational representation.



\---



\## Output



```

EvidenceObject



id



type



timestamp



location



source



confidence



payload

```



One artifact may produce many Evidence Objects.



\---



\# Event Reconstruction Runtime



The Event Reconstruction Runtime reconstructs historical reality.



It SHALL NOT construct graphs.



Instead it reconstructs canonical Event Objects representing the world as it existed during the observed event.



\---



\## Responsibilities



The runtime SHALL:



\* resolve entities

\* resolve relationships

\* resolve temporal context

\* resolve spatial context

\* resolve participating systems

\* resolve environmental conditions

\* preserve supporting evidence



\---



\## Canonical Event



```

CanonicalEvent



eventId



time



location



participants



assets



observations



relationships



environment



supportingEvidence

```



Canonical Events represent reconstructed reality.



Not documents.



\---



\# Corpus Runtime



The Corpus Runtime owns the Investigative Corpus.



The Investigative Corpus is the permanent computational representation of reconstructed Event-Space knowledge.



It SHALL:



\* merge Events

\* split Events

\* resolve identity

\* resolve duplicates

\* preserve lineage

\* preserve evidence provenance

\* version the corpus



The Corpus SHALL become the single source of computational truth.



\---



\## Canonical Interface



```text

CorpusRuntime



merge()



split()



resolveIdentity()



resolveDuplicates()



createRevision()



timeline()

```



\---



\# Resolve–Dissolve Runtime



The Resolve–Dissolve Runtime consumes the Investigative Corpus.



It performs deterministic computational discovery.



It SHALL:



\* compute graph topology

\* compute relationships

\* compute clusters

\* compute confidence

\* compute investigative structure



Its output SHALL always be a Graph Revision.



No upstream runtime shall create graphs.



\---



\# Graph Revision Runtime



The Graph Revision Runtime creates immutable computational revisions.



It SHALL:



\* create revisions

\* compare revisions

\* compute graph hashes

\* preserve lineage

\* preserve historical state



This runtime is governed by SC-010.



\---



\# Event-Space Manifold Runtime



The Manifold Runtime projects Graph Revisions into an interactive investigative workspace.



It owns visualization.



It SHALL NOT own storage.



It SHALL NOT own computational truth.



The Manifold is a projection.



Not the investigation itself.



\---



\# Runtime Interfaces



```typescript

interface ArtifactRuntime {



&#x20;   ingest(

&#x20;       artifact:

&#x20;           ArtifactInput,

&#x20;   ): ArtifactRecord;



}

```



```typescript

interface EvidenceExtractionRuntime {



&#x20;   extract(

&#x20;       artifact:

&#x20;           ArtifactRecord,

&#x20;   ): EvidenceObject\[];



}

```



```typescript

interface EventReconstructionRuntime {



&#x20;   reconstruct(

&#x20;       evidence:

&#x20;           EvidenceObject\[],

&#x20;   ): CanonicalEvent\[];



}

```



```typescript

interface CorpusRuntime {



&#x20;   merge(

&#x20;       events:

&#x20;           CanonicalEvent\[],

&#x20;   ): CorpusRevision;



}

```



```typescript

interface ResolveDissolveRuntime {



&#x20;   compute(

&#x20;       corpus:

&#x20;           CorpusRevision,

&#x20;   ): GraphRevision;



}

```



```typescript

interface ManifoldRuntime {



&#x20;   project(

&#x20;       revision:

&#x20;           GraphRevision,

&#x20;   ): InvestigationGraph;



}

```



\---



\# Recursive Investigative Expansion



Investigation is recursive.



Every accepted artifact expands the Investigative Corpus.



Every expanded corpus produces a new Graph Revision.



Every Graph Revision may reveal previously unknown relationships.



Those discoveries generate new investigations.



Those investigations generate new artifacts.



The computational cycle never terminates.



```

Artifact



↓



Evidence



↓



Canonical Event



↓



Investigative Corpus



↓



Resolve–Dissolve



↓



Graph Revision



↓



Event-Space Manifold



↓



Research



↓



New Artifact

```



\---



\# Computational Invariants



The following invariants SHALL always hold.



Artifacts are immutable.



Evidence Objects are immutable.



Canonical Events are immutable once committed.



Corpus revisions are immutable.



Graph Revisions are immutable.



The Event-Space Manifold is always derived from a Graph Revision.



Graphs are never manually authored.



Reality is reconstructed before computation.



The Investigative Corpus remains the single computational source of truth.



\---



\# Relationship to Other Canon



SC-001 defines Resolve–Dissolve computation.



SC-002 defines Computational Layers.



SC-003 defines the Investigation Manifold.



SC-004 defines Investigation Control.



SC-005 defines the Intention Engine.



SC-006 defines the Research Authoring Framework.



SC-007 defines the Cognitive Architecture.



SC-008 defines Deterministic Discovery and Investigative Expansion.



SC-009 defines the Manifold Instrument Architecture.



SC-010 defines Investigative Provenance and Graph Revision Architecture.



\*\*SC-011 defines how knowledge from the real world is transformed into canonical Event-Space knowledge, integrated into the Investigative Corpus, and deterministically expanded into new computational understanding through the Event-Space Manifold.\*\*



Yes. I actually think this belongs in \*\*SC-011\*\*, because it's not a UI feature or implementation detail—it's a computational principle governing how an investigation expands.



I would append a new section near the end.



\---



\# Discovery-Driven Investigative Expansion



\## Purpose



The purpose of iSEES is not merely to organize existing evidence, but to continuously expand the investigative corpus through deterministic discovery.



Every canonical entity represents a partially observed portion of reality. As entities become established within the corpus, they expose additional regions of the real-world information space that may contain relevant evidence.



Investigation therefore proceeds through computational expansion rather than investigator-directed searching.



\---



\## Discovery Profiles



Every canonical entity type SHALL define a deterministic Discovery Profile.



A Discovery Profile specifies the classes of neighboring entities, repositories, organizations, facilities, records, and information sources that are expected to exist within the operational environment of that entity.



Examples include:



\*\*Airport\*\*



\* Control Tower

\* Airport Authority

\* FAA Facilities

\* Air Traffic Control

\* Weather Services

\* NOTAM Sources

\* Fixed Base Operators

\* Emergency Services

\* Contact Entities



\*\*Monastery\*\*



\* Religious Order

\* Archive

\* Library

\* Diocese

\* Cultural Heritage Registry

\* Municipal Records

\* Historical Publications

\* Contact Entities



\*\*Military Installation\*\*



\* Command Structure

\* Radar Systems

\* Adjacent Installations

\* Contractors

\* Engineering Documentation

\* Personnel

\* Historical Records



Discovery Profiles are canonical computational knowledge and SHALL evolve as the system's ontology expands.



\---



\## Deterministic Discovery Expansion



Whenever a new canonical entity enters the corpus, the Discovery Runtime SHALL evaluate its Discovery Profile.



Rather than asking what the investigator wishes to search for, the runtime asks:



> \*\*What additional entities, repositories, organizations, facilities, records, or contacts should exist if this entity exists?\*\*



Each discovery candidate becomes a deterministic acquisition target.



Artifacts obtained from those targets enter the standard computational pipeline:



```text

Discovery Candidate



↓



Artifact Acquisition



↓



Artifact Runtime



↓



Evidence Extraction Runtime



↓



Event Reconstruction Runtime



↓



Corpus Runtime



↓



Resolve–Dissolve Runtime



↓



Graph Revision Runtime



↓



Event-Space Manifold

```



\---



\## Continuous Investigative Expansion



The manifold is not a static representation of known information.



It is a computational model of investigative completeness.



Every accepted entity has the potential to reveal additional neighboring evidence sources.



Each successful acquisition enlarges the corpus.



Each corpus revision recomputes the manifold.



The newly expanded manifold reveals additional discovery opportunities.



Investigation therefore becomes a recursive process of deterministic expansion until no further evidence-bearing neighborhoods remain unexplored.



\---



I especially like the last sentence because it captures what has been emerging across SC-010 and SC-011:



> \*\*The objective of iSEES is not to answer questions. The objective is to recursively reduce the unknown portions of Event-Space by deterministically expanding the investigative corpus.\*\*



That feels like a foundational architectural principle rather than just another feature.



