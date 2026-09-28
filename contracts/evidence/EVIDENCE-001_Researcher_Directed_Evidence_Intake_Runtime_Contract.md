# EVIDENCE-001 — Researcher-Directed Evidence Intake Runtime Contract

**Status:** Authoritative Contract — `CONTRACTED_NOT_IMPLEMENTED`

**Version:** 1.2

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

Web Discovery supports two authority modes through the same existing runtime and provider adapter: (1) an authenticated researcher who owns the active persisted Investigation and (2) the existing volatile Guest workspace/session authority for a small, server-bounded, operator-funded Basic Search. The first Guest search MUST NOT require account creation. No new principal, Guest identity, search runtime, provider adapter, session store, Evidence store, workspace, or admission system is permitted.

Authenticated search and capture remain mutations under existing authentication, ownership authorization, Investigation isolation, and CSRF protection. Guest search is session-local and disposable. It MUST NOT create durable Candidate Evidence, a Research Inbox entry, Candidate Knowledge, a Canon assertion, a graph mutation, or a Manifold revision. Search alone has the same zero-effect boundary in either authority mode.

Explicit Guest result capture is not established by the current session-local Evidence ownership. The implemented capture route requires authenticated ownership and creates durable Candidate Evidence, optionally with a durable Research Inbox anchor. Guest capture therefore remains a follow-up boundary. A Guest MUST NOT be sent to, or represented as eligible for, the authenticated durable capture endpoint; no durable or session-local Guest capture behavior is authorized by implication.

V1 is metadata-only. Search execution MUST NOT fetch, open, crawl, scrape, archive, summarize, hash, classify, or verify any result webpage. Search-result-page scraping and browser scraping are prohibited as the default provider design. Result URLs are untrusted provider-returned data and MUST NOT become server fetch targets. Only well-formed HTTP and HTTPS URLs on ports 80 or 443 are permitted; embedded credentials, malformed URLs, control characters, unsupported schemes, and disallowed ports MUST fail closed.

Search and capture are distinct commands. Search returns ephemeral discovery references and MUST NOT create Candidate Evidence. Capture resolves selected opaque result identities from the originating authoritative server-side search session, MUST NOT accept browser-supplied result metadata as capture authority, and MUST NOT contact the provider. Only explicit researcher confirmation may create Candidate Evidence. Unselected results remain ephemeral and MUST NOT become Candidate Evidence.

The provider-neutral adapter port is exactly:

```text
search(request, cancellation) -> outcome
```

The bounded request MUST contain schema version, search-session ID, operation ID, server-established principal or Guest session authority, applicable Investigation and revision binding, normalized query and query-normalization version, requested result limit, provider-adapter ID and version, idempotency key, creation and expiration timestamps, and an explicit metadata-only/zero-customer-charge policy. The bounded outcome MUST contain schema version, session and operation IDs, adapter and upstream-provider attribution, start and completion timestamps, status, result count, results, receipt, restrictions, warnings, and an optional stable error. Status is one of completed, zero results, cancelled, unavailable, rate limited, or failed. Each bounded result MUST contain an opaque session-scoped result ID, provider result ID when supplied, rank, provider-attributed title and snippet, provider-returned URL, normalized URL, display domain, attribution, restrictions, and only allowlisted provider metadata. Unknown facts remain unknown. Errors MUST be stable, bounded, and secret-free.

Before Guest dispatch, a server-owned admission gate MUST atomically or conservatively check both the Guest session allowance and the global operator-funded provider budget. Exhaustion, indeterminate accounting, or unavailable/invalid provider configuration MUST return a stable unavailable or rate-limited outcome without calling the provider. Browser-supplied identity, eligibility, counters, result counts, headers, or budget values MUST NOT authorize or enlarge either allowance. Paid overage and automatic retry remain prohibited.

Adapters MUST NOT receive Candidate Evidence repositories, Research Inbox services, publication services, graph or Manifold services, REX execution services, or frontier-agent services. Initial verification MUST use a deterministic, offline, versioned fixture unable to contact a live provider. Tavily Search is the approved V1 live external discovery-reference provider. It is not an evidence authority, inference authority, acquisition service, research agent, or epistemic decision-maker. Runtime activation MUST be explicit: `TAVILY` requires a valid server-held key, `OFFLINE_FIXTURE` selects only the deterministic fixture, and `DISABLED` or unavailable configuration dispatches no provider request. A Tavily failure MUST NOT fall back to the fixture. Responses expose only `LIVE_WEB_DISCOVERY`, `OFFLINE_FIXTURE`, or `UNAVAILABLE` runtime status; credentials and internal transport details remain server-secret.

