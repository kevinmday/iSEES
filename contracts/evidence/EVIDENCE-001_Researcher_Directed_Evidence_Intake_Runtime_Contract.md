# EVIDENCE-001 — Researcher-Directed Evidence Intake Runtime Contract

**Status:** Authoritative Contract — `CONTRACTED_NOT_IMPLEMENTED`

**Version:** 1.1

**Implements:** [SC-027 Researcher-Directed Evidence Intake and Web Discovery](../../isees-ui/docs/computational-canon/SC-027_Researcher_Directed_Evidence_Intake_and_Web_Discovery.md)

**Governed by:** [EA-002 Engineering Change Governance](../../isees-ui/docs/engineering-architecture/EA-002_Engineering_Change_Governance_Contract.md)

**Related authority:** SC-003, SC-008, SC-010, SC-018, SC-019, SC-025, SC-026; REX-001; REX-002; AA-004; AA-008

## 1. Status and authority

This is the single runtime contract for researcher-directed Evidence intake and provider-neutral Web Discovery. It allocates responsibilities among existing owners; it creates no runtime, schema, route, store, provider integration, or deployment. SC-027 governs product and computational meaning. Where implementation types differ, they MUST be reconciled with this contract through existing owners rather than copied into a second model.

Normative words `MUST`, `MUST NOT`, `SHOULD`, and `MAY` have their ordinary requirements meaning. `KOD` retains the exclusive meaning **Known Object Detection**.

## 2. Purpose

The contract makes operationally precise a free researcher-directed path for uploads, entered URLs, notes, manual node and directed-edge proposals, Web Discovery, acquisition, review, admission, explicit publication, Candidate Knowledge, and governed revision. It preserves provenance, contradiction, identity, cost, cancellation, concurrency, and isolation across that path.

## 3. Scope

In scope are implementation-neutral commands, records, ports, states, guards, receipts, UI capabilities, deterministic fixtures, and ownership. Tavily is the approved V1 live provider. Provider selection and credentials are server-owned runtime configuration; the browser neither selects a provider nor receives its credential.

## 4. Normative terminology

- **Discovery**: a provider or researcher-visible reference not yet captured as Candidate Evidence.
- **Candidate Evidence**: investigation-bound material awaiting or undergoing epistemic review.
- **Acquisition**: retrieval or receipt of bytes or metadata, independent of epistemic judgment.
- **Admission**: explicit acceptance of Candidate Evidence for investigative use; it is not publication.
- **Publication**: an explicit durable command that creates Candidate Knowledge and a referencing Research Anchor.
- **Candidate Knowledge**: durable, non-canonical knowledge proposed or published for investigation use.
- **Research Anchor**: the Research Inbox projection referencing Candidate Knowledge and its complete Evidence lineage.
- **Governed revision**: separately proposed and approved creation of a new immutable operational graph revision.
- **Session authority**: an identified guest session allowed only session-local work.
- **Principal**: an authenticated durable authority identified by `principalId`.

## 5. Governing progression

```text
Discovery
→ Candidate Evidence
→ Researcher Review
→ Explicit Publication
→ Candidate Knowledge
→ Governed Revision
```

No stage may be silently skipped. Capture, upload, acquisition, review, admission, or publication MUST NOT automatically mutate Canon or the active Manifold. Candidate Knowledge is not Canon and is not active-Manifold membership.

## 6. Existing-code-first ownership

The frontend owners to extend are `EvidenceWorkspace.tsx`, `CandidateEvidenceTypes.ts`, `CandidateEvidenceLifecycle.ts`, `CandidateEvidenceApi.ts`, `CandidateEvidenceRuntime.ts`, `CandidateEvidenceQuery.ts`, `EvidenceWorkspaceProjection.ts`, `researchBridgeTypes.ts`, `ResearchBridgeRuntime.ts`, `TypedResearchSourceAdapters.ts`, and `OperationalGraphRevision.ts`.

