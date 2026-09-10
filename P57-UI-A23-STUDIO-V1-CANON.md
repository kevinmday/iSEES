# P57-UI-A23 — STUDIO V1 Product Canon

Status: FINAL NORMATIVE CANON

Authority: P57-UI-A23

Scope: STUDIO V1 product behavior and governance
Out of scope: implementation detail and modification of INTENTION Mode

## 1. Normative language and scope

The terms **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative. V1 requirements are binding for any implementation claiming STUDIO V1 conformance. Capabilities explicitly marked V2 are deferred and MUST NOT be presented as implemented V1 behavior.

STUDIO MUST be the sole AI-assisted authoring environment in iSEES. It MUST transform researcher-selected investigation material into governed, traceable artifacts. It MUST NOT alter System Canon, investigation evidence, deterministic analytical results, Research Inbox sources, or the source systems from which those materials were captured.

STUDIO MAY create Candidate Knowledge artifacts and publication packages, but those outputs MUST remain on the governed side of the knowledge boundary described below.

## 2. Authoritative source

Each artifact MUST have exactly one authoritative structured `.author` source. The `.author` source MUST contain semantic content and stable semantic identities; it MUST NOT be merely a copy of rendered text.

PDF, DOCX, HTML, LaTeX, bibliography or citation manifests, and provenance packages MUST be deterministic child projections of one exact saved `.author` revision plus explicit, versioned projection configuration. A child projection MUST identify its parent artifact, parent revision, source content hash, projection format, renderer version, configuration hash, and output hash. Child projections MUST NOT become independent authorities, accept edits that bypass `.author`, or be used to infer a new authoritative revision.

## 3. Artifact identity and revision

An artifact MUST receive a stable artifact identity that survives every revision, projection, export, publication, supersession, and recovery operation.

The active editing state MUST be an unsaved working draft until an explicit save succeeds. A successful save MUST atomically append one immutable `.author` revision, assign its monotonic revision identity, record its parent revision when one exists, and record a content hash over its canonical semantic representation. Saved revisions MUST NOT be updated in place.

Revision lineage MUST be complete and traversable. Equivalent canonical semantic input and hashing rules SHOULD produce the same content hash. Identity, timestamps, and other explicitly non-content metadata MUST be governed consistently and MUST NOT be silently omitted from or added to the hash domain.

A failed save MUST create no partial authoritative revision, MUST NOT advance the artifact head, and MUST NOT mark the working draft clean. Retry MUST operate from the preserved working draft and declared expected head.

## 4. Automatic child synchronization

Saving a new `.author` revision MUST automatically enqueue regeneration of every enabled child projection for that revision. Unsaved keystrokes MUST NOT trigger regeneration. Regeneration MUST use only the saved parent revision and frozen configuration.

Every child projection MUST expose one of these states with respect to its parent revision:

- `NOT_GENERATED`: no build has been requested or completed;
- `QUEUED`: a build request is durably accepted;
- `REBUILDING`: the projection is actively being built;
- `CURRENT`: a successful output matches the current saved parent revision;
- `STALE`: a successful output exists but belongs to an older saved revision or configuration;
- `FAILED`: the requested build failed without replacing the last successful output;
- `SUPERSEDED`: a later governed projection or publication has replaced it for ordinary use;
- `PUBLISHED`: the exact immutable projection was explicitly published;
- `RETRACTED`: the exact published projection was explicitly withdrawn while its audit record remains.

Failure of one projection MUST be isolated from every other projection and from the saved `.author` revision. The last successful projection MUST remain recoverable. State transitions MUST be explicit, auditable, and must not claim `CURRENT` until identity and hashes reconcile.

Automatic regeneration MUST NOT mean automatic download, distribution, export to an external system, or publication.

## 5. V1 artifact profiles

STUDIO V1 MUST provide governed profiles for:

1. Investigation Report.
2. Executive Brief.
3. Scientific Paper.
4. Intention Hypothesis Assessment.

Each profile MUST define versioned semantic section expectations, validation rules, and enabled projections without becoming a second document authority. The architecture MAY admit additional profiles later, but the product MUST NOT claim that an admitted or designed profile is implemented until its full contract and acceptance verification exist.

## 6. Scientific and academic capability

The Scientific Paper profile and shared authoring model MUST support formal sections, claims, quotations, footnotes, appendices, and supplementary material. It MUST support complete structured citations and bibliographies, including author, title, container, publisher, date, identifiers, locator, access information, source snapshot, and explicit missing-field status where applicable.

V1 MUST support APA, Chicago, and IEEE output styles through versioned style configuration and MUST permit additional styles without changing the `.author` authority. BibTeX, RIS, and CSL-JSON import or export MAY be enabled where a verified adapter exists. Unsupported interoperability MUST be stated explicitly.

The semantic model MUST support LaTeX-style inline and display mathematics; numbered equations; stable equation identities; variables; units; assumptions; derivations; and cross-references. It MUST support figures and tables with stable identities, captions, alt text, source attribution, semantic data or asset identity, and deterministic lineage.

