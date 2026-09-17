# SC-027 — Researcher-Directed Evidence Intake and Web Discovery

**Status:** Approved computational and product canon

**Category:** Researcher-Directed Evidence Intake, Discovery, and Governed Publication Architecture

**Scope:** iSEES EVIDENCE, researcher uploads, researcher-entered URLs, manual node and edge proposals, provider-neutral Web Discovery, Research Inbox publication, REX integration, and governed Manifold revision

**Depends on:** SC-003 Investigation Manifold; SC-008 Deterministic Discovery and Investigative Expansion; SC-010 Investigative Provenance and Graph Revision; SC-018 Computational Provenance and Epistemic Lineage; SC-019 Computational Knowledge Curation and Promotion; SC-025 REX Recursive Epistemic Exploration and Deterministic Normalization; SC-026 REX Frontier Agents

## 1. Authority and canonical purpose

This document establishes the authoritative computational and product canon for researcher-directed evidence intake and public-web discovery in iSEES.

iSEES SHALL provide a complete researcher-directed investigation workflow that does not require paid REX discovery and substantially reduces the need to leave iSEES for ordinary research tasks. The free pathway combines:

1. iSEES Web Discovery;
2. researcher evidence uploads;
3. researcher-entered URLs;
4. manual node and edge proposals;
5. EVIDENCE inspection and classification;
6. explicit Research Inbox publication; and
7. governed Manifold revision.

REX remains an optional governed acceleration layer. REX is not the exclusive pathway by which artifacts, evidence, nodes, edges, claims, or sources enter an investigation.

## 2. Governing principle

> “Many pathways may discover or introduce evidence. Only explicit governed human action may convert that material into investigation knowledge.”

Every pathway MUST preserve the following progression:

```text
Discovery
→ Candidate Evidence
→ Researcher Review
→ Explicit Publication
→ Candidate Knowledge
→ Governed Revision
```

No stage may be silently skipped. Discovery is not Evidence acceptance. Evidence acceptance is not publication. Publication is not Canon. Candidate Knowledge is not Manifold membership. Only an authorized governed revision may create a new Manifold revision.

## 3. Free research capability

The free researcher-directed workflow MUST be genuinely useful and MUST support:

- researcher-directed public-web searches;
- search results displayed inside iSEES;
- direct URL capture;
- uploads of documents, images, audio, video, spreadsheets, datasets, and structured files;
- researcher-authored notes;
- manual node proposals;
- manual edge proposals;
- source and provenance inspection;
- evidence classification;
- explicit Research Inbox publication; and
- deterministic Manifold revision workflows.

Operational storage, bandwidth, abuse-prevention, provider, or quota limits MAY exist. Such limits MUST be explicit, attributable to their operational or economic cause, and MUST NOT be represented as epistemic requirements.

## 4. Canonical intake pathways

All authorized intake pathways converge on the existing EVIDENCE architecture. They MUST preserve origin, provenance, investigation identity, and revision context.

### 4.1 Researcher upload

A researcher MAY upload a supported document, image, audio recording, video, spreadsheet, dataset, or structured file. The system MUST preserve the original file identity where permitted, media type, size, content hash, upload authority, upload time, investigation identity, revision identity, and any supplied annotation. An upload initially becomes Candidate Evidence.

### 4.2 Researcher-entered URL

A researcher MAY enter a URL as a direct source reference. iSEES MUST distinguish the URL reference from fetched metadata, a permitted excerpt, a content hash, an archived copy, and researcher annotation. A URL initially becomes Candidate Evidence only when captured; entering or previewing it does not establish its claims.

### 4.3 Manual node proposal

A researcher MAY author a proposed node from reviewed material or direct research knowledge. The proposal MUST preserve the proposing authority, supporting Evidence references, asserted type, aliases, notes, investigation identity, revision identity, and time. A manual node proposal is Candidate Knowledge and MUST NOT create a node in the active Manifold before governed approval and revision.