The backend owners to extend are `isees_uap/api/v1/candidate_evidence.py`, `isees_uap/candidate_evidence/schemas.py`, `service.py`, `repository.py`, `sqlite_repository.py`, and existing authentication, CSRF, investigation-isolation, persistence, and lifecycle owners. `isees_uap/research_sources/` is authorized for careful extension as the durable Research Inbox publication owner; it MUST NOT become a second Candidate Evidence store or graph owner.

No disconnected legacy Evidence state, empty provenance interface, provider, UI projection, or untracked experiment becomes authoritative by existence. One contract owns this shared domain boundary; frontend and backend MUST NOT form competing contracts.

## 7. Investigation and revision identity

Every captured candidate, operation, review transition, publication, Candidate Knowledge record, anchor, and proposal MUST bind `investigationId` and the immutable `manifoldRevisionId` current when originated. Candidate optimistic `version` is distinct from Manifold revision identity. The active investigation and revision MUST be revalidated at publication and revision approval. Explicit governed rebase creates attributable new binding; it never rewrites history.

## 8. Intake pathway model

An intake record MUST identify a pathway such as researcher upload, direct URL capture, researcher note, Web Discovery capture, Canon reference, repository reference, or later REX production. The pathway carries `operationId`, authority, context, timestamps, origin, and provenance. Intake creates or references Candidate Evidence; it does not admit or publish it.

## 9. Researcher upload contract

Upload capability MUST be negotiated before transfer and declare supported media types, byte limits, hashing, cancellation, and scanning posture. Ingestion MUST be streaming or strictly bounded; validate size, claimed and detected MIME, and policy. A governed hash (initially SHA-256) establishes object identity. Persist metadata and an object reference only after object-store success, or use a recoverable transaction that cleans partial objects. Unsupported MIME, excessive size, failed scan, cancellation, and partial failure MUST fail closed with receipts and cleanup. Upload never implies review, admission, publication, or permission to execute content.

## 10. URL capture contract

Previewing or typing a URL is not capture. Explicit capture creates revision-bound Candidate Evidence with the original URL, canonicalized URL when determinable, researcher annotation, capture time, authority, and acquisition state. URL reference, fetched metadata, permitted excerpt, content hash, and retained content are distinct. Capture binds the active investigation and revision immediately. Publication revalidates both; stale content remains reviewable but cannot silently publish elsewhere.

## 11. Researcher-note contract

A note records researcher-authored text, `principalId` or session authority, investigation and revision binding, selected context, timestamps, and supporting Evidence references. A note MUST be visibly researcher-authored, MUST NOT impersonate a source, and enters Candidate Evidence review before publication. Guest notes are session-local.

## 12. Manual node proposal contract

A node proposal MUST contain proposal identity, proposed node type, names or aliases, properties and qualifications, rationale, supporting Evidence, provenance, proposer, investigation and revision binding, version, and disposition. It is Candidate Knowledge after explicit publication and has zero graph effect until separately approved.

## 13. Manual directed-edge proposal contract

An edge proposal MUST identify source node, target node, relationship type, direction, evidence, provenance, rationale, temporal or other qualifications, proposer, investigation and revision binding, version, and disposition. Endpoint order and direction MUST be explicit. Publication creates Candidate Knowledge, not an edge. Only governed approval may feed the operational revision owner.

## 14. Provider-neutral Web Discovery contract

Web Discovery V1 is available only to an existing authenticated researcher who owns the active persisted Investigation. Search and capture are mutations and MUST use existing authentication, ownership authorization, Investigation isolation, and CSRF protection. No new principal or authorization system is permitted. Guest Web Discovery is deferred until a separately governed volatile-session authority exists.

V1 is metadata-only. Search execution MUST NOT fetch, open, crawl, scrape, archive, summarize, hash, classify, or verify any result webpage. Search-result-page scraping and browser scraping are prohibited as the default provider design. Result URLs are untrusted provider-returned data and MUST NOT become server fetch targets. Only well-formed HTTP and HTTPS URLs on ports 80 or 443 are permitted; embedded credentials, malformed URLs, control characters, unsupported schemes, and disallowed ports MUST fail closed.

