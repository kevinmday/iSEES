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

A researcher MAY perform public-web research through provider-neutral Web Discovery. A Guest MAY run a small server-bounded, operator-funded Basic Search before creating an account. Guest results belong only to the existing volatile Guest workspace/session authority and are disposable discovery references. Search alone creates no durable Candidate Evidence, Research Inbox entry, Canon assertion, graph mutation, or Manifold revision.

Authenticated capture remains distinct from search: deliberately captured results become durable Candidate Evidence and enter the same review lifecycle as other intake material. Existing session-local Evidence ownership does not yet establish an authorized Guest Web Discovery capture operation. Guest capture is therefore a follow-up boundary; implementations MUST NOT expose the authenticated durable capture endpoint to a Guest or imply that selecting a Guest result durably captures it.

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

Guest and authenticated search MUST reuse the existing Web Discovery runtime and provider adapter. Server Guest authority MUST be a compatible extension of the existing authentication/session owner, repository, and migration chain; it MUST NOT create a parallel research session, authentication authority, provider integration, Evidence store, admission path, or workspace authority. The frontend's `guest:*` `operatorId`, Guest workspace snapshot, and `sessionStorage` contents remain disposable UI identity and recovery state only. They are untrusted correlation/display claims and never authenticate a request, authorize provider spend, identify the server-held Guest principal, or supply allowance state.

The authentication/session owner MUST bootstrap a server-held opaque Guest identity and issue a high-entropy, expiring credential whose verifier is stored only in protected form. The credential MUST be sent in a host-only cookie using the established cookie policy: `HttpOnly`, `SameSite=Strict`, `Secure` in production, the minimum compatible path (currently `/`), explicit `Max-Age`/expiry, and no script-readable bearer value. Guest state-changing or cost-bearing requests MUST use the existing double-submit CSRF cookie/header contract or an equivalently strong protection owned by that same authentication boundary; credential issuance itself MUST validate the allowed site/origin or equivalent fetch context and remain rate/abuse limited. Expiry, logout, suspected compromise, policy disablement, sign-in, and rotation revoke the old credential server-side; rotation is atomic and old credentials cannot race successfully after replacement. A missing, expired, revoked, malformed, or mismatched credential fails closed without provider dispatch.

Guest identities, allowances, operations, and results MUST be isolated by the server-held Guest identity. No browser identifier, result identifier, idempotency key, cookie copied from another Guest, shared content hash, or timing difference may reveal or access another Guest's existence, allowance, operation, or results. Successful account registration or sign-in revokes and clears the Guest credential and establishes the normal authenticated principal. It MUST NOT silently rebind, copy, capture, or transfer Guest searches or results into the account; a future explicit adoption contract would require separate authority.

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

Before any Guest provider dispatch, the server MUST independently authorize both the server-held Guest identity's small allowance and the global operator-funded provider budget. In one durable atomic transaction shared across workers, it MUST bind an idempotency key and governed request fingerprint to one operation, consume or reserve the per-Guest allowance, reserve the global budget, and persist a pre-dispatch state before the provider call. Missing or unavailable provider configuration, exhausted Guest allowance, exhausted global budget, or unavailable durable coordination MUST fail closed without a provider call. Browser-provided identity, eligibility, counters, result counts, or budget values grant no authority. Anonymous credential issuance alone grants no provider entitlement: bounded origin/network/device or equivalent abuse controls, request throttles, provider quotas, and an operator global shutoff remain authoritative and MUST be checked before dispatch.

An equivalent replay returns or polls the original operation and MUST NOT dispatch again or reserve again; reuse of a key with different governed input fails closed. A definitely undispatched failure atomically releases its reservations. After dispatch begins, timeout, cancellation, worker loss, or an ambiguous provider response is an uncertain outcome: the operation remains terminal or reconcilable as `UNKNOWN`, its allowance/budget reservation is conservatively retained or charged according to provider reconciliation, and neither automatic retry nor a new client key may duplicate the paid call. Only provider-supported idempotency or authoritative reconciliation proving non-dispatch may permit a retry. Late provider completion attaches only to the original operation and cannot create durable Evidence or silently re-enter the active UI.

The first Guest search MUST NOT require registration. After useful results are shown, the interface MAY offer a restrained **Save this investigation** path that explains the volatility boundary and creates or signs into a free account for durable investigation ownership. Declining or postponing that action MUST leave the initial Guest search usable; it MUST NOT retroactively make Guest results durable.

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

