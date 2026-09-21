# SC-029 — Author Document and Investigation Manifold Reconciliation

**Status:** Normative Computational Canon

**Scope:** Existing `.author` architecture, Studio V1, and the governed Investigation Manifold boundary

**Depends on:** SC-003 Investigation Manifold; SC-010 Investigative Provenance and Graph Revision Architecture; SC-012 Computational Projection Architecture; SC-014 Computational Authoring and Narrative Architecture; SC-015 Computational Publication and Knowledge Dissemination Architecture; SC-016 Human-Computational Collaborative Authoring Architecture; SC-018 Computational Provenance and Epistemic Lineage Architecture; SC-019 Computational Knowledge Curation and Promotion Architecture; SC-020 Canonical Computational Artifact and File Extension Architecture; SC-025 REX Recursive Epistemic Exploration and Deterministic Normalization; SC-027 Researcher-Directed Evidence Intake and Web Discovery

**Adopts:** P57-UI-A23 STUDIO V1 Product Canon; EA-001 Investigation Workbench and Authoring Studio; REX-001; REX-002; EVIDENCE-001

## 1. Purpose and scope

This canon reconciles the existing `.author` implementation and Studio V1 contracts with the Investigation Manifold. It narrows ambiguous authority, identity, lifecycle, return, and provenance boundaries. It does not replace the existing author, artifact, revision, projection, AI, graph, Evidence, REX, or lifecycle owners.

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative. Where this document identifies a later-phase or unresolved decision, that text does not authorize an implementation to invent behavior.

## 2. Existing architecture adopted

1. `.author` **MUST** remain the native Computational Author Document format defined by SC-020.
2. `ComputationalAuthorDocument` **MUST** remain the browser working model owned by the existing Author runtime.
3. `SemanticDocument` **MUST** remain the saved semantic payload of Studio V1 `AuthorRevision`.
4. `ArtifactIdentity` **MUST** own durable artifact lineage, investigation binding, authorizing principal, governed profile, and current saved head.
5. `AuthorRevision` **MUST** remain an immutable saved revision with canonical semantic content, content hash, source snapshots, profile and profile version, parent lineage, and author principal.
6. Existing serializer, parser, save, projection, drafting, lifecycle, EVIDENCE, REX, and Manifold contracts **MUST** be extended in place. No parallel subsystem is authorized.

`ComputationalAuthorDocument` and `SemanticDocument` are not rival authorities. The former is the editor-independent browser working representation; the latter is the canonical saved semantic payload. A conforming save adapter **MUST** map between them deterministically, preserve stable semantic identities, reject lossy or ambiguous conversion, and create an `AuthorRevision` only after validation succeeds.

## 3. Terminology and identity

| Term or identity | Canonical meaning | Authority and cardinality |
|---|---|---|
| `.author` | Native Computational Author Document artifact | One authoritative revision lineage per `artifactId` |
| `ComputationalAuthorDocument` | Browser working model | Mutable local working state; not an authority record |
| `SemanticDocument` | Saved semantic payload | Content of exactly one immutable `AuthorRevision`; has one `documentId` |
| `ArtifactIdentity` / `artifactId` | Durable identity of the governed author artifact and its lineage | Stable across revisions and projections |
| `documentId` | Identity of the semantic document work | Distinct from `artifactId`; stable across ordinary revisions of that work |
| `AuthorRevision` / `revisionId` | Immutable save event and content state | Unique within its artifact lineage; never reused or updated in place |
| `snapshotId` | Identity of an immutable source snapshot used by drafting or revision | Not a document, artifact, or revision identity |
| `projectionId` | Identity of one governed projection build/output lineage entry | Not a source authority |
| `exportId` | Identity of an export/delivery operation or result | Not interchangeable with `projectionId` and never a source authority |
| Candidate Knowledge | Epistemic classification of reviewable proposed knowledge | Does not imply Manifold membership or acceptance |
| Manifold revision | Immutable operational Investigation Manifold state | May change only through its governed revision authority |

`documentId`, `artifactId`, `revisionId`, `snapshotId`, `projectionId`, and `exportId` **MUST** remain distinct typed roles even if legacy storage represents some of them as strings. Implementations **MUST NOT** derive authority by equating, aliasing, or substituting these identities.