### 4.4 Manual edge proposal

A researcher MAY author a proposed edge between identified endpoints. The proposal MUST preserve endpoint identities, proposed relationship type and direction, temporal or qualifying information, supporting Evidence, researcher rationale, investigation identity, revision identity, and time. A manual edge proposal MUST NOT create or modify an edge in the active Manifold before governed approval and revision.

### 4.5 Web Discovery

A researcher MAY perform public-web research through provider-neutral Web Discovery. Results remain discovery references until deliberately captured. Captured results become Candidate Evidence and enter the same review lifecycle as other intake material.

### 4.6 REX-derived observations

REX MAY introduce governed observations, extracted candidates, contradictions, normalizations, or Research Vectors. These outputs MUST enter the existing EVIDENCE review architecture with REX execution lineage and MUST remain review-only until explicit human action advances them.

### 4.7 Existing Canon references

A researcher MAY reference existing Canon as contextual or supporting material. The reference MUST retain the canonical object identity and revision. Referencing Canon MUST NOT silently copy its authority to a new claim, node, edge, or Evidence item.

An upload or URL initially becomes Candidate Evidence. It does not establish authenticity, accuracy, source authority, canonical identity, factual truth, node existence, edge existence, or Manifold membership.

## 5. iSEES Web Discovery

iSEES Web Discovery is the provider-neutral, researcher-directed public-web research capability embedded inside the iSEES investigative workspace.

> “iSEES Web Discovery does not replace general search providers. It places conventional researcher-directed web research inside a governed evidence workflow.”

Google MAY be one provider adapter, but the canonical subsystem is Web Discovery, not iSEES-Google. The architecture MAY support Google, Bing or equivalent providers, public registries, government repositories, academic indexes, news indexes, specialist repositories, and researcher-entered URLs.

Providers MUST NOT own investigation state, the Evidence lifecycle, Candidate Knowledge, Research Inbox publication, Manifold mutation, canonical identity, or provenance policy. Provider adapters MUST normalize only what their declared contracts permit and MUST NOT strengthen a provider result into an epistemic conclusion.

## 6. Search context and provenance

A search session MAY originate from:

- the investigation generally;
- a selected node;
- a selected edge;
- a selected artifact;
- a contradiction;
- a Research Vector; or
- a researcher-authored query.

Contextual search MUST bind:

- investigation ID;
- active Manifold revision ID;
- selected-object type;
- selected-object ID;
- researcher query;
- provider;
- request timestamp; and
- search-session ID.

Each result SHOULD retain:

- provider;
- query;
- rank;
- title;
- URL;
- domain;
- provider-supplied snippet;
- timestamp;
- selected-object context;
- investigation identity;
- revision identity;
- capture status; and
- researcher disposition.

Search results are discovery references, not established Evidence or Knowledge. A result MUST NOT automatically create a node, create an edge, enter the Research Inbox, mutate the Manifold, increase confidence, resolve a contradiction, become Canon, trigger REX, or invoke another paid provider.

## 7. EVIDENCE ownership and origin

EVIDENCE is the universal review workspace for material introduced through uploads, URL capture, Web Discovery, REX, repository adapters, researcher notes, Canon references, and future authorized intake mechanisms. Implementations MUST extend this existing workspace and MUST NOT invent a parallel EVIDENCE subsystem.

Material origins MUST remain visibly distinct. At minimum, the system MUST distinguish:

- researcher-supplied evidence;
- web-discovered evidence;
- REX-derived observations;
- Canon references;
- deterministically derived information; and
- unverified external claims.

Origin labels describe lineage; they do not assign truth or authority.

## 8. Evidence lifecycle

An illustrative lifecycle includes:

```text
DISCOVERED
CAPTURED
PENDING_REVIEW
UNDER_REVIEW
ACCEPTED_FOR_RESEARCH
REJECTED
DUPLICATE
PUBLISHED_TO_RESEARCH
SUPERSEDED
WITHDRAWN
```

