# SC-028 — Governed Frontier Agent Research Authorization

**Status:** Canonical product and architecture direction

**Category:** Governed Research Authorization, Account Budget, and Commercial Boundary Architecture

**Scope:** iSEES Web Discovery, Tavily, Frontier Agents, REX, account budgets, and governed research operations

**Depends on:** SC-025 REX Recursive Epistemic Exploration and Deterministic Normalization; SC-026 REX Frontier Agents; SC-027 Researcher-Directed Evidence Intake and Web Discovery

**Foundational rule:** iSEES may sell and authorize bounded research effort. It must never sell conclusions, evidence status, graph mutation, or truth.

## 1. Purpose

This canon defines how free Web Discovery, Tavily, iSEES Frontier Agents, REX, researcher authorization, account budgets, and commercial operations fit together without weakening iSEES epistemic governance.

The model exists to preserve four objectives simultaneously:

1. A person may encounter and use iSEES with zero initial commitment.
2. Research operations may scale beyond manual searching through governed agents.
3. Researchers remain the sole authority over what they capture and advance.
4. iSEES may operate sustainably without concealing behavior or selling epistemic privilege.

Commercial success is permitted, but it is subordinate to the integrity of the research system.

## 2. Canonical philosophical division

- **Tavily discovers where information may exist.**
- **AI and Frontier Agents organize and explain possible leads.**
- **The researcher decides what deserves review.**
- **iSEES governance decides what may progress.**
- **The deterministic Manifold represents only accepted state.**

Tavily is not an evidence authority, inference authority, acquisition service, research agent, AI authority, or epistemic decision-maker.

A Frontier Agent is not an autonomous owner of an Investigation. It is a bounded executor operating under an explicit researcher-approved authorization envelope.

## 3. Tavily's role

Tavily is the approved v1 live Web Discovery provider. It is a server-side discovery pipe that returns possible public references in a structured form.

Tavily may return bounded provider metadata such as:

- Result identity
- Title
- URL
- Source domain
- Short snippet
- Attribution
- Media type when supplied
- Provider metadata and retention restrictions

All provider-returned titles, snippets, classifications, and metadata are untrusted.

Search results are **ephemeral discovery references**, never evidence. Search creates zero Candidate Evidence. Tavily does not create Investigation Evidence, Research Inbox entries, Curated Context, Candidate Knowledge, Canon records, nodes, edges, Manifold state, Resolve state, Studio artifacts, or publications.

Neither iSEES nor Tavily capture may automatically fetch, crawl, extract, download, follow redirects from, or acquire a provider-returned result URL. A researcher may independently visit a public URL and evaluate the source outside the governed capture operation.

## 4. Zero-commitment first contact

iSEES shall preserve a free and immediate front door comparable in simplicity to a public search engine:

- No signup required for first use.
- No payment method required.
- No subscription commitment required.
- No Tavily account or API key required from the visitor.
- No AI or agent authorization implied by visiting or searching.

An anonymous visitor may receive a modest protected allowance of live Web Discovery. Anonymous results remain ephemeral. Persistent Investigation ownership, durable Candidate Evidence, larger allowances, REX, collaboration, and Frontier Agent missions may require an iSEES account.

Anonymous access may be protected through unobtrusive platform safeguards including session allowances, network rate limits, query bounds, concurrency limits, anomaly detection, platform-wide spending ceilings, and a kill switch. CAPTCHA or stronger friction should appear only when abuse is suspected, not as the ordinary first-contact experience.

## 5. Provider pooling and account metering

Tavily credentials and provider credits are server-owned and pooled by iSEES. Researchers must never be required to establish individual Tavily accounts or expose Tavily keys to the browser.

iSEES maintains its own account-usage ledger. The customer-facing unit is the **iSEES Research Credit**, not the Tavily provider credit.

| Unit | Definition | Visibility |
|---|---|---|
| Provider credit | A vendor consumption unit, such as a Tavily API credit | Internal only |
| Provider cost | The amount iSEES pays a vendor | Internal only |
| Internal service cost | Infrastructure, storage, AI, support, and operational allocation | Internal only |
| Research Credit | Customer-facing unit for governed iSEES capability | Researcher-visible |
| Authorized ceiling | Maximum Research Credits approved for an operation | Researcher-visible |
| Reserved credits | Credits temporarily held for an authorized operation | Researcher-visible |
| Actual consumption | Credits charged after execution reconciliation | Researcher-visible |
| Released credits | Unused reserved credits returned to the account | Researcher-visible |
| Gross margin | iSEES commercial economics | Private |

Research Credits need not equal Tavily credits. They may represent a governed package of search, computation, agent work, REX acceleration, storage, and infrastructure.

## 6. Commercial transparency boundary

iSEES transparency concerns authority, behavior, provenance, restrictions, account charges, and epistemic state. It does not require disclosure of private commercial economics.

Researchers should see:

- What operation is proposed
- What capabilities it may use
- What it may and may not alter
- Estimated Research Credit consumption
- Maximum authorized charge
- Available account balance
- Reservation and refund behavior
- Actual consumption after execution