One `artifactId` **MUST** own one authoritative `.author` revision lineage. An investigation **MAY** own multiple `.author` artifacts. Each such artifact **MUST** have a distinct `artifactId` and `documentId`.

## 4. Core invariants

1. A local working draft is recoverable editing state, not an authoritative record and not Candidate Knowledge.
2. A successful save atomically appends one immutable `AuthorRevision`; it **MUST NOT** mutate an earlier revision.
3. A saved `AuthorRevision` is authoritative for what the `.author` artifact contained at that revision. It is not thereby accepted Investigation Manifold knowledge.
4. `AUTHOR_REVISION` denotes saved-source lifecycle/authority. `CANDIDATE_KNOWLEDGE` denotes epistemic eligibility or classification. They are orthogonal dimensions and **MUST NOT** be treated as mutually exclusive replacements for one another.
5. Existing serialized `ArtifactIdentity.lifecycleClassification` values **MUST** be interpreted compatibly: `AUTHOR_REVISION` identifies the saved author source state; `CANDIDATE_KNOWLEDGE` identifies material admitted to candidate review. A later contract revision **SHOULD** split these dimensions explicitly; migration **MUST** be versioned and lossless.
6. Ordinary prose **MUST NOT** automatically become a claim, node, edge, Evidence item, Candidate Knowledge item, or accepted knowledge.
7. Studio, AI generators, REX, Web Discovery, and projection renderers **MUST NOT** directly mutate accepted knowledge or the active Manifold.
8. PDF, DOCX, HTML, PPTX, LaTeX, and future outputs **MUST** remain deterministic, non-authoritative projections of an exact saved revision and versioned configuration.
9. Saving, candidate extraction, review, acceptance, projection generation, export, publication, supersession, and retraction are distinct operations with distinct receipts.

## 5. Multiple `.author` documents

A Manifold **MAY** contain several `.author`-backed document artifacts. Selection and switching **MUST** identify the active `artifactId`, `documentId`, and eligible head `revisionId`; preserve unsaved work for the document being left; and fail closed if identity, authorization, investigation, or expected-head checks do not reconcile.

Visualization **MUST** permit each eligible `.author` artifact to be represented distinctly and selected by stable graph identity. It **MUST NOT** collapse documents merely because they share a profile, title, source, author, or investigation. This canon prescribes required behavior, not a particular panel, tab, route, or layout.

The existing frontend runtime's single-document-per-investigation ownership is an implementation limitation, not a canonical restriction. Code claiming multi-document conformance **MUST** remove that limitation through the existing owner rather than introduce a second document runtime.

## 6. Manifold representation

### 6.1 Node vocabulary and metadata

An eligible `.author` artifact represented in the Manifold **MUST** use the existing graph node type `ARTIFACT` and `DOCUMENT` icon/profile. A new graph node type named `AUTHOR_DOCUMENT` **MUST NOT** be introduced. The existing ingestion source label `AUTHOR_DOCUMENT`, where used as provenance, does not constitute a graph node type.

The governed metadata for an `.author`-backed `ARTIFACT` node **MUST** identify:

- `artifactBacking: ".author"` or an equivalently versioned discriminator;
- `artifactId` and `documentId`;
- the eligible `revisionId` represented by the node;
- `profile` and `profileVersion`;
- document lifecycle classification and separate knowledge eligibility/classification;
- canonical semantic `contentHash`;
- owner/authorizing principal identity;
- `investigationId`;
- provenance and upstream snapshot ancestry references sufficient for inspection;
- representation status, including current, stale, superseded, or retracted where applicable.

The graph node identity **SHOULD** remain stable for the artifact representation while its revision-qualified metadata advances. Historical revision identities and receipts **MUST** remain inspectable. A head advance **MUST NOT** silently rewrite an accepted Manifold revision: it creates a stale representation or a revision-bound candidate update, followed by governed review and a new operational Manifold revision if accepted.

### 6.2 Relationships

Implementations **MUST** reuse `REFERENCES`, `DERIVED_FROM`, `SUPPORTS`, `CONTRADICTS`, `INVESTIGATES`, and `ASSOCIATED_WITH` when their existing semantics are true. Relationship choice **MUST** be claim-specific and provenance-supported; generic document co-occurrence is insufficient.