Engineering MUST reuse and extend the existing authoritative lifecycle vocabulary where it already exists. This canon does not authorize a parallel status model. Mapping, transition guards, terminality, and reopening behavior MUST be discovered from authoritative code and contracts before implementation.

Every transition MUST be attributable and auditable. A transition record MUST preserve the Evidence identity, prior and resulting state, acting authority, timestamp, reason or disposition where required, investigation identity, revision context, and relevant source or operation receipt.

## 9. Research Inbox publication boundary

The Research Inbox is an explicit researcher-controlled publication boundary. No Web Discovery result, upload, URL, or REX result may enter it automatically.

Publication requires deliberate researcher action and MUST preserve:

- Evidence identity;
- origin;
- provenance;
- source reference;
- researcher notes;
- investigation identity;
- revision identity;
- publication timestamp; and
- publication receipt.

Research Inbox publication creates or advances reviewable research material according to the existing authoritative contracts. It does not itself establish Canon, truth, canonical identity, or active Manifold membership.

## 10. Manifold mutation boundary

Discovery and Evidence intake MUST NOT directly mutate the active Manifold. A Manifold change requires an explicit governed revision operation:

```math
M_{r+1} = \operatorname{Revise}(M_r, P_{\mathrm{approved}}, \Gamma)
```

where:

- $M_r$ is the active Manifold at revision $r$;
- $P_{\mathrm{approved}}$ is the explicitly approved publication set;
- $\Gamma$ is the applicable deterministic governance configuration; and
- $M_{r+1}$ is a new immutable revision.

The prior revision MUST remain recoverable and inspectable. Revision creation MUST preserve approval authority, inputs, deterministic configuration, results, rejected proposals, and provenance sufficient to reproduce or explain the transition.

## 11. Relationship to REX

Web Discovery is researcher-directed conventional search. REX is governed contextual outward exploration from selected nodes, edges, or research state and MAY perform entity resolution, contradiction detection, normalization, and Research Vector generation.

Both pathways MUST converge on the same existing EVIDENCE review architecture. REX MUST NOT own a separate evidence repository, Research Inbox, publication workflow, or Manifold mutation engine. REX acceleration does not bypass researcher review, publication, or governed revision.

## 12. Local and derived intelligence

Existing origin concepts MUST be preserved where applicable:

- `KNOWN_LOCALLY`;
- `REX_DISCOVERED`;
- `DETERMINISTICALLY_DERIVED`; and
- `RESEARCH_VECTOR`.

`WEB_DISCOVERED` is a proposed origin concept. Its exact enumeration, serialization, compatibility behavior, and ownership require existing-code and contract discovery before implementation. This document does not authorize an incompatible duplicate enumeration.

Discovered or derived intelligence MUST NOT silently overwrite local intelligence. Conflicts MUST remain visible as contradictions with both claims, their origins, provenance, temporal context, and dispositions inspectable.

## 13. Cost canon

Researcher-directed intake SHOULD remain free whenever external and infrastructure costs are effectively zero. Cost accounting MUST distinguish:

- free local upload;
- free researcher-authored entry;
- free direct URL reference;
- provider-funded or quota-funded search;
- metered provider cost;
- storage or retrieval cost;
- REX cost;
- iSEES governance fee;
- contingency authorization;
- final charge; and
- released authorization.

If Web Discovery incurs a nonzero provider cost, its estimate MUST be visible before invocation. Any contingency authorization MUST be explicit, bounded, and reconciled into a final charge and released authorization. Cancellation and failure MUST preserve actual incurred cost and release unused authorization according to the governing cost contract.

Paid processing buys speed, reach, and computational labor. It does not purchase greater epistemic authority. A paid provider, paid REX execution, or iSEES fee MUST NOT increase truth status, confidence, admission priority, or Canon authority merely because payment occurred.