## 15. Search session structure

A bounded server-side search-session owner is the sole authority for results. An authenticated session MUST retain its existing principal, Investigation, aggregate-revision, and Manifold-revision bindings. A Guest session MUST instead bind the existing server-recognized Guest session/workspace authority and MUST NOT fabricate a durable Investigation or principal. Both modes bind `searchSessionId`, `operationId`, provider-adapter ID and version, normalized `query` and normalization version, idempotency key, creation timestamp, expiration timestamp, selected context when applicable, completion/cancellation state, result count, error status, receipt, and explicit zero effects. Guest sessions additionally bind server-owned allowance and global-budget decisions without exposing secrets or trusting browser counts. Expiration duration is configuration-owned and visible in the response. Complete Guest and other uncaptured result lists are disposable and need not be durably persisted.

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

Every attempted intake, search, acquisition, transition, publication, and revision proposal SHOULD produce a receipt containing `operationId`, authority, applicable investigation/revision, pathway, inputs or protected hashes, timing, outcome/error/cancellation, counts and identities created, versions/idempotency, costs, and effects. Authenticated Web Discovery MUST persist the minimal immutable operation/capture receipt required by the existing runtime; captured Candidate Evidence MUST durably preserve the exact provider metadata selected by the researcher. Guest search receipts and results remain bounded to the volatile Guest UI/search-result boundary and MUST NOT be promoted into durable Evidence or investigation state merely for audit convenience. The durable server operation ledger, per-Guest allowance, and global budget reservations retain only the minimum protected identity, request fingerprint, dispatch/reconciliation state, expiry, and cost/usage facts required for authorization, replay safety, and accounting; they MUST NOT become a parallel research session, Evidence store, or durable Guest investigation/result store.

Search receipts MUST declare Candidate Evidence and Research Inbox effects `NONE`. Authenticated capture receipts MUST declare Research Inbox effect `NONE`, `CREATED`, or `REPLAYED` according to the explicit `addToResearchInbox` choice. Both search and capture MUST explicitly declare `aiAssistance: NONE`, `rexExecution: NONE`, researcher charge `0.00`, `billingTriggered: false`, final charge `0`, publication effect `NONE`, Candidate Knowledge effect `NONE`, Canon effect `NONE`, graph effect `NONE`, Manifold effect `NONE`, and Resolve effect `NONE`. A dispatched operator-funded Tavily Basic Search may record exactly one provider quota credit with usage `ESTIMATED`, `ACTUAL`, or `UNKNOWN`; an operation not dispatched records zero credits and usage `ZERO`. Provider quota or operator expense is neither customer monetary spend, researcher billing, evidentiary confidence, nor REX cost. Paid overages and automatic retries are prohibited.

Search may not invoke or mutate Research Inbox or any downstream owner. Capture may create only the explicitly selected, inspection-only Research Inbox anchor linked to the captured Candidate Evidence; it may not mutate Investigation Evidence, Curated Context, Candidate Knowledge, Canon, Resolve, Operational Graph Revision, Manifold, REX, frontier agents, or other downstream projections. Candidate Evidence and Research Sources are separate durable stores, so this narrow two-record effect MUST use idempotent reconciliation: Candidate Evidence is created once, an Inbox failure returns failure rather than false success, and retry converges to one linked anchor without another provider call or URL fetch.

## 35. Cost and authorization receipts

Reuse REX cost vocabulary and arithmetic concepts without making REX the owner. A Guest Basic Search is operator-funded and has customer charge zero; this does not require the operator's provider cost to be zero. Before dispatch, one durable transaction MUST reserve both the server-held Guest identity's allowance and the global provider budget while creating the idempotent operation record. This coordination MUST be authoritative across processes, workers, and restarts; process memory, browser storage, and eventually consistent counters are insufficient. Any failure before confirmed dispatch releases both reservations atomically. Any outcome uncertain after dispatch retains or consumes them conservatively until authoritative provider reconciliation; it MUST NOT trigger an automatic paid retry. Any future customer-metered provider requires visible bounded preauthorization before dispatch and final reconciliation recording estimate, reservation, actual provider/compute/storage/network amounts, iSEES fee, final charge, and released authorization. Partial failure records incurred cost and releases only authorization proven unused. Paid work has no greater epistemic authority.

## 36. Cancellation