No new relationship vocabulary is authorized merely to label an author document. A new relationship for fork, variant, edition, translation, supersession, or retraction **MAY** be standardized later only if existing edge metadata and provenance records cannot represent the required meaning without semantic distortion. Until then these document-lineage relations **MUST** be carried in governed artifact metadata/lineage records and **MUST NOT** be encoded under a misleading existing graph relationship.

## 7. Separate lifecycle dimensions

The following states belong to separate, coordinated dimensions:

| Dimension | States or events | Rule |
|---|---|---|
| Author working state | local working draft, dirty/clean, stale expected head, recoverable conflict | Never authoritative before save |
| Document revision | immutable saved `AuthorRevision`, current head, superseded revision, retracted document | Governs `.author` source lineage only |
| Knowledge review | Candidate Knowledge, proposed node/edge/claim changes, review/test, accepted, returned, rejected | Governs epistemic admission; acceptance creates a Manifold revision |
| Projection | not generated, queued, rebuilding, current, failed, stale, published, superseded, retracted | Independent of document and knowledge lifecycle |

The existing Studio lifecycle sequence—draft, Candidate Knowledge artifact, proposed Manifold candidate, review/test, accepted, returned, or rejected—**MUST** be interpreted as a review workflow, not as permission to mutate an `AuthorRevision`. Returned candidates **MAY** inform a new local draft; they **MUST NOT** reopen or edit an immutable revision. Rejected candidates remain auditable and **MUST NOT** alter accepted knowledge.

A superseded `AuthorRevision` remains an immutable historical source. Document supersession selects a later artifact or document for ordinary use without erasing the superseded identity. Retraction withdraws reliance or publication while preserving bytes, identity, reason, authority, and audit history subject to access policy. Retraction of a document does not automatically retract every accepted claim derived from it; affected claims **MUST** undergo explicit impact review. Retraction of a claim does not rewrite the source revision that recorded it.

A published projection may later be superseded or retracted independently. Projection publication, supersession, or retraction **MUST NOT** promote, supersede, retract, or otherwise mutate semantic claims automatically.

## 8. Governed return to the Manifold

Returning `.author` content to the Manifold **MUST** use this sequence:

`AuthorRevision` → deterministic candidate extraction → candidate nodes/edges/claims → provenance and frozen-source validation → researcher review → explicit acceptance or rejection → operational Manifold revision receipt.

The sequence **MUST** satisfy all of the following:

1. Extraction consumes one immutable `revisionId`, its canonical `contentHash`, and its complete frozen-source ancestry.
2. Each candidate has a stable identity, candidate kind, exact source semantic node or span, `artifactId`, `documentId`, source `revisionId`, source content hash, `investigationId`, and base Manifold revision binding.
3. Deterministic re-extraction of unchanged inputs **MUST** reproduce candidate identities or a documented replay equivalence; retry **MUST NOT** duplicate accepted effects.
4. Validation verifies source availability, authorization, frozen hashes, provenance, ancestry, endpoint identities, schema, and the still-current base Manifold revision.
5. A stale base, changed source hash, wrong investigation, missing provenance, unavailable source, or unauthorized material **MUST** reject application. Re-extraction or explicit rebase creates a new review context; it **MUST NOT** silently retarget the old candidate.
6. Review **MUST** be claim-level where claims can differ in evidence, disposition, scope, contradiction, or authority. Bundled acceptance **MUST NOT** obscure individual claim dispositions.
7. Only an explicit researcher-authorized acceptance operation may create node, edge, or claim changes.
8. All changes accepted together **MUST** apply atomically to one new immutable operational Manifold revision or have no effect.
9. The result **MUST** issue a replay-safe receipt binding operation, candidate dispositions, prior and resulting Manifold revisions and hashes, actor, time, and exact effects. Replaying the same accepted operation **MUST** return the prior outcome or a no-duplicate-effect result.
10. Studio, AI, REX, candidate extractors, and projection renderers have `CanonEffect.NONE` before the governed acceptance authority applies the revision.

Publishing a projection does not enter this sequence and **MUST NOT** promote its claims.

## 9. Circular provenance

Circular provenance **MUST** be detected across artifact, revision, source snapshot, claim, Evidence, candidate, and Manifold ancestry.