Missing metadata MUST remain explicit in authoring, validation, and output; it MUST NOT be silently guessed or hidden. AI MUST NEVER fabricate citations, DOI values, authors, quotations, page locators, dates, equations, data, measurements, or results. Proposed material lacking verified source support MUST be labeled unsupported and MUST remain unapplied.

## 7. Research Inbox source selection

STUDIO V1 MUST support these distinct drafting inputs:

- Use Entire Research Inbox: the complete eligible projection for the active Investigation, independent of presentation filters;
- Use selected Research Inbox items: an explicit set of stable source-anchor identities;
- Researcher notes: explicitly selected authored material that is instruction or context, not evidence unless separately governed as evidence.

Every drafting operation MUST consume an immutable source snapshot. The snapshot MUST preserve exact source identity, investigation, workspace, kind, revision or execution or projection identities where available, captured representation, capture time, availability, provenance, sensitivity policy, classification, and a deterministic hash.

Later Research Inbox changes MUST NOT silently change a proposal, working draft, or saved revision. `Refresh Sources` MUST be an explicit command. It MUST present a difference review, MUST preserve the prior snapshot, and, when accepted into authoritative content, MUST create a new source snapshot and new `.author` revision.

Sources MUST retain their `canonical`, `candidate`, `experimental`, `external`, availability, and provenance classifications. Selection or AI use MUST NOT promote or erase those classifications.

## 8. AI drafting

STUDIO V1 MUST support commands to build an outline, draft selected sections, draft a complete artifact, and identify unsupported claims, contradictions, assumptions, missing evidence, and incomplete citations.

Every AI output MUST be an unapplied proposal held outside the authoritative document. The researcher MUST be able to accept or reject proposed units granularly. Acceptance MUST verify the active artifact, base revision, source snapshot, and proposal identity before applying changes.

AI MUST NOT automatically apply proposals, save revisions, regenerate by changing source content, export, download, distribute, publish, modify evidence, execute deterministic computations, change System Canon, or change INTENTION. AI MUST NOT be treated as a source merely because it generated prose.

For auditability, STUDIO MUST record the provider identity, model identity and version where available, material configuration, prompt-contract version, submitted prompt or its governed auditable representation, immutable source snapshot identities and hashes, response, timestamps, base artifact revision, proposal identity, and researcher disposition. Secrets and hidden provider reasoning MUST NOT be recorded. Sensitive data retention MUST follow the applicable source policy.

STUDIO MUST NOT claim that AI output is bitwise deterministic. Once AI output is accepted into a saved `.author` revision, every child projection of that revision MUST be deterministic under its declared renderer and configuration contract.

## 9. V1 Inference Box

The Inference Box MUST be owned and invoked only by STUDIO in V1. INTENTION Mode MUST NOT invoke it in V1. The Inference Box MAY consume explicitly selected, completed, immutable INTENTION results. It MUST NOT modify INTENTION state, configure tests, request test configuration changes, or execute computations.

The Inference Box MUST support bounded abductive reasoning. Its presentation and data model MUST preserve a visible, machine-testable boundary between deterministic measurements and abductive interpretation. Measurements MUST retain their exact lineage and epistemic status; interpretation MUST NOT be displayed as a computed result.

Inference outputs MUST remain `ABDUCTIVE` and `CANDIDATE` until governed promotion outside STUDIO. Direct invocation from INTENTION, bidirectional STUDIO/INTENTION navigation, and round-trip requests for new or changed tests are V2 capabilities and MUST NOT appear as V1 commands.

## 10. Intention Hypothesis Assessment

The Intention Hypothesis Assessment profile MUST use the accepted scientific H0/H1 framework without implying that H1 is accepted truth:

- H0: observations do not require intentional agency.
- H1: intentional agency contributes materially.

It MUST support explicit H1a, H1b, further sub-hypotheses, and competing non-intentional or intentional alternatives. It MUST use only available deterministic manifold-attractor measurements and the explicitly versioned iSEES intention framework. Unavailable or theoretical measurements MUST be identified as such.

The assessment MUST present supporting evidence, counterevidence, assumptions, mathematical warrants, predictions, falsifiers, alternative explanations, and unresolved uncertainty. AI MUST construct and challenge the strongest supportable H0 argument and the strongest competing H1 arguments. It MUST expose evidence gaps rather than resolving them rhetorically.

Attractor structure, correlation, coherence, or mathematical consistency MUST NEVER be described as proof of intention. Unsupported numerical probabilities, confidence values, Bayesian quantities, or qualitative confidence claims MUST NOT be asserted.

Governed conclusions MUST use a controlled vocabulary that includes:

- `CONSISTENT_WITH`
- `INSUFFICIENT_EVIDENCE`
- `NOT_DISTINGUISHABLE`
- `H0_WEAKENED`
- `H0_REJECTED_UNDER_DECLARED_TEST`
- `H1_VIABLE`
- `FURTHER_INVESTIGATION_REQUIRED`