Search and capture are distinct commands. Search returns ephemeral discovery references and MUST NOT create Candidate Evidence. Capture resolves selected opaque result identities from the originating authoritative server-side search session, MUST NOT accept browser-supplied result metadata as capture authority, and MUST NOT contact the provider. Only explicit researcher confirmation may create Candidate Evidence. Unselected results remain ephemeral and MUST NOT become Candidate Evidence.

The provider-neutral adapter port is exactly:

```text
search(request, cancellation) -> outcome
```

The bounded request MUST contain schema version, search-session ID, operation ID, principal ID, Investigation ID, expected Investigation aggregate revision, Manifold revision ID, normalized query and query-normalization version, requested result limit, provider-adapter ID and version, idempotency key, creation and expiration timestamps, and an explicit metadata-only/zero-spend policy. The bounded outcome MUST contain schema version, session and operation IDs, adapter and upstream-provider attribution, start and completion timestamps, status, result count, results, receipt, restrictions, warnings, and an optional stable error. Status is one of completed, zero results, cancelled, unavailable, rate limited, or failed. Each bounded result MUST contain an opaque session-scoped result ID, provider result ID when supplied, rank, provider-attributed title and snippet, provider-returned URL, normalized URL, display domain, attribution, restrictions, and only allowlisted provider metadata. Unknown facts remain unknown. Errors MUST be stable, bounded, and secret-free.

Adapters MUST NOT receive Candidate Evidence repositories, Research Inbox services, publication services, graph or Manifold services, REX execution services, or frontier-agent services. Initial verification MUST use a deterministic, offline, versioned fixture unable to contact a live provider. Tavily Search is the approved V1 live external discovery-reference provider. It is not an evidence authority, inference authority, acquisition service, research agent, or epistemic decision-maker. Runtime activation MUST be explicit: `TAVILY` requires a valid server-held key, `OFFLINE_FIXTURE` selects only the deterministic fixture, and `DISABLED` or unavailable configuration dispatches no provider request. A Tavily failure MUST NOT fall back to the fixture. Responses expose only `LIVE_WEB_DISCOVERY`, `OFFLINE_FIXTURE`, or `UNAVAILABLE` runtime status; credentials and internal transport details remain server-secret.

## 15. Search session structure

A bounded server-side search-session owner is the sole authority for selectable results. A session MUST bind `principalId`, `investigationId`, expected Investigation aggregate revision, `manifoldRevisionId`, `searchSessionId`, `operationId`, provider-adapter ID and version, normalized `query` and normalization version, idempotency key, creation timestamp, expiration timestamp, selected context, completion/cancellation state, result count, capture count, error status, receipt, and explicit zero effects. Expiration duration is configuration-owned and the resulting expiration timestamp MUST be visible in the search response; this contract does not hardcode a product duration. Complete unselected result lists need not be durably persisted.

## 16. Search result structure

A result MUST support: opaque session-scoped identity, session and provider identity, normalized query, `resultRank`, provider-attributed title and snippet, provider-returned URL, normalized URL, domain, attribution and retention restrictions, provider-supplied media type only when attributable, result timestamp, selected context, and capture disposition. It MUST NOT claim a canonical URL, content identity, content hash, publication date, MIME type, source authority, or verified webpage content unless actually supplied and attributable. Unselected results remain ephemeral.

## 17. Candidate Evidence structure

The shared semantics MUST reconcile with authoritative types and at minimum support:

- `candidateEvidenceId`, `investigationId`, `manifoldRevisionId`, `principalId` or session authority;
- `origin`, `discoveryPathway`, source type, source URL and canonicalized URL;
- provider, query, result rank, title, snippet, selected node or edge context;
- `acquisitionState`, `epistemicState`, `publicationState`, media type, byte length, content hash, object reference;
- `capturedAt`, `reviewedAt`, `publishedAt`, provenance, contradictions;
- `operationId`, cost receipt, `version`, idempotency key, and expected revision/concurrency token.

These are contract semantics, not authorization for a second data model. Existing names such as `candidateId`, origin identity, lineage, association, lifecycle, archive, availability, acquired content, review decision, and provenance events SHOULD be extended or mapped explicitly.