1. An `.author` revision **MUST NOT** corroborate itself, whether referenced directly or through a projection, citation, extracted candidate, later revision, or return cycle.
2. Claims derived from the same upstream frozen source are dependent and **MUST NOT** be counted as independent corroboration merely because they appear in two documents, projections, providers, or revisions.
3. Derived documents **MUST** retain transitive upstream `snapshotId` and content-hash ancestry, not only their immediate parent citation.
4. Circular reference chains **MUST** be disclosed in review and excluded from independent-support calculations.
5. Authored synthesis, opinion, and interpretation remain interpretation unless independently supported by eligible evidence.
6. AI-generated prose is never evidence merely because it appears in a saved revision, was published, or was quoted by a derived document.
7. Where ancestry is incomplete or cannot be reconciled, the candidate **MUST** fail closed for corroboration and remain reviewable with the limitation disclosed.

## 10. Bounded AI assistance

The existing bounded drafting architecture is adopted:

- source selection **MUST** be explicit as `ALL` eligible Research Inbox sources or an explicit `SUBSET`;
- researcher notes **MUST** be selected explicitly and retain their non-evidence classification;
- context assembly **MUST** be deterministic and produce a `contextHash` over ordered, authorized inputs and bounded instructions;
- generation **MUST** pass through a provider-neutral port and record provider, model, version where available, material configuration, and prompt-contract provenance;
- output **MUST** remain an unapplied granular proposal outside `.author`;
- stale context, base revision, artifact, document, source snapshot, or content hash **MUST** reject application;
- the researcher **MUST** explicitly accept or reject proposal units;
- accepted content enters `.author` only through the existing working-document and immutable save path.

The browser `StudioDraftProposal` and Studio V1 `AiDraftProposal` are two boundary views of one proposal lifecycle, not separate authorities and not grounds for a third proposal model. `StudioDraftProposal` carries browser drafting context, `documentId`, design, blocks, disclosures, and `contextHash`; `AiDraftProposal` carries durable artifact/revision binding, provider configuration provenance, granular operations, authority state, and dispositions. An adapter between them **MUST** preserve `proposalId`, artifact/document/base identity, context and source hashes, generated units, disclosures, provenance, and dispositions without silently strengthening authority.

Proposal and disposition records **MUST** be durable and auditable. Accepted AI contributions **MUST** retain node- or span-level attribution to proposal unit, provider/model/configuration provenance, source snapshot ancestry, accepting principal, and acceptance time. Later human editing **MAY** change the text but **MUST NOT** erase historical attribution. The researcher remains the authorizing principal.

## 11. Profile, design, template, branding, and format

These dimensions **MUST** remain separate:

| Dimension | Purpose | Authority restriction |
|---|---|---|
| `AuthorDocumentType` | Broad browser document kind | Does not select epistemic status or publication appearance |
| artifact `profile` / `profileVersion` | Governed semantic expectations and validation | Does not become a template or output format |
| drafting design | Proposed organization and drafting aid | Never authoritative; changes require researcher acceptance |
| `templateProfileVersion` | Versioned publication appearance | Projection-only; cannot mutate semantic content |
| branding profile | Versioned projection identity, marks, and assets | Projection-only; cannot add claims or source authority |
| output format | PDF, DOCX, HTML, PPTX, LaTeX, or future format | Transport/rendering choice only |

Governed profiles **MAY** include investigation reports, scientific papers, technical reports, research memoranda, intelligence assessments, executive briefs, op-eds, proposals, and other admitted profiles. Admission of profile vocabulary does not assert runtime availability. Custom templates and branding **MUST NOT** mutate claims, citations, evidence classification, semantic identities, provenance, or `.author` authority.

## 12. REX integration

REX **MUST** use the existing `author_candidate_knowledge` context slot; it **MUST NOT** create a parallel author context channel. Each included entry **MUST** bind `artifactId`, eligible `revisionId`, semantic `contentHash`, provenance classification, investigation, and explicit eligibility.

Only saved, revision-bound, authorized `.author` Candidate Knowledge eligible for the active investigation and REX assignment may enter this slot. Unsaved drafts, stale or retracted inputs, private or excluded sources, material marked `excludeFromAiProcessing`, and otherwise unauthorized content **MUST** be excluded.

The slot is immutable revision context. Inclusion does not make the content accepted knowledge, evidence, or Canon. REX outputs remain quarantined Candidate Knowledge, require researcher review, and retain `CanonEffect.NONE`. REX **MUST NOT** directly promote, modify, retract, or supersede accepted Manifold knowledge.