REX execution remains account-owned, proposal-gated, and explicitly approved. An operator-funded trial execution is a distinct governed entitlement from any future paid execution; registration alone creates neither execution authority nor payment authority and authorizes no customer charge. Guest Web Discovery allowance MUST NOT be interpreted as Guest REX eligibility.

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

A free account supplies durable investigation ownership. It MAY be used indefinitely to organize researcher-provided material without funding the account, purchasing Web Discovery, or buying REX execution, subject only to disclosed operational, storage, bandwidth, safety, and abuse-prevention limits. Registration MUST NOT imply a payment method, customer charge authorization, or consent to future paid discovery.

If a researcher may be charged for Web Discovery, the nonzero estimate MUST be visible before invocation. Any customer contingency authorization MUST be explicit, bounded, and reconciled into a final charge and released authorization. Operator-funded Guest Basic Search instead displays customer charge `$0.00`; its server-owned provider budget and reconciliation do not create customer payment authority. Cancellation and failure MUST preserve actual incurred operator or customer cost and release unused authorization according to the governing cost contract.

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
16. **Useful free workflow:** A Guest can perform a first bounded Web Discovery search without registration, and a free account can durably organize researcher-provided material without paid REX or purchased discovery. Authenticated researchers can capture URLs, upload varied evidence, write notes, propose nodes and edges, review provenance, publish deliberately, and initiate governed revision.
17. **Guest authority boundary:** Browser `guest:*` identity and `sessionStorage` grant no server authority; an opaque expiring credential bound to a server-held Guest identity is required.
18. **Guest dispatch governance:** Durable atomic per-Guest allowance and global-budget reservation fail closed before dispatch; replay and uncertain outcomes cannot duplicate paid work.
19. **Guest abuse boundary:** Credential issuance alone grants no unlimited access; bounded abuse controls and the global shutoff remain authoritative.
20. **Guest capture boundary:** Guest results are disposable and cannot invoke authenticated durable capture; registration/sign-in does not silently transfer them.
21. **REX/payment separation:** REX execution is account-owned, proposal-gated, and explicitly approved; registration grants neither execution nor customer-charge authority.
22. **No silent progression:** No pathway silently skips Discovery, Candidate Evidence, Researcher Review, Explicit Publication, Candidate Knowledge, or Governed Revision.
23. **Stale safety:** Stale responses cannot silently affect the active investigation or revision.

Failure of any invariant is a conformance failure, not an optional product limitation.

## 23. Conclusion

iSEES is a governed environment where ordinary investigation can occur from discovery through revision. EVIDENCE uploads and Web Discovery form the free researcher-directed foundation. REX provides optional governed acceleration.

FREE Web Discovery is always a metadata-only lead search for the researcher: URLs, titles, snippets, and metadata. It does not fetch or inspect webpages, establish evidence, propose accepted facts, create nodes or edges, or mutate the Manifold. Explicit capture records a source LEAD in the existing Candidate Evidence owner, still awaiting inspection. A future substantive REX expansion is separate: a selected node/edge and researcher notes may inform a free bounded proposal, but acquisition and inspection require explicit approval. Returned references require explicit Candidate Evidence capture and review; supported proposed nodes/edges require a separate researcher admission decision; and accepted input may produce one deterministic operational Manifold revision. Providers, confidence, ranking, warnings, capture, payment, and account creation have zero direct admission, graph, Canon, or Manifold mutation authority.

Disposable Guest Web Discovery search is authorized product direction and MUST extend the existing Web Discovery runtime/adapter and existing server authentication/session repository and schema through a compatible migration. The currently deployed implementation has account-bound `authenticated_session` authority and authenticated-only search/capture routes; it has no server Guest credential, Guest allowance/budget reservation schema, or Guest-safe route. This canon amendment defines implementation authority but does not claim those extensions are deployed. Guest results cannot call durable authenticated capture. Guest result capture, Guest REX proposal preview, and proposal adoption transfer are not implemented or claimed. The existing adoption contract does not transfer Candidate Evidence, Web Discovery results, proposal state, selection, or arbitrary Guest documents. A later **Save this investigation** implementation MUST explicitly define what may be adopted; until then registration or sign-in creates no transfer by implication.

All pathways converge on the same human-controlled EVIDENCE, Research Inbox, and Manifold revision boundaries. Many mechanisms may broaden what a researcher can see; none may silently decide what the investigation knows.