Captured Web Discovery results MUST reuse this existing Candidate Evidence owner and lifecycle with backend origin `DISCOVERY`, intake pathway `WEB_DISCOVERY`, and visible origin label `WEB_DISCOVERED`. They enter the same currently implemented review-only lifecycle as other Candidate Evidence. Metadata-only acquisition MUST have an explicit compatible representation and MUST NOT misuse `ACQUIRED`. No second Candidate Evidence model, lifecycle, repository, workspace, lane, or store is authorized. The broader `ADMITTED`/publication lifecycle is not reconciled by this increment; any such reconciliation requires separate authority and no existing runtime lifecycle code changes here.

## 18. Origin and pathway semantics

Existing Candidate origin authority is preserved: Web Discovery uses `DISCOVERY` plus an explicit `WEB_DISCOVERY` pathway or method discriminator. `WEB_DISCOVERED` remains the canonical human-readable concept, not a competing origin lifecycle. A compatible origin extension is allowed only if verified type constraints make the discriminator approach impossible and governance approves it. Researcher upload, URL, and note remain researcher-supplied pathways; REX retains REX lineage. Origins express lineage, never truth.

## 19. Acquisition state

Acquisition is an independent dimension, for example `NOT_REQUESTED`, `METADATA_ONLY`, `IN_PROGRESS`, `ACQUIRED`, `UNAVAILABLE`, `FAILED`, or `CANCELLED`, mapped to existing vocabulary. Web Discovery capture is explicitly `METADATA_ONLY` (or an exactly compatible existing representation), never `ACQUIRED`. Receiving bytes, retrieving content, or capturing metadata does not establish acceptance, admission, publication, Candidate Knowledge, Canon, or graph membership. State changes MUST record actual bytes, hash/object reference where present, and failure/cancellation provenance.

## 20. Epistemic lifecycle

The authoritative Candidate lifecycle is extended, not replaced. Existing `DISCOVERED`, `SUBMITTED`, `REFERENCED`, `IN_REVIEW`, `DEFERRED`, `EXCLUDED`, `ACQUIRED`, and `ADMITTED` vocabulary MUST be reconciled so that acquisition is independently represented. `ADMITTED` means accepted for investigative use only. Rejection, duplicate, supersession, withdrawal, and reopening behavior MUST be explicit and attributable.

The runtime MUST expose five independent dimensions rather than infer one from another:

| Dimension | Required meaning |
| --- | --- |
| Acquisition state | Whether metadata or bytes were requested, received, unavailable, failed, or cancelled |
| Epistemic state | Whether Candidate Evidence is awaiting review, in review, admitted, deferred, excluded, duplicate, superseded, or withdrawn |
| Publication state | Whether explicit publication is not requested, pending, published, failed, cancelled, or superseded, with receipt identity where published |
| Candidate Knowledge state | The durable published record's active, superseded, withdrawn, or proposal disposition without conferring Canon status |
| Manifold revision state | Whether a separate revision proposal is pending, approved, rejected, stale, cancelled, or applied to one identified immutable revision |

No value in one dimension implies advancement in another: acquired is not reviewed; reviewed is not necessarily admitted; admitted is not published; published is not Canon; Candidate Knowledge is not an active Manifold mutation.

## 21. Review transitions

Every transition requires the candidate identity, prior and resulting epistemic state, actor, investigation and revision, reason/disposition when applicable, timestamp, expected version, idempotency key, and operation receipt. Guards MUST reject illegal, stale, cross-investigation, and unauthorized transitions. Acquired is not reviewed; reviewed is not necessarily admitted.

## 22. Admission boundary

Admission is an explicit human-authorized transition establishing eligibility for investigative use. It MUST preserve contradictions and lineage. It creates neither Research Inbox publication nor Candidate Knowledge unless an independent explicit publication command succeeds. Admitted is not published.

## 23. Explicit publication command

Publication MUST be a distinct authenticated durable command containing `candidateEvidenceId`, `investigationId`, `manifoldRevisionId`, `principalId`, expected candidate version, active-revision/concurrency token, idempotency key, selected publication representation, and required researcher confirmation.