## 13. Tavily and Web Discovery integration

Raw `.author` documents, raw Research Inbox contents, and private researcher notes **MUST NOT** be sent directly to Tavily or another Web Discovery provider.

Enrichment **MUST** pass through a bounded, inspectable query/frontier-preparation stage. Its record **MUST** identify which governed fields contributed; the source artifact/revision and active Manifold revision; transformations and redactions; authorization; applicable privacy and source restrictions; provider contract version; and prepared-query hash. Only the minimum authorized query representation may leave the governed boundary.

Preparation and dispatch **MUST** honor `excludeFromAiProcessing`, privacy, authorization, retention, copyright, and source-use restrictions. A prohibited input **MUST** be excluded rather than summarized to evade its restriction.

Tavily results remain ephemeral discovery references until explicitly captured. Captured results remain Candidate Evidence under EVIDENCE-001 and SC-027, with zero automatic Canon or graph effect. Search, capture, and authored citation **MUST NOT** establish truth, corroboration, or Manifold membership.

## 14. Document relationships and identity effects

| Relationship | Required identity behavior | Canonical meaning |
|---|---|---|
| Revision lineage | Preserves `artifactId` and `documentId`; creates a new `revisionId` | Immutable successor within one authoritative lineage |
| Fork | Creates a new `artifactId`, new `documentId`, and initial `revisionId`; preserves origin ancestry | Independently advancing semantic work derived from a named source revision |
| Variant | Creates a new `artifactId`, new `documentId`, and initial `revisionId`; preserves derivation ancestry | Independently maintained content variant, not a mere projection style |
| Edition | Creates a new `artifactId`, new `documentId`, and initial `revisionId`; preserves edition-of ancestry | Independently governed semantic edition; a formatting-only edition is instead a projection and creates neither identity |
| Translation | Preserves `artifactId` and `documentId` only when it is a deterministic projection; an editable or independently reviewed semantic translation creates a new `artifactId`, `documentId`, and initial `revisionId` with translation ancestry | Distinguishes rendered language from a new semantic work |
| Supersession | Creates no identity by itself; the superseding target retains its own existing identities | Governance relation selecting a later revision/artifact/projection for ordinary use without erasure |
| Retraction | Creates no replacement identity by itself and preserves all retracted identities | Withdrawal with reason and audit preservation, not deletion |

Fork, variant, edition, and semantic-translation creation **MUST** bind the exact source `artifactId`, `documentId`, `revisionId`, and content hash. Implementations **MUST NOT** infer these relationships solely from textual similarity.

## 15. Failure and recovery

Failures **MUST** be isolated by authority boundary:

- save failure creates no partial revision and does not advance the artifact head;
- concurrent or stale-head save failure preserves both the authoritative head and recoverable local draft;
- extraction failure creates no partially eligible candidate set;
- validation or stale-base failure produces no Manifold effect and preserves candidates for inspection or explicit rerun;
- review/application failure creates no partial Manifold revision;
- projection failure does not invalidate its `AuthorRevision` or successful sibling projections;
- publication, supersession, or retraction failure does not silently alter document or knowledge state;
- AI, REX, or Tavily failure **MUST NOT** fall through to an ungoverned provider or mutation path.

Retry **MUST** be idempotent for identical operation identity and inputs. Changed source, context, configuration, head, or Manifold base requires a new versioned operation or explicit rebase. Recovery records **MUST** state what remains authoritative, recoverable, stale, rejected, or unapplied.

## 16. Audit requirements

Audit records **MUST** be immutable or tamper-evident and sufficient to reconstruct:

- all distinct identities and investigation/owner bindings;
- working-draft base and save attempts without treating draft content as authority;
- revision parentage, canonical serialization version, content hash, and frozen source ancestry;
- candidate extraction version, stable candidate identities, exact node/span origins, and base Manifold revision;
- validation results, circular-provenance findings, review decisions, reasons, actor, and time;
- atomic Manifold application and replay-safe receipt, including explicit zero effect on failure or rejection;
- AI proposal context, provider/model/configuration provenance, units, attribution, and dispositions;
- REX eligibility and exclusion decisions;
- Web Discovery frontier preparation, disclosed contributing fields, redactions, dispatch, capture, and zero-effect status;
- projection configuration, renderer, parent revision/hash, output hash, publication, supersession, and retraction.

