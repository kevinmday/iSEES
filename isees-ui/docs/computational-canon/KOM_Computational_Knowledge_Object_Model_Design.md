\# Computational Knowledge Object Model (KOM)



\## Engineering Design Document



\### Working Draft



\*\*Status:\*\* Design Exploration

\*\*Purpose:\*\* Discover and refine the Computational Knowledge Object Model prior to canonical adoption.



\---



\# 1. Introduction



The Computational Knowledge Object Model (KOM) is the in-memory computational representation of authored knowledge within iSEES.



It is not an editor.



It is not a document.



It is not a file format.



It is the live computational object graph from which all authoring, reasoning, publication, and visualization are derived.



The persisted `.author` artifact is the serialized representation of the KOM.



Presentation layers such as Lexical operate upon projections of the KOM rather than directly manipulating persisted storage.



\---



\# 2. Design Objectives



The KOM shall:



\* preserve computational knowledge independently of presentation

\* remain editor-independent

\* preserve provenance by design

\* support deterministic reasoning

\* support multiple publication targets

\* support multiple compositions

\* support computational intelligence

\* support future extension without schema redesign



\---



\# 3. Architectural Philosophy



Traditional document systems place text at the center of the architecture.



The KOM places knowledge at the center.



Human-readable narrative becomes one projection of computational knowledge rather than the primary artifact.



Consequently:



Knowledge exists independently of presentation.



Presentation communicates knowledge.



The researcher works within presentation while the platform preserves knowledge.



\---



\# 4. Runtime Position



The runtime architecture becomes:



.author Artifact



↓



Deserialize



↓



Computational Knowledge Object Model (KOM)



↓



Projection Runtime



↓



Presentation Model (DOM)



↓



Lexical Editor



↓



Researcher



The DOM is projected from the KOM.



The `.author` artifact is the serialized persistence of the KOM.



\---



\# 5. Root Object



The root object is the Knowledge Artifact.



KnowledgeArtifact



The Knowledge Artifact owns every computational object contained within the author's work.



No object exists independently of a Knowledge Artifact.



\---



\# 6. Architectural Domains



The Knowledge Artifact is organized into six primary domains.



Identity



Knowledge



Composition



Intelligence



Publication



History



Each domain maintains a distinct computational responsibility.



\---



\# 7. Identity Domain



The Identity Domain uniquely identifies the artifact.



Responsibilities include:



\* artifact identifier

\* owner

\* creation time

\* modification time

\* revision

\* schema version

\* permissions

\* dependencies



Identity remains stable regardless of presentation.



\---



\# 8. Knowledge Domain



The Knowledge Domain contains computational knowledge.



This domain contains semantic objects rather than presentation objects.



Examples include:



Observations



Evidence



Artifacts



Hypotheses



Events



Locations



Organizations



Facilities



Persons



Narratives



Timelines



Citations



Models



Equations



Relationships



Knowledge persists independently of presentation.



\---



\# 9. Composition Domain



The Composition Domain defines intentional arrangements of knowledge.



Knowledge exists only once.



Compositions reference knowledge.



Examples of compositions include:



Research Report



Book



Executive Summary



Presentation



Notebook



Public Summary



Multiple compositions may coexist within a single Knowledge Artifact while sharing identical computational knowledge.



\---



\# 10. Composition Objects



Compositions are constructed from Composition Objects.



Initial object families include:



Section



Heading



Narrative Block



List



Table



Image



Figure



Diagram



Equation Block



Timeline Block



Code Block



Quote



Embed



Separator



Composition Objects define presentation rather than knowledge.



\---



\# 11. Knowledge Objects



Every semantic entity derives from KnowledgeObject.



Every KnowledgeObject shall preserve:



Identity



Metadata



Relationships



Provenance



Revision



Annotations



Future semantic objects inherit these capabilities automatically.



\---



\# 12. Reference Objects



Composition Objects never directly own knowledge.



Instead they reference computational knowledge through Reference Objects.



Examples include:



ObservationReference



EvidenceReference



ArtifactReference



HypothesisReference



TimelineReference



CitationReference



NarrativeReference



Reference Objects remain first-class computational objects.



\---



\# 13. Relationship Objects



Relationships are computational objects rather than simple pointers.



Each relationship defines:



Source



Target



Relationship Type



Metadata



Weight



Confidence



Revision



Relationships therefore become inspectable computational entities.



\---



\# 14. Intelligence Domain



The Intelligence Domain preserves computational collaboration.



Examples include:



Reasoning Sessions



Instrument Invocations



Generated Proposals



Review Results



Expansion Results



Questions



Recommendations



Accepted Suggestions



Rejected Suggestions



The Intelligence Domain records computational assistance without replacing authorial intent.



\---



\# 15. Publication Domain



The Publication Domain contains publication definitions rather than publication artifacts.



Examples include:



README



Book



Website



Slides



PDF



DOCX



HTML



Each publication definition stores:



Publication Bridge



Target



Style



Configuration



Revision



Publications remain projections.



\---



\# 16. History Domain



The History Domain preserves computational evolution.



Examples include:



Revision



Timestamp



Author



Reason



Affected Objects



History records computational evolution rather than visual editing operations.



\---



\# 17. Multiple Compositions



The KOM intentionally separates knowledge from composition.



One Knowledge Artifact may contain multiple independent compositions.



Example:



Knowledge Artifact



↓



Knowledge



↓



Research Report



↓



Executive Summary



↓



Book



↓



Presentation



↓



Website



Each composition references identical computational knowledge.



Knowledge therefore exists once while presentation varies.



\---



\# 18. Projection Principle



Presentation is always projected.



The projection sequence becomes:



Knowledge



↓



Composition



↓



Projection Runtime



↓



Presentation Model



↓



Human Interface



Editors never own canonical knowledge.



\---



\# 19. Serialization Principle



The KOM is independent of persistence.



The `.author` artifact serializes the entire Knowledge Artifact.



JSON is the preferred serialization mechanism because it is:



\* human inspectable

\* deterministic

\* schema-driven

\* version-control friendly

\* naturally aligned with the existing iSEES architecture



The serialization format shall never dictate the runtime object model.



The runtime object model defines the serialization.



\---



\# 20. Guiding Principles



The following principles govern future KOM evolution.



1\. Knowledge precedes presentation.



2\. Presentation never owns knowledge.



3\. Composition expresses authorial intent.



4\. Knowledge is never duplicated unnecessarily.



5\. References are computational objects.



6\. Relationships are computational objects.



7\. Every computational object possesses persistent identity.



8\. Provenance is preserved throughout the object graph.



9\. Computational intelligence operates upon the KOM rather than presentation models.



10\. Publication projects the KOM into human-readable artifacts.



\---



\# 21. Open Design Questions



The following architectural questions remain intentionally unresolved.



Should Knowledge Artifacts contain complete computational knowledge or preferentially reference account-owned manifolds?



How should offline authoring interact with remotely expanded manifolds?



What merge semantics govern Knowledge Objects?



How are embedded artifacts versioned?



How are distributed Knowledge Artifacts synchronized?



Should computational signatures become first-class identity objects?



How should partial loading be supported for very large artifacts?



These questions will guide subsequent design iterations before formal canonical adoption.



\---



\# 22. Design Summary



The Computational Knowledge Object Model establishes a computational architecture in which knowledge exists independently of editors, file formats, and publication targets.



The `.author` artifact persists the KOM.



Projection runtimes present the KOM.



Computational intelligence reasons over the KOM.



Publication disseminates the KOM.



The KOM therefore becomes the computational center of gravity for the entire iSEES authoring ecosystem.