The command MUST require investigation membership, eligible reviewed/admitted Evidence, current investigation/revision coherence or an explicit governed rebase, and complete provenance. Atomically or recoverably it MUST create one durable Candidate Knowledge record and one Research Anchor referencing it, persist an immutable publication receipt with `publicationReceiptId`, preserve contradictions and full Evidence lineage, and record zero Manifold effect. Replay returns the original outcome; partial failure MUST be safely retryable without duplication.

## 24. Durable Candidate Knowledge

Publication creates a distinct durable record with `candidateKnowledgeId`, source Candidate Evidence identity/version, investigation and revision, publication authority/time, representation, provenance, contradictions, state, and publication receipt. Its persistence MUST use an authorized domain/research boundary, not turn `research_sources` into a Candidate Evidence store. Candidate Knowledge may support node or edge proposals but is neither Canon nor a graph mutation.

## 25. Research Anchor projection

Publication also creates `researchAnchorId` through the existing Research Bridge authority. The anchor references `candidateKnowledgeId` and the complete Evidence lineage rather than duplicating source bytes or assuming epistemic ownership. `ResearchBridgeRuntime`, its types, typed source adapters, and carefully extended `isees_uap/research_sources/` remain the publication owners. Anchor and Candidate Knowledge identities are distinct and both appear on the receipt.

## 26. Governed revision proposal

A separate command creates `revisionProposalId` from published Candidate Knowledge node and/or directed-edge proposals. Approval MUST revalidate membership, active revision, endpoints, evidence, provenance, contradictions, policy, and expected revision. Approved input feeds the existing `OperationalGraphRevision`/revision engine owner and may produce exactly one new immutable revision. Prior revisions remain inspectable. Rejected, cancelled, unauthorized, duplicate, or stale proposals record zero graph effect. No proposal writes the graph directly.

## 27. Object-storage port

The first binary increment MUST define an abstract object-storage port with bounded streaming put, get, stat, delete-for-cleanup, existence/deduplication checks, cancellation, integrity verification, and opaque object references. Candidate Evidence stores the reference and governed hash, not an adapter-specific filesystem path. Adapters have storage authority only, not Evidence identity or epistemic authority.

## 28. Local content-addressed adapter

The first adapter SHALL be local content-addressed storage keyed by governed algorithm and digest. It MUST prevent path traversal, verify bytes against the expected digest, use atomic finalization, handle concurrent duplicate writes, protect object immutability, and clean abandoned partials. Reference counting or retention policy MUST prevent deleting shared content. Later cloud storage may replace the adapter without changing Candidate Evidence identity, hash, lineage, or publication records.

## 29. URL normalization

One shared authority MUST normalize URLs for both direct URL intake and Web Discovery capture. Normalization MUST be deterministic, versioned, and preserve both the provider-returned or researcher-submitted URL and normalized URL. It may normalize scheme/host case, default ports, fragments, percent encoding, and governed tracking parameters, but MUST NOT infer semantic equivalence it cannot prove. Redirect targets are separate observations. The normalization version and result participate in duplicate assessment and receipts.

## 30. Content hashing

SHA-256 is the initial governed content hash unless policy approves another algorithm. Records MUST name algorithm and digest and distinguish content hash from URL, provider ID, metadata fingerprint, and object reference. Hashing MUST cover the exact retained bytes; transformations receive their own hashes and lineage.

## 31. Duplicate and version handling

Detection considers canonicalized URL, exact content hash, provider source ID, existing Candidate Evidence, object identity, and relevant canonical aliases. Equal hash may reuse immutable bytes while retaining distinct source/provenance records. Same URL with changed hash creates a version or new candidate relationship; it MUST NOT overwrite history. A normalized-URL match without acquired bytes is a possible duplicate, not proof. Merge/reuse/supersede decisions are explicit and reversible in audit history.

## 32. Provenance