Researchers should not see:

- Tavily wholesale or negotiated pricing
- Vendor discounts or contract terms
- Infrastructure allocation
- Model-token cost
- Internal markup
- Gross margin
- Internal routing economics

Customer-facing language shall use **Research Credits**, **estimated charge**, **maximum authorized charge**, and **account price**. The term **provider cost** remains internal.

## 7. Frontier Agent research proposal

Before a Frontier Agent may spend credits or call an external provider, it must present a bounded Research Proposal to the researcher.

The proposal is simultaneously:

- A research plan
- A permission request
- A budget authorization
- A capability boundary
- A prospective audit contract

The presentation may use familiar store-transaction patterns because review, authorization, reservation, reconciliation, and receipt are understandable commercial interactions. However, the researcher purchases a bounded research operation—not an answer, conclusion, item of evidence, confidence score, or guaranteed result.

Every proposal must disclose:

- Mission and research question
- Proposed search strategy
- Agent identity and version
- Permitted providers and capabilities
- Maximum number of searches
- Maximum duration
- Allowed or excluded domains
- Expected deliverable
- Retention rules
- Candidate Evidence authority
- Research Inbox authority
- Graph and Manifold authority
- Canon authority
- Publication authority
- Estimated Research Credits
- Maximum Research Credits
- Available account balance
- Expiration and cancellation rules
- Unused-credit return policy

The researcher may authorize, modify, decline, or save the proposal for later.

### 7.1 Approved commercial transparency amendment

For an implemented paid execution, customer-visible disclosure MUST separately identify the **Tavily provider charge**, **disclosed iSEES service margin**, **maximum authorized total**, and actual reconciled final charge. A disclosed percentage is a service markup over provider cost, not a gross-margin percentage. Internal credentials, provider contracts, negotiated rates, security controls, and unrelated implementation details remain private.

Proposal creation is free. A complimentary first focused discovery is a future eligibility policy, not an implemented entitlement. No execution may begin before explicit authorization; the final charge MUST NOT exceed the authorized maximum. Additional or revised cost requires a revised proposal and new approval, and specialized providers require separate disclosure and authorization.

This amendment supersedes prior customer-facing language that made provider cost categorically internal or required Research Credits as the sole customer unit. The present runtime remains planning-only: billing is disabled, displayed amounts are illustrative rather than quotes or active prices, and Tavily credits are not converted into customer currency.

## 8. Canonical authorization envelope

An approved mission produces an immutable authorization envelope bound to:

- One principal or authorized institutional actor
- One Investigation where applicable
- One proposal revision
- One mission identity
- One agent identity and version
- A fixed capability set
- A maximum search count
- A maximum time window
- A maximum Research Credit charge
- A provider and service allowlist
- Explicit forbidden mutations
- Expiration and cancellation conditions

The execution capability should be short-lived and mission-specific. An agent must never receive a general-purpose Tavily key, open-ended spending authority, publication authority, or reusable mutation capability.

Authorization must be explicit. Silence, page navigation, search entry, account creation, or prior authorization must never imply approval of a new mission.

## 9. Reservation, execution, and reconciliation

The canonical transaction lifecycle is:

1. **PROPOSED** — The agent presents the mission and estimated charge.
2. **MODIFIED** — The researcher may narrow or alter permitted scope.
3. **AUTHORIZED** — The researcher approves an exact maximum charge.
4. **RESERVED** — iSEES holds the maximum approved Research Credits.
5. **EXECUTING** — The mission operates only within the envelope.
6. **COMPLETED, CANCELLED, EXPIRED, or FAILED** — Execution terminates deterministically.
7. **RECONCILED** — Actual usage is calculated once.
8. **RELEASED** — Unused reserved credits are returned.
9. **RECEIPTED** — An immutable execution receipt is available.

Charging must be idempotent. Retries, duplicate browser commands, refreshes, or repeated callbacks must not create duplicate reservations or charges.

Failure must not silently expand authority, invoke a different paid provider, exceed the approved ceiling, or convert partial results into evidence.

## 10. Execution receipt

Every authorized mission shall produce a researcher-visible receipt containing at least:

- Mission identity
- Proposal and authorization revision
- Authorized ceiling
- Actual Research Credits consumed
- Credits released
- Start and completion time
- Terminal status
- Searches attempted and completed
- Provider-neutral operation counts
- Discovery references returned
- Candidate Evidence created: normally zero unless separately confirmed by the researcher
- Research Inbox changes: zero
- Graph and Manifold changes: zero
- Canon changes: zero
- Publications: zero
- Sanitized failures or restrictions

The receipt demonstrates what the system did, what it charged, what it returned, and what it did not alter. It must not expose provider keys, private vendor economics, secrets, or unsafe diagnostic details.

## 11. Agent roles

Permitted Frontier Agent roles may include:

- **Discovery Agent:** finds potentially relevant public references.
- **Gap Agent:** searches for information missing from the current Investigation.
- **Contradiction Agent:** seeks independent or conflicting accounts.
- **Entity Agent:** searches for possible records concerning a person, organization, facility, artifact, or system.
- **Timeline Agent:** searches for date-specific publications and events.
- **Watch Agent:** proposes or performs separately authorized recurring discovery.
- **Source Diversity Agent:** seeks independent source types and exposes source dependency.

Agents may formulate queries, expand terminology, deduplicate references, cluster leads, explain possible relevance, and identify gaps or contradictions.

Agents may not establish truth, evidence status, confidence, causality, canonical identity, graph membership, publication, or admission merely through inference or provider output.

## 12. Evidence and Manifold progression

The governed progression is:

1. Tavily returns ephemeral references.
2. An authorized agent may organize those references into a review package.
3. The researcher selects a specific reference.
4. A separate explicit capture confirmation may create exactly one review-only Candidate Evidence item.
5. Candidate Evidence remains outside Investigation Evidence, Research Inbox, Curated Context, Candidate Knowledge, Canon, and the Manifold.
6. Separate governed review may admit or reject material.
7. Separate deterministic processes may propose candidate nodes or edges.
8. The researcher or authorized governance process explicitly accepts or rejects each canonical change.
9. The Manifold recomputes only from accepted state.

Discovery may reveal the possibility of new people, organizations, facilities, locations, artifacts, events, hypotheses, or relationships. Possibility alone creates no canonical node or edge.

## 13. REX relationship

REX remains optional paid acceleration beyond free Web Discovery.

REX may be included as a separately identified capability inside a Frontier Agent proposal. Its estimated Research Credit use, authorization ceiling, and deliverable must be visible before approval.

REX does not inherit graph, evidence, Canon, or publication authority from a research authorization. REX output remains analytically distinct from accepted deterministic state unless it passes through the appropriate governed progression.

## 14. Account model

The intended account spectrum is:

- **Anonymous guest:** zero commitment, immediate limited Web Discovery, ephemeral results.
- **Free researcher:** persistent account and Investigation ownership with a larger included allowance.
- **Paid researcher:** included Research Credits and higher bounded capability.
- **Professional researcher:** larger allowances, advanced agents, REX options, and additional workspace capability.
- **Institutional account:** pooled budgets, spending policies, approval roles, audit exports, and administrative controls.
- **Additional usage:** optional purchase of Research Credits without changing epistemic authority.

Payment never purchases evidence admission, confidence, favorable inference, Canon status, graph placement, publication priority, or a predetermined conclusion.

## 15. Abuse, safety, and spending controls

iSEES must protect both researchers and the platform through:

- Per-session and per-account allowances
- Server-side rate and concurrency limits
- Maximum query and result bounds
- Provider circuit breakers
- Per-mission and platform-wide spending ceilings
- Explicit provider modes
- No silent paid fallback
- Cancellation and expiry
- Principal and Investigation isolation
- Sanitized diagnostics
- Secret protection
- Auditable reservations, consumption, and release
- Administrative kill switches

Abuse controls should remain nearly invisible to legitimate first-time users.

## 16. Non-negotiable prohibitions

No search, agent, REX operation, payment, subscription, or Research Credit authorization may automatically:

- Create or admit Investigation Evidence
- Add to the Research Inbox
- Create Curated Context or Candidate Knowledge
- Create or modify Canon
- Create or modify nodes or edges
- Alter the Manifold
- Execute Resolve acceptance
- Produce a Studio publication
- Publish externally
- Fetch or acquire a provider-returned result URL without separate authority
- Exceed the approved account ceiling
- Expose provider secrets or internal margin

## 17. Product promise

iSEES offers an unusually simple promise:

> Enter freely. Search without commitment. Authorize only the research you understand. Pay only within the ceiling you approve. Review every lead yourself. No vendor, agent, AI model, or payment can turn a discovery reference into evidence or truth.

This model permits iSEES to remain a public-purpose research system while becoming a sustainable and potentially substantial business. The economic model emerges from the same principles as the epistemic model: explicit authority, bounded operations, visible account impact, auditable execution, and researcher control.

## 18. Implementation order

1. Complete the server-owned Tavily runtime foundation.
2. Preserve manual Web Discovery as the free researcher-controlled capability.
3. Implement provider-neutral runtime status and safe UI states.
4. Validate local and cloud Tavily configuration without exposing keys.
5. Define Research Proposal and Authorization Envelope schemas.
6. Implement account budgets, reservations, cancellation, expiry, and reconciliation.
7. Implement immutable execution receipts.
8. Introduce Frontier Agents only after authorization and accounting foundations exist.
9. Add REX as an optional, separately disclosed capability within the same envelope.
10. Add institutional pooled budgets, approval roles, and audit policy after the single-researcher lifecycle is proven.

---

**Canonical conclusion:** Tavily supplies bounded discovery. Frontier Agents propose bounded work. Researchers authorize scope and account impact. iSEES meters and audits execution. Researchers alone decide what advances. Commercial value may scale, but epistemic authority is never for sale.