Clients and services MUST propagate cancellation where safe. Cancellation stops pending transfer/provider work, prevents new work, preserves partial provenance and actual cost, releases unused authorization, quarantines or removes uncommitted partial objects, and records a terminal receipt. Late completions remain attached to their original operation and cannot enter the active projection or publish silently.

## 37. Idempotency

Every mutation and cost-bearing operation requires an investigation/principal-scoped idempotency key; Guest keys are scoped to the server-held Guest identity, not the browser `operatorId`. Same key and equivalent governed input returns or polls the original receipt and identities without new reservation or dispatch. Same key with materially different input fails. Once provider dispatch is durably marked, timeout, cancellation, worker loss, or ambiguous response is `UNKNOWN`/reconcilable and cannot be automatically redispatched. A different key with the same governed request MUST NOT bypass an existing in-flight or uncertain operation, allowance, or budget reservation. Retry is permitted only when authoritative provider idempotency or reconciliation proves that paid work cannot be duplicated. Retries MUST NOT duplicate objects, Candidate Evidence, Candidate Knowledge, anchors, proposals, revisions, provider work, or charges.

## 38. Optimistic concurrency

Commands MUST carry `version`, `expectedRevision`, or an equivalent concurrency token for each mutated aggregate. A mismatch fails closed with current inspectable state and no partial effect. Candidate version, publication version, Candidate Knowledge version, and Manifold revision remain distinct.

## 39. Stale-response protection

Responses are applicable only to their originating principal/session, investigation, Manifold revision, selected context, and operation fingerprint. UI scope guards and server validation MUST reject mismatches. Stale material may remain inspectable and may be explicitly rebased/re-reviewed, but MUST NOT overwrite current state, publish, charge anew, or mutate the graph by implication.

Web Discovery capture MUST fail closed for a different principal, different Investigation, stale Investigation aggregate revision, stale Manifold revision, expired session, missing result, result/session mismatch, or idempotency-key conflict. Identical idempotent replay returns the original outcome; reuse with materially different governed input fails.

## 40. Authentication and CSRF

All durable Evidence mutations require existing authenticated principal authority and existing CSRF protection. The frontend-generated `guest:*` `operatorId`, Guest workspace snapshot, and `sessionStorage` contents are disposable UI identity/recovery state only and never server authentication or authorization. A Guest search requires an opaque, high-entropy, expiring credential issued and validated by a compatible extension of the existing `isees_uap.authentication` session owner and bound to a server-held Guest identity. Only a protected verifier/digest is stored; the browser receives no server Guest identity or script-readable bearer secret.

The Guest credential MUST use a host-only cookie with the established session-cookie posture: `HttpOnly`, `SameSite=Strict`, `Secure` in production, the minimum compatible path (currently `/`), explicit `Max-Age`/expiry, and no `Domain`. Guest cost-bearing requests MUST use the existing double-submit CSRF cookie plus `X-ISEES-CSRF`, or a documented equivalently strong mechanism owned by the same authentication boundary. Bootstrap/issuance MUST validate the allowed site/origin or equivalent fetch context and is itself rate/abuse limited. Expiry, explicit Guest reset/logout, suspected compromise, policy disablement, rotation, and successful account registration/sign-in revoke the Guest credential server-side and clear it client-side. Rotation MUST atomically invalidate the predecessor. Missing, expired, revoked, malformed, cross-Guest, or CSRF-invalid credentials fail closed before provider dispatch. Provider credentials and secrets never enter Evidence, provenance, receipts, logs, or client payloads.

## 41. Principal and investigation isolation

Backend queries and object authorization MUST scope by principal membership and investigation, validate path/body/query equality, and prohibit cross-investigation object references. Guest searches, results, allowance rows, reservations, and operation receipts MUST scope to the server-held Guest identity. An identifier, browser `operatorId`, copied cookie, shared hash, or idempotency key alone conveys no access and MUST NOT reveal cross-Guest existence through payloads or distinguishable errors. Publication and revision approval recheck ownership/membership at execution time. Shared content-addressed bytes MUST not leak metadata or existence across principals.

## 42. Guest/session-local behavior

A Guest MAY perform a small, server-bounded, operator-funded Basic Search without creating an account. Its browser workspace and results are session-local, disposable, and carry explicit loss warnings; they cannot invoke the durable authenticated capture command. Search has zero Candidate Evidence, Research Inbox, Candidate Knowledge, Canon, graph, Manifold, Resolve, or REX effect. Anonymous Guest credential issuance grants no unlimited provider access. Before every dispatch the server MUST atomically check/reserve the per-Guest allowance and global operator budget and enforce bounded issuance/request throttles, origin/network/device or equivalent abuse controls, provider quotas, and the operator global shutoff. Exhaustion, indeterminate authority, unavailable durable coordination, disabled policy, or unavailable configuration fails closed before a provider call.