## 14. AI authority

AI MAY assist with query formulation, summarization, entity-name normalization, duplicate detection, source comparison, metadata extraction, contradiction identification, suggested nodes, suggested edges, and Research Vectors.

AI MUST NOT independently:

- establish truth;
- accept or reject Evidence;
- declare canonical identity;
- publish to the Research Inbox;
- mutate the Manifold;
- replace source content with a summary;
- conceal uncertainty;
- authorize expenditure;
- activate persistent monitoring; or
- erase contradictions.

AI output MUST be visible, attributable, and traceable to its inputs. Summaries and extracted metadata MUST remain distinguishable from source content and MUST preserve uncertainty and model or execution lineage.

## 15. Copyright and source integrity

iSEES MUST distinguish URL reference, metadata, permitted excerpt, researcher annotation, content hash, archived copy, and researcher-owned uploaded material. These representations MUST NOT be conflated.

A search result does not grant permission to reproduce or permanently archive source content. Provider terms, copyright, privacy, authentication, robots policies, and repository-specific rules MUST be respected. Capture and retrieval behavior MUST be limited by applicable authorization and policy. Where content cannot be retained, iSEES SHOULD preserve a lawful source reference and permitted metadata sufficient for provenance without implying archival possession.

## 16. Duplicate and identity handling

Intake review MUST compare candidates, where applicable, against canonicalized URLs, content hashes, provider or repository source IDs, existing Evidence, existing nodes, artifact identities, aliases, and existing candidate records.

Possible governed outcomes include:

- reuse of an existing record;
- attachment of a new source;
- an alias proposal;
- creation of a new version;
- preservation of a contradiction; or
- explicit researcher resolution.

Duplicate detection MUST NOT silently merge distinct claims, sources, versions, or identities. Merge and identity decisions MUST preserve provenance and researcher authority.

KOD retains its existing exclusive meaning: **Known Object Detection**. KOD MUST NOT be reinterpreted as general knowledge discovery or Evidence deduplication.

## 17. Observability and operation receipts

Every discovery and intake operation SHOULD produce a structured receipt containing:

- operation ID;
- investigation ID;
- revision ID;
- researcher or session authority;
- selected context;
- intake pathway;
- provider;
- query or source;
- timing;
- results returned;
- results captured;
- results rejected;
- Candidate Evidence created;
- Research Inbox publications;
- Manifold effects;
- estimated cost;
- actual cost;
- iSEES fee;
- final charge; and
- cancellation or error status.

The `Manifold effects` field MUST explicitly record no effect when no governed revision occurred. A completed operation with no accepted results remains a valid inspectable outcome and MUST NOT be rewritten as failure merely because it produced no accepted result.

## 18. Stale response protection

Discovery and intake operations MUST bind to their originating investigation and revision. Before publication, the system MUST verify:

```math
I_{\mathrm{response}} = I_{\mathrm{active}}
```

and, where revision coherence is required:

```math
R_{\mathrm{response}} = R_{\mathrm{active}}
```

If either required equality fails, publication MUST fail closed or require an explicit governed rebase or renewed review. Stale results MAY remain available for audit or review but MUST NOT silently affect current state.

## 19. User-facing promise

> “Search the public web, upload your own evidence, and build your investigation without paying for REX. Invoke REX only when you want governed automated discovery at a clearly disclosed cost.”

> “Research freely. Govern everything. Invoke REX when its expected value is worth its visible cost.”

Product behavior, entitlement language, and cost presentation MUST remain consistent with these promises.

## 20. Implementation governance

Before implementation, engineering MUST perform read-only discovery of:

- existing EVIDENCE frontend ownership;
- existing Evidence backend ownership;
- existing three-lane Evidence contracts;
- Candidate Evidence lifecycle;
- upload routes and persistence;
- URL and artifact representations;
- Research Inbox publication;
- revision authority;
- Selection Intelligence integration;
- provider abstractions;
- cost receipts;
- provenance types; and
- verification tools.