Provenance MUST preserve authority, origin/pathway, source locator, provider/adapter and versions, operation/search/result identity, investigation/revision, selected context, capture/retrieval/review/publication times, content and transformation hashes, source spans or permitted excerpts where applicable, restrictions, AI assistance, and every transition/receipt. Unknown and unavailable facts remain explicit. Summaries never replace sources.

## 33. Contradictions

Contradictory claims MUST coexist with distinct evidence, origins, temporal context, and dispositions. Duplicate detection, admission, publication, AI assistance, and paid processing MUST NOT erase or silently resolve them. Candidate Knowledge and Research Anchors preserve contradiction references; revision proposals disclose unresolved contradictions to approvers.

## 34. Operation receipts

Every attempted intake, search, acquisition, transition, publication, and revision proposal SHOULD produce an immutable or append-only receipt containing `operationId`, authority, investigation/revision, pathway, inputs or protected hashes, timing, outcome/error/cancellation, counts and identities created, versions/idempotency, costs, and effects. Web Discovery MUST persist a minimal immutable operation/capture receipt sufficient to prove authority, provenance, cost, and effects; captured Candidate Evidence MUST durably preserve the exact provider metadata selected by the researcher. Search receipts MUST declare Research Inbox effect `NONE`. Capture receipts MUST declare Research Inbox effect `NONE`, `CREATED`, or `REPLAYED` according to the explicit `addToResearchInbox` choice, while both operations MUST explicitly declare `aiAssistance: NONE`, `rexExecution: NONE`, monetary cost `0.00`, researcher charge `0.00`, `billingTriggered: false`, estimated provider cost `0`, actual provider cost `0`, final charge `0`, publication effect `NONE`, Candidate Knowledge effect `NONE`, Canon effect `NONE`, graph effect `NONE`, Manifold effect `NONE`, and Resolve effect `NONE`. A dispatched Tavily Basic Search may record exactly one provider quota credit with usage `ESTIMATED`, `ACTUAL`, or `UNKNOWN`; an operation not dispatched records zero credits and usage `ZERO`. Provider quota is neither monetary spend, researcher billing, evidentiary confidence, nor REX cost. Paid overages and automatic retries are prohibited.

Search may not invoke or mutate Research Inbox or any downstream owner. Capture may create only the explicitly selected, inspection-only Research Inbox anchor linked to the captured Candidate Evidence; it may not mutate Investigation Evidence, Curated Context, Candidate Knowledge, Canon, Resolve, Operational Graph Revision, Manifold, REX, frontier agents, or other downstream projections. Candidate Evidence and Research Sources are separate durable stores, so this narrow two-record effect MUST use idempotent reconciliation: Candidate Evidence is created once, an Inbox failure returns failure rather than false success, and retry converges to one linked anchor without another provider call or URL fetch.

## 35. Cost and authorization receipts

Reuse REX cost vocabulary and arithmetic concepts without making REX the owner. Free operations truthfully record estimated and actual zero cost where applicable. Any metered provider requires visible bounded preauthorization before dispatch and final reconciliation recording estimate, reservation, actual provider/compute/storage/network amounts, iSEES fee, final charge, and released authorization. Partial failure records incurred cost and releases unused authorization. Paid work has no greater epistemic authority.

## 36. Cancellation

Clients and services MUST propagate cancellation where safe. Cancellation stops pending transfer/provider work, prevents new work, preserves partial provenance and actual cost, releases unused authorization, quarantines or removes uncommitted partial objects, and records a terminal receipt. Late completions remain attached to their original operation and cannot enter the active projection or publish silently.

## 37. Idempotency

Every mutation and cost-bearing operation requires an investigation/principal-scoped idempotency key. Same key and equivalent governed input returns the original receipt and identities. Same key with materially different input fails. Retries MUST NOT duplicate objects, Candidate Evidence, Candidate Knowledge, anchors, proposals, revisions, or charges.

## 38. Optimistic concurrency

Commands MUST carry `version`, `expectedRevision`, or an equivalent concurrency token for each mutated aggregate. A mismatch fails closed with current inspectable state and no partial effect. Candidate version, publication version, Candidate Knowledge version, and Manifold revision remain distinct.