Successful registration or sign-in revokes/clears the Guest credential and establishes the ordinary authenticated session. It MUST NOT silently rebind, copy, capture, or transfer Guest searches/results into the account. Guest result capture is unresolved and deferred because current session-local Evidence ownership does not establish it; the authenticated durable capture route MUST reject Guests. Guest REX proposal preview and proposal adoption transfer are not implemented or claimed. The existing adoption contract does not transfer Candidate Evidence, Web Discovery results, proposal state, selection, or arbitrary Guest documents.

This contract authorizes, but does not claim implementation of, that behavior. The currently deployed authentication repository/schema has account-bound `authenticated_session` records and the current Web Discovery search/capture routes require an authenticated account principal. Implementation therefore requires a backward-compatible migration and repository/service/principal extension within the existing authentication owner for server Guest identity, expiring credential digest/revocation, allowance, and atomic operation/global-budget reservation state. No parallel authentication database, research session, Evidence repository, or provider runtime is authorized.

## 43. Saved-researcher durable behavior

A free authenticated researcher account provides durable investigation ownership and is required for persistent upload, durable Candidate Evidence, durable Research Inbox publication, Candidate Knowledge, and governed revision. It MAY be used indefinitely to organize researcher-provided material without funding the account, purchasing discovery, or buying REX execution, subject to disclosed operational, storage, bandwidth, safety, and abuse-prevention limits. Registration supplies no payment method, customer-charge authority, discovery purchase, or REX execution approval. Saving does not advance epistemic state.

## 44. UI capability and unavailable-state requirements

The EVIDENCE workspace MUST derive controls from authenticated/session capability, provider availability, supported media/limits, investigation/revision coherence, lifecycle eligibility, and cost authorization. Disabled or unavailable states MUST state why and what action is required. UI MUST distinguish unknown, zero, unavailable, loading, cancelled, stale, duplicate, failed, and unauthorized; MUST show origin/pathway, provenance, contradictions, persistence boundary, and cost before consequential actions; and MUST request explicit publication/revision approval.

Guest UI MUST permit the first eligible search before sign-up. After results, it MAY present one restrained **Save this investigation** action explaining that a free account supplies durable ownership and that current Guest search results are disposable. The action MUST NOT claim capture or transfer that is not implemented, and dismissing it MUST NOT disable the already authorized Guest search experience.

## 45. REX reconciliation

REX cost and authorization structures may supply reusable vocabulary, but REX does not own Web Discovery. Completed REX results remain review-only and later enter through the same EVIDENCE Candidate review boundary with execution and receipt lineage. `RexResearchInboxHydrator` automatic publication remains prohibited. Selected structures from untracked REX entity-discovery experiments MAY be reviewed and adopted individually into tracked owners; the directory is not authority and MUST NOT be adopted wholesale.

FREE Web Discovery and an operator-funded REX/Tavily trial action return metadata-only leads—URLs, titles, snippets, and provider metadata—and do not acquire or inspect webpage content, establish evidence, or create proposed graph changes. They are separate entitlements and authorization paths. REX execution remains account-owned, proposal-gated, and subject to explicit exact-plan approval. Operator-funded trial execution is distinct from future paid execution; account registration authorizes neither execution nor customer charge. Authenticated capture records a source LEAD in this existing Candidate Evidence owner, still awaiting inspection, without automatic Research Inbox publication. Guest capture is not established. Deeper acquisition/inspection and evidence-backed node/edge proposals are planned and inactive. Only a future separate researcher admission command may cause at most one deterministic operational Manifold revision. Providers, REX confidence/ranking, capture, review, registration, and payment have zero direct graph, Canon, or Manifold mutation authority.

## 46. Explicitly prohibited behavior

Prohibited are parallel EVIDENCE workspaces; second Candidate Evidence, Research Inbox, Candidate Knowledge, object-identity, provenance, or revision owners; provider- or REX-owned graphs; duplicated lifecycle enums; Google-specific core models; unrestricted uploads; execution of uploaded content; automatic admission/publication; Research Inbox creation without an explicit researcher choice; automatic Canon or Manifold mutation; hidden cost; paid epistemic privilege; silent contradiction resolution; stale publication; cross-investigation access; wholesale elevation of untracked experiments; and reinterpretation of KOD.