Existing authoritative code SHALL be extended in place. Discovery findings MUST identify the canonical owner for each responsibility before any new schema, route, store, component, enumeration, or transition is introduced.

The following are explicitly prohibited:

- parallel EVIDENCE workspaces;
- separate Web Discovery Research Inboxes;
- REX-owned Evidence stores;
- provider-owned graphs;
- second Manifold publication workflows;
- duplicated lifecycle vocabularies;
- Google-specific domain models; and
- automatic Evidence-to-Canon pipelines.

## 21. Required implementation sequence

Implementation SHALL proceed in this order:

1. Perform read-only discovery.
2. Identify the canonical Candidate Evidence structure and lifecycle.
3. Complete uploads through existing EVIDENCE.
4. Complete direct URL capture.
5. Complete manual node and edge proposals.
6. Define provider-neutral Web Discovery contracts.
7. Implement deterministic offline fixtures.
8. Integrate Web Discovery into EVIDENCE.
9. Preserve origin and provenance.
10. Integrate explicit Research Inbox publication.
11. Verify governed Manifold revisions.
12. Add live providers only after cost, licensing, privacy, and attribution review.
13. Route REX observations through the same EVIDENCE boundary.
14. Verify that no pathway automatically mutates Canon or the Manifold.

Later steps MUST NOT be used to bypass unresolved ownership, lifecycle, provenance, cost, or authority questions from earlier steps. Deterministic offline fixtures MUST validate provider-neutral behavior before live-provider semantics are allowed to influence the product.

## 22. Final acceptance invariants

A conforming implementation MUST prove all of the following:

1. **Evidence without REX:** Evidence may enter an investigation without invoking REX.
2. **In-workspace research:** Ordinary public-web research can occur inside iSEES.
3. **Provider neutrality:** Google is an adapter rather than the domain model.
4. **Discovery boundary:** Search results remain unreviewed discovery references until deliberate capture.
5. **Candidate boundary:** Captures remain Candidate Evidence until researcher review.
6. **Human publication:** Publication requires deliberate governed human action.
7. **Revision authority:** Manifold mutation requires a governed revision producing a new immutable revision.
8. **REX review boundary:** REX results remain review-only and cannot bypass EVIDENCE.
9. **Provenance:** Origin, source, operation, context, authority, and revision provenance are preserved.
10. **Visible contradictions:** Conflicting local, discovered, and derived intelligence remains visible until governed resolution.
11. **Distinct origins:** Researcher-supplied, web-discovered, REX-derived, Canon-referenced, deterministic, and unverified material remains distinguishable.
12. **Equal epistemic authority:** Paid services have no greater truth authority than free pathways.
13. **Cost disclosure:** Nonzero estimates are disclosed before invocation and actual charges remain inspectable.
14. **Bounded AI:** AI cannot publish, mutate, spend, or declare truth.
15. **Single ownership:** Existing authoritative owners are extended rather than duplicated.
16. **Useful free workflow:** A researcher can search, capture URLs, upload varied evidence, write notes, propose nodes and edges, review provenance, publish deliberately, and initiate governed revision without paid REX.
17. **No silent progression:** No pathway silently skips Discovery, Candidate Evidence, Researcher Review, Explicit Publication, Candidate Knowledge, or Governed Revision.
18. **Stale safety:** Stale responses cannot silently affect the active investigation or revision.

Failure of any invariant is a conformance failure, not an optional product limitation.

## 23. Conclusion

iSEES is a governed environment where ordinary investigation can occur from discovery through revision. EVIDENCE uploads and Web Discovery form the free researcher-directed foundation. REX provides optional governed acceleration.

All pathways converge on the same human-controlled EVIDENCE, Research Inbox, and Manifold revision boundaries. Many mechanisms may broaden what a researcher can see; none may silently decide what the investigation knows.