Every conclusion MUST name the evidence scope, declared test where applicable, assumptions, and unresolved alternatives. `H0_REJECTED_UNDER_DECLARED_TEST` MUST NOT be generalized beyond that test.

## 11. Publication and knowledge boundary

Save, rebuild, export, publish, promotion, supersession, and retraction MUST be distinct commands with distinct authorization, validation, state transitions, and audit events.

Saving or exporting MUST NOT equal publication. Publication MUST NOT equal acceptance into System Canon. Saved artifacts MUST remain Candidate Knowledge. Published artifacts MUST be immutable. Corrections MUST create a new revision and superseding publication; they MUST NOT silently overwrite published bytes or metadata. Retraction MUST preserve the withdrawn artifact and reason in the audit record.

Publication MUST require explicit researcher authorization and successful validation of the exact revision and projections to be published. Promotion into any canonical knowledge system MUST occur outside STUDIO through the applicable governed authority.

## 12. Sensitive sources

STUDIO MUST support independently governed source directives for:

- include in analysis;
- include in artifact;
- cite publicly;
- anonymize;
- place in a restricted appendix;
- exclude from AI processing.

The most restrictive applicable rule MUST govern whenever rules overlap. Exclusion from AI processing MUST also exclude the source from prompts, provider logs, caches, embeddings, and derived AI context. Anonymization MUST be validated against indirect identifiers and MUST NOT destroy the protected internal provenance link. Public projections MUST NOT disclose restricted content through citations, filenames, metadata, alt text, prompts, logs, or error messages.

## 13. Failure and recovery

Authoritative save MUST be atomic. Projection failure MUST be recorded per projection and MUST NOT invalidate the saved parent revision or successful sibling projections. Retry MUST NOT mutate the source revision, source snapshot, or projection configuration; changed inputs require a new build identity.

Historical revisions and their successful projections MUST remain recoverable subject to retention and authorization policy. STUDIO MUST explicitly distinguish stale and current output. It MUST NOT silently lose, overwrite, merge, rebase, or replace working drafts, revisions, source snapshots, proposals, publications, or outputs.

Concurrent saves MUST fail closed on a stale expected head and SHOULD provide a difference or recovery path. Recovery MUST preserve both the last authoritative revision and the unsaved local draft until the researcher makes an explicit choice.

## 14. Core invariants

1. **One authority:** For artifact `A`, exactly one structured `.author` lineage is authoritative; no projection or AI response may be an alternate authority.
2. **Immutable revisions:** Once saved, revision `A.rN` and its canonical content hash MUST NOT change; correction creates `A.rN+1` with explicit parent lineage.
3. **Frozen sources:** Every drafting operation and saved revision MUST reference immutable source snapshots; later Inbox or source changes MUST NOT alter them.
4. **Proposal before acceptance:** AI content MUST exist as a separately identified, unapplied proposal before any researcher-authorized granular acceptance.
5. **Deterministic child lineage:** Every child MUST be reproducible from one saved parent revision plus versioned configuration and renderer, and MUST carry parent and output hashes.
6. **No canonical mutation:** STUDIO and its AI MUST NOT mutate System Canon, evidence, deterministic results, source systems, or Research Inbox sources.
7. **No automatic publication:** Save, regeneration, export, and download MUST NOT publish or promote.
8. **STUDIO-only AI:** Product AI authoring and inference MUST be invoked only inside STUDIO in V1.
9. **STUDIO-only Inference Box:** Only STUDIO MAY invoke the V1 Inference Box; INTENTION MUST NOT invoke it.
10. **INTENTION unchanged:** V1 integration MUST consume only explicit completed immutable INTENTION results and MUST NOT change INTENTION Mode code, state, computation, test configuration, navigation, or behavior.

Violation of an invariant MUST fail closed, preserve recoverable state, and produce an auditable error without claiming success.

## 15. V1 versus V2 boundary

### Required in V1

V1 comprises the four named artifact profiles; structured `.author` authority and immutable revisions; frozen source snapshots and explicit refresh; unapplied granular AI proposals; STUDIO-only AI; STUDIO-owned bounded Inference Box; read-only consumption of selected completed INTENTION results; deterministic enabled projections; distinct save/rebuild/export/publish/promotion/supersession/retraction semantics; scientific citation, mathematics, figure, table, uncertainty, privacy, failure, and audit governance; and all core invariants.

### Deferred to V2

V2 MAY add direct Inference Box invocation from INTENTION, bidirectional navigation, round-trip requests to configure or execute INTENTION tests, additional artifact profiles, collaborative authoring, and further citation/export adapters. A V1 implementation MUST NOT include a dormant control or placeholder that implies these V2 capabilities are available.

No V2 capability may weaken V1 authority, immutability, source-freezing, proposal, determinism, publication, privacy, or canonical-boundary invariants.