Secrets, hidden provider reasoning, and unauthorized private content **MUST NOT** be copied into audit logs. Redaction **MUST** retain a governed indication that protected material influenced or was excluded from an operation where disclosure is permitted.

## 17. V1 and later-phase boundaries

V1 **MUST** preserve the existing Studio V1 profiles and contracts, immutable `AuthorRevision` saves, frozen sources, bounded proposals, deterministic projections, and governed knowledge boundary. A V1 implementation **MAY** expose only one actively edited document at a time, but it **MUST NOT** claim that an investigation canonically owns only one `.author` artifact.

Full multi-document switching, generalized profile families, durable cross-document lineage UI, semantic translation workflows, richer branding/template catalogs, and new relationship vocabulary are later-phase capabilities unless an existing verified owner already supplies them. Later phases **MUST** extend the owners named here and preserve all invariants.

## 18. Unresolved decisions

The following remain explicitly unresolved and **MUST NOT** be guessed by implementation:

1. The versioned field names and schema migration that split current `ArtifactIdentity.lifecycleClassification` into document-source state and knowledge classification.
2. The canonical durable schema and storage owner for `.author`-backed Manifold node metadata and transitive ancestry indexes.
3. Whether fork, variant, edition, translation, supersession, and retraction require new graph relationship enum members after metadata/lineage representation is tested against existing semantics.
4. The repository-wide durable adapter/version mapping between browser `StudioDraftProposal` and Studio V1 `AiDraftProposal`.
5. The exact UI interaction and concurrency model for multiple active/recoverable browser documents.
6. Which additional profile names are admitted to a later runtime and their profile-specific validation contracts.
7. Whether `exportId` identifies a request, delivery, immutable output, or a versioned combination; it remains distinct from `projectionId` in every case.

## 19. Explicit non-goals

This canon does not:

- implement runtime behavior, storage, UI, provider, renderer, or migration code;
- replace `.author`, `ComputationalAuthorDocument`, `SemanticDocument`, `ArtifactIdentity`, `AuthorRevision`, or projection architecture;
- create a parallel author, artifact, revision, AI proposal, graph, Evidence, REX, or lifecycle subsystem;
- create an `AUTHOR_DOCUMENT` graph node type;
- redefine general Manifold, Evidence, REX, Web Discovery, publication, or projection canon;
- make prose, saved revisions, AI output, publications, or provider results automatically authoritative knowledge;
- prescribe a specific multi-document UI layout;
- authorize changes to INTENTION, MarketMind, or unrelated systems.

## 20. Adoption map

| Responsibility | Existing owner to adopt or extend |
|---|---|
| Browser working document and semantic nodes | `isees-ui/src/author/**` (`ComputationalAuthorDocument`, Author runtime, serializer/parser) |
| Saved semantic contract, artifact identity, immutable revision, projection contract | `isees-ui/src/studio/contracts/**`; `isees_uap/studio/v1/**` |
| Browser bounded drafting | `isees-ui/src/studio/drafting/**` (`StudioDraftProposal`, context assembly, provider-neutral client) |
| Studio lifecycle compatibility | `isees_uap/studio/**`; lifecycle states remain review workflow inputs, not a new authority model |
| Manifold vocabulary and representation | `isees-ui/src/manifold/graphTypes.ts`; `isees-ui/src/manifold/engine/manifoldTypes.ts`; governed Manifold revision owner |
| Candidate Evidence and Web Discovery | `contracts/evidence/EVIDENCE-001_*`; `isees_uap/candidate_evidence/**`; SC-027 |
| REX context and quarantine | `contracts/rex/REX-001_*`; `contracts/rex/REX-002_*`; `isees_uap/rex/**`, including `author_candidate_knowledge` |
| Authoring and publication principles | SC-014, SC-015, SC-016, SC-018, SC-019, SC-020, SC-025, and P57-UI-A23 |
| Workbench/Studio responsibility boundary | EA-001 |

**Canonical conclusion:** `.author` is the authoritative saved source for its own artifact lineage, never an automatic authority over the Investigation Manifold. Content returns from a revision only as provenance-complete, revision-bound candidates, and only explicit researcher-governed acceptance may produce a new operational Manifold revision.