## 39. Stale-response protection

Responses are applicable only to their originating principal/session, investigation, Manifold revision, selected context, and operation fingerprint. UI scope guards and server validation MUST reject mismatches. Stale material may remain inspectable and may be explicitly rebased/re-reviewed, but MUST NOT overwrite current state, publish, charge anew, or mutate the graph by implication.

Web Discovery capture MUST fail closed for a different principal, different Investigation, stale Investigation aggregate revision, stale Manifold revision, expired session, missing result, result/session mismatch, or idempotency-key conflict. Identical idempotent replay returns the original outcome; reuse with materially different governed input fails.

## 40. Authentication and CSRF

All durable mutations require existing authenticated principal authority and existing CSRF protection. Read and mutation routes MUST use established authentication behavior; headers that merely identify a local principal are not treated as stronger identity than their governing authentication contract. Provider credentials and secrets never enter Evidence, provenance, receipts, logs, or client payloads.

## 41. Principal and investigation isolation

Backend queries and object authorization MUST scope by principal membership and investigation, validate path/body/query equality, and prohibit cross-investigation object references. An identifier alone conveys no access. Publication and revision approval recheck ownership/membership at execution time. Shared content-addressed bytes MUST not leak metadata or existence across principals.

## 42. Guest/session-local behavior

Guest Web Discovery is not authorized in V1. It is deferred until a separate increment establishes a governed volatile-session authority, loss warnings, adoption rules, and isolation semantics. This deferral does not alter separately authorized guest behavior for other intake pathways.

## 43. Saved-researcher durable behavior

A free authenticated researcher account with investigation membership is required for persistent upload, durable Candidate Evidence, durable Research Inbox publication, Candidate Knowledge, and governed revision. Entitlement or operational limits MUST be capability-reported and explained. Saving does not advance epistemic state.

## 44. UI capability and unavailable-state requirements

The EVIDENCE workspace MUST derive controls from authenticated/session capability, provider availability, supported media/limits, investigation/revision coherence, lifecycle eligibility, and cost authorization. Disabled or unavailable states MUST state why and what action is required. UI MUST distinguish unknown, zero, unavailable, loading, cancelled, stale, duplicate, failed, and unauthorized; MUST show origin/pathway, provenance, contradictions, persistence boundary, and cost before consequential actions; and MUST request explicit publication/revision approval.

## 45. REX reconciliation

REX cost and authorization structures may supply reusable vocabulary, but REX does not own Web Discovery. Completed REX results remain review-only and later enter through the same EVIDENCE Candidate review boundary with execution and receipt lineage. `RexResearchInboxHydrator` automatic publication remains prohibited. Selected structures from untracked REX entity-discovery experiments MAY be reviewed and adopted individually into tracked owners; the directory is not authority and MUST NOT be adopted wholesale.

## 46. Explicitly prohibited behavior

Prohibited are parallel EVIDENCE workspaces; second Candidate Evidence, Research Inbox, Candidate Knowledge, object-identity, provenance, or revision owners; provider- or REX-owned graphs; duplicated lifecycle enums; Google-specific core models; unrestricted uploads; execution of uploaded content; automatic admission/publication; Research Inbox creation without an explicit researcher choice; automatic Canon or Manifold mutation; hidden cost; paid epistemic privilege; silent contradiction resolution; stale publication; cross-investigation access; wholesale elevation of untracked experiments; and reinterpretation of KOD.

## 47. Deterministic fixture requirements

The first implementation MUST cover: zero-result search; one-result public URL; normalized URL duplicate; same URL with changed hash; attributed snippet without retained content; captured and uncaptured results; stale investigation response; stale revision response; cancelled zero-cost search; partial failure with actual and released cost; valid upload; unsupported MIME; excessive-size rejection; duplicate binary hash; unavailable URL content; researcher note; node proposal; directed-edge proposal; contradiction; explicit publication success; idempotent replay; cross-investigation rejection; governed revision success; and rejected proposal with zero Manifold effect.

Fixtures MUST be offline, provider-neutral, deterministic, versioned, non-secret, and unable to contact a live provider.