## 47. Deterministic fixture requirements

The first implementation MUST cover: zero-result search; one-result public URL; normalized URL duplicate; same URL with changed hash; attributed snippet without retained content; captured and uncaptured results; stale investigation response; stale revision response; cancelled zero-cost search; partial failure with actual and released cost; valid upload; unsupported MIME; excessive-size rejection; duplicate binary hash; unavailable URL content; researcher note; node proposal; directed-edge proposal; contradiction; explicit publication success; idempotent replay; cross-investigation rejection; governed revision success; and rejected proposal with zero Manifold effect.

Fixtures MUST be offline, provider-neutral, deterministic, versioned, non-secret, and unable to contact a live provider.

## 47A. Web Discovery API and errors

The currently implemented authenticated API operations are exactly:

```text
POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/searches
POST /api/v1/investigations/{investigation_id}/candidate-evidence/web-discovery/captures
```

Search MUST NOT create Candidate Evidence. Capture MUST NOT contact the provider and may mutate only Candidate Evidence plus the explicitly checked Research Inbox anchor described above. Neither route is Guest-safe by implication. Guest search implementation MUST extend this existing Web Discovery route/runtime/adapter and authentication repository boundary rather than create a parallel subsystem. Its server credential, cookie/CSRF, expiry/revocation, isolation, durable allowance/budget reservation, abuse-control, replay, uncertain-outcome, and sign-in semantics are governed above; exact schema/route names and numeric policy limits remain implementation choices. Stable Web Discovery errors are `WEB_DISCOVERY_UNAVAILABLE`, `WEB_DISCOVERY_RATE_LIMITED`, `WEB_DISCOVERY_PROVIDER_FAILURE`, `WEB_DISCOVERY_CANCELLED`, `WEB_DISCOVERY_SESSION_EXPIRED`, `WEB_DISCOVERY_RESULT_NOT_FOUND`, and `WEB_DISCOVERY_RESULT_MISMATCH`. Existing authentication, authorization, Investigation mismatch, revision conflict, validation, and idempotency errors MUST be reused where applicable.

## 48. Verification requirements

Verification MUST prove aligned frontend/backend structures and legal transitions; upload bounds, hashing, object integrity, cleanup, and restart durability; URL normalization and version behavior; provenance/contradiction preservation; authentication, cookie flags, CSRF, expiry/rotation/revocation, membership, principal and cross-Guest isolation; browser `guest:*`/`sessionStorage` non-authority; atomic durable pre-dispatch Guest allowance and global-budget reservation across workers/restarts with zero provider calls on rejection; bounded abuse controls/global shutoff; safe replay and non-duplicating uncertain-provider outcomes; cancellation/late-result rejection; idempotency and optimistic concurrency; publication receipt durability and atomic/recoverable Candidate Knowledge plus anchor creation; zero automatic Inbox/graph/Canon effects; cost reconciliation; Guest volatility, no-capture, and no-silent-sign-in-transfer disclosures; sign-up-free first search; REX restoration nonpublication; and one-new-revision behavior with prior revisions inspectable. Documentation verification MUST also prove SC-027 byte identity and exact authorized-file scope.

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

P57-EVIDENCE-WEB-I4A froze the earlier authenticated Web Discovery contract and verification. P57-EVIDENCE-WEB-GUEST-I1 governs the Guest search extension in documentation only; it changes no route, service, repository, migration, provider client, UI behavior, live REX setting, or application code.

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
15. A Guest may run the first eligible bounded Basic Search without registration; results remain session-local and disposable.
16. The server denies Guest dispatch before the provider call when Guest allowance, global operator budget, or provider configuration is unavailable.
17. Guest capture remains a follow-up boundary; current authenticated durable capture is not Guest-authorized.
18. A free account provides durable investigation ownership without implying funded discovery, REX execution, a payment method, or customer-charge authority.
19. REX execution remains account-owned, proposal-gated, and explicitly approved; operator-funded trial execution is distinct from future paid execution.
20. Browser Guest identity is never server authority; only the existing authentication owner's opaque expiring Guest credential binds the server-held Guest identity.
21. Guest allowance and global budget reservation are atomic and durable across workers/restarts, and replay or uncertain outcomes cannot duplicate paid work.
22. Credential issuance remains bounded by abuse controls and a global shutoff; it grants no unlimited provider access.
23. Registration/sign-in revokes Guest authority and does not silently transfer disposable results; Guests cannot call durable authenticated capture.