## 47A. Web Discovery API and errors

The separate V1 API operations are exactly:

```text
POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/searches
POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/captures
```

Search MUST NOT create Candidate Evidence. Capture MUST NOT contact the provider and may mutate only Candidate Evidence plus the explicitly checked Research Inbox anchor described above. Stable Web Discovery errors are `WEB_DISCOVERY_UNAVAILABLE`, `WEB_DISCOVERY_RATE_LIMITED`, `WEB_DISCOVERY_PROVIDER_FAILURE`, `WEB_DISCOVERY_CANCELLED`, `WEB_DISCOVERY_SESSION_EXPIRED`, `WEB_DISCOVERY_RESULT_NOT_FOUND`, and `WEB_DISCOVERY_RESULT_MISMATCH`. Existing authentication, authorization, Investigation mismatch, revision conflict, validation, and idempotency errors MUST be reused.

## 48. Verification requirements

Verification MUST prove aligned frontend/backend structures and legal transitions; upload bounds, hashing, object integrity, cleanup, and restart durability; URL normalization and version behavior; provenance/contradiction preservation; authentication, CSRF, membership, and principal isolation; cancellation/late-result rejection; idempotency and optimistic concurrency; publication receipt durability and atomic/recoverable Candidate Knowledge plus anchor creation; zero automatic Inbox/graph/Canon effects; cost reconciliation; guest volatility disclosures; REX restoration nonpublication; and one-new-revision behavior with prior revisions inspectable. Documentation verification MUST also prove SC-027 byte identity and exact authorized-file scope.

## 49. Implementation increments

Implementation SHALL proceed in this order:

1. Documentation and ownership reconciliation.
2. Candidate type alignment.
3. Revision binding and receipts.
4. Metadata URL capture completion.
5. Object-store port and local content-addressed adapter.
6. Upload persistence and UI.
7. Researcher notes.
8. Node and directed-edge proposals.
9. Provider-neutral Web Discovery contracts.
10. Deterministic Web Discovery fixtures.
11. Existing `DISCOVERY`-lane integration.
12. Explicit Research Inbox publication.
13. Durable Candidate Knowledge.
14. Governed revision proposal and approval.
15. End-to-end deterministic verification.
16. Later live-provider integration.
17. Later reviewed REX-to-EVIDENCE integration.

No later increment bypasses unresolved ownership, security, provenance, persistence, cost, or lifecycle requirements from an earlier increment.

P57-EVIDENCE-WEB-I4A freezes only this Web Discovery contract and verification. It implements no route, service, repository, migration, provider client, UI behavior, webpage fetching, REX integration, or live search.

## 50. Final acceptance invariants

1. The progression is visible and no stage is implicit.
2. Web Discovery is provider-neutral and uses existing `DISCOVERY` origin authority with an explicit pathway discriminator.
3. Acquisition, epistemic review, publication, Candidate Knowledge, and Manifold revision are independent state dimensions.
4. `ADMITTED` means accepted for investigative use, not published.
5. Explicit publication creates distinct durable Candidate Knowledge and Research Anchor records with one durable receipt and zero Manifold effect.
6. Only approved governed revision input may produce one new immutable active Manifold revision; rejection/staleness produces none.
7. Existing owners are extended in place and no parallel Evidence, Inbox, knowledge, storage-identity, provenance, or revision system exists.
8. Investigation, revision, principal/session, provenance, contradictions, receipts, costs, versions, and idempotency remain inspectable.
9. Guest volatility and durable-account boundaries are obvious before loss or persistence-dependent action.
10. Uploads are bounded, content-addressed through an abstract port, cancellable, and never automatically admitted or published.
11. Tavily is the approved V1 live provider and is activated only by valid server-owned configuration; deterministic fixtures remain explicit offline/degraded operation and are never a live-failure fallback.
12. REX is a later producer through EVIDENCE, not the owner, and automatic hydration remains prohibited.
13. No operation silently mutates Canon; paid processing conveys no epistemic authority.
14. KOD means Known Object Detection only.
