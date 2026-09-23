# SC-030 — Investigation Library Mode and Overview Responsibility Architecture

**Status:** Normative Computational Canon

**Scope:** LIBRARY workspace mode and mode-specific shell; OVERVIEW/LIBRARY responsibility split; investigation preview, selection, visual-media provenance, intake, opening, and resumption boundaries

**Depends on:** SC-003 Investigation Manifold; SC-009 Manifold Instrument Architecture; SC-010 Investigative Provenance and Graph Revision Architecture; SC-012 Computational Projection Architecture; SC-019 Computational Knowledge Curation and Promotion Architecture; SC-021 Computational Operator Session Architecture; SC-027 Researcher-Directed Evidence Intake and Web Discovery

**Adopts:** [Canonical Investigation Architecture](../../../docs/canon/CANONICAL_INVESTIGATION_ARCHITECTURE.md); [P57-UI-A20 iSEES Front Door, Ownership, Research Intake and Provenance Canon](../../../P57-UI-A20-front-door-ownership-intake-provenance-canon.md); [P57-UI-A21 iSEES Guide Canon](../../../P57-UI-A21-isees-guide-deterministic-contextual-visual-guidance-canon.md)

**Supersession:** Where earlier front-door or intake guidance conflicts, this canon assigns operational investigation selection and the single governed candidate-event intake to LIBRARY and supersedes the direct intake-to-COMPARE transition with the Manifold-first transition defined here. It does not replace the existing activation, account continuity, Guide, System Canon, Evidence, Research Inbox, or Manifold authorities.

## 1. Purpose and normative force

This canon establishes **LIBRARY** as the governed investigation-selection and case-management workspace and establishes **OVERVIEW** as the calm first-contact and product-orientation workspace.

The terms **MUST**, **MUST NOT**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative. A future or planned capability named here is not thereby implemented, available, or authorized to fabricate data. Implementation MUST extend the existing authoritative owners identified by repository discovery.

## 2. Product identity and responsibility questions

The authoritative product name remains **iSEES: Integrated Systems Epistemology & Evaluation System**.

Its descriptor is **Deterministic investigative research environment**.

UAP is an initial research domain or profile. It is not part of the primary product identity. LIBRARY architecture MUST remain capable of supporting future iSEES research domains without weakening domain-specific authority or provenance.

The authoritative responsibility questions are:

| Surface | Governing question |
|---|---|
| OVERVIEW | What is iSEES, why does it exist, and where do I begin? |
| LIBRARY | What do I want to investigate? |
| MANIFOLD | What deterministic relationships exist in this investigation? |
| ANALYTICAL MODES | What does the evidence show? |
| STUDIO | What research product am I producing? |

## 3. Canonical mode order

The intended presentation and navigation order SHALL be:

1. OVERVIEW
2. LIBRARY
3. MANIFOLD
4. COMPARE
5. NARRATIVE
6. EVIDENCE
7. TIMELINE
8. LAYERS
9. INTENTION
10. STUDIO

If an existing internal contract uses an older identifier for STUDIO or another mode, implementation MUST preserve compatibility until a separately governed migration authorizes its removal. This presentation order does not itself rename unrelated internal contracts.

OVERVIEW and LIBRARY MUST remain available without an active investigation. Investigation-dependent modes retain their existing governed availability requirements.

## 4. OVERVIEW authority

OVERVIEW is the calm first-contact and product-orientation surface.

OVERVIEW MAY:

- identify iSEES and state its purpose and descriptor;
- explain deterministic investigative research and the overall research flow;
- present guided orientation and a written orientation alternative;
- present an **ENTER LIBRARY** action;
- present a lightweight **BRING YOUR OWN CASE** entry action that routes to the single governed Library intake path;
- present account invitations and accurate guest-session disclosures;
- reference System Briefing;
- later host a governed introductory video, improved audible first-contact walkthrough, transcripts, captions, replay, pause, resume, dismissal, and accessibility controls.

OVERVIEW SHALL NOT:

- own or manage operational investigation catalogs;
- browse or select System Canon events;
- browse external repositories as operational records;
- manage saved investigations or candidate-event intake state;
- open or resume investigations through a separate activation system;
- compute relationships or mutate Canon;
- silently establish an active investigation.

Future video and audible orientation are presentation concerns. They MUST NOT become part of Workspace Runtime, investigation activation, Library selection, Manifold computation, Canon mutation, or research-publication state.

## 5. LIBRARY authority

LIBRARY is the governed investigation-selection and case-management surface.

LIBRARY MAY:

- browse System Canon events and supported external research repositories;
- display accurate orientation-only repository entries;
- display local or session investigations and authorized saved investigations;
- search and filter records using existing available data;
- preview selected records;
- inspect event summaries, evidence coverage, provenance, authority status, and related objects;
- create a candidate event through the existing governed intake;
- explicitly open a qualified event in an investigation workspace;
- explicitly resume an authorized saved investigation;
- disclose guest versus authenticated persistence;
- later expose authorized archive, duplicate, and deletion commands.

LIBRARY SHALL NOT:

- compute deterministic relationships, run Resolve, or accept relationships;
- mutate System Canon or add material to the Research Inbox merely because a record was selected;
- imply that an orientation-only external repository is live;
- fabricate unavailable event, evidence, citation, repository, or investigation data;
- create a parallel workspace runtime, router, selection store, account library, persistence system, or activation engine.

### 5.1 Mode-specific Library shell

LIBRARY is a collection, preview, intake, and investigation-selection surface. It is not an analytical instrument workspace. Its shell composition therefore SHALL:

- omit the global left Navigator panel;
- omit the global right Selection Intelligence panel;
- neither render nor reserve space for the Research Inbox dock;
- give LIBRARY the full workspace width available between the application shell and the bottom mode bar.

This is an intentional mode-specific composition, not removal or weakening of shared analytical panels elsewhere. MANIFOLD and downstream analytical modes retain their established instrument panels. OVERVIEW remains governed by its separate orientation composition.

LIBRARY SHALL use the reclaimed space as one bounded, mode-local two-panel canvas. The left Library command region owns orientation, truthful current-investigation and persistence status, intake and resume commands, search, authority filters, and authorized investigation continuity. The right Library collection region owns System Canon cards, the selected-record preview, and external research records. These are internal LIBRARY regions, not restored global Navigator or Selection Intelligence side panels. Selection, activation, persistence, evidence, Canon, computation, and Research Inbox boundaries remain unchanged.

### 5.2 Mode-specific Overview shell

OVERVIEW SHALL omit the global left Navigator, global right inspection panel, and Research Inbox space. It SHALL use the full workspace width for one bounded, mode-local two-panel orientation canvas: an orientation/command region and a research-flow/identity region.

This visual similarity to LIBRARY does not create shared operational responsibility. OVERVIEW explains product identity, purpose, research philosophy, guided orientation, System Briefing, and the end-to-end research flow. Its entry actions route into LIBRARY-owned browsing and intake workflows. LIBRARY alone owns record selection, preview, intake state, activation, resumption, and investigation management.

## 6. Preview, selection, activation, and failure

Library selection is preview-only. Selecting any Library item SHALL NOT:

- activate an investigation;
- replace the active investigation;
- change the focused event or active workspace;
- import data;
- navigate to MANIFOLD;
- mutate Canon, compute relationships, publish research, or alter the Research Inbox.

Opening or resuming is a separate explicit command. For a populated, qualified investigation, the authoritative transition is:

`Preview in LIBRARY → explicit OPEN IN WORKSPACE or RESUME INVESTIGATION → atomic investigation activation → MANIFOLD`

Activation and target-mode publication MUST form one authoritative transition. An implementation MUST NOT publish an intermediate OVERVIEW state by performing activation and navigation as unrelated sequential commands.

A failed opening or resumption MUST leave the prior active investigation and mode unchanged and expose an accurate failure state. No successful qualified opening or resumption may unexpectedly return the researcher to OVERVIEW.

Manual navigation from MANIFOLD to LIBRARY or OVERVIEW MUST NOT deactivate, recompute, or discard the active investigation.

### 6.1 Mode-local preview behavior

When no Library record is selected, the collection SHALL use the full available width. No empty global inspector rail SHALL be shown. A neutral preview explanation MAY remain compact and mode-local.

When a record is selected on a wide display, the collection MAY narrow and a sticky mode-local **Library Preview** region MAY open beside it. The preview SHALL expose available governed record metadata, authority, image caption, image provenance, contextual-versus-evidentiary status, and explicit available actions.

On narrow displays, Library Preview SHALL become a drawer, overlay, or region beneath the selected card. It MUST NOT force the collection into an unusably narrow column.

Preview selection remains non-operational. Only an explicit **OPEN**, **RESUME**, **CONTINUE SETUP**, or governed intake action may change operational state, and each remains subject to its existing authority and success conditions.

### 6.2 Library header semantics

The Library workspace header MUST distinguish the active investigation, a current guest or session-local investigation, no active investigation, and a previewed Library record. Mode-appropriate labels include **ACTIVE INVESTIGATION**, **SESSION-LOCAL**, **NO ACTIVE INVESTIGATION**, and **PREVIEWING**.

LIBRARY MUST NOT label a merely previewed record as the **FOCUSED EVENT**. A previewed record MUST NOT replace active-investigation identity unless and until explicit activation succeeds.

## 7. Empty saved investigations

An authorized saved investigation with no focused event or operational content MUST NOT be sent into a misleading empty Manifold.

It SHALL remain in LIBRARY with a clear **CONTINUE SETUP** state until it has the minimum governed content required to begin investigation. The implementation MAY establish authorized ownership or identity as required, but MUST NOT represent an empty investigation as a populated analytical workspace.

## 8. Candidate-event intake

**BRING YOUR OWN CASE** on OVERVIEW is an entry affordance only. The governed form and mutation command SHALL exist once in LIBRARY and MUST reuse the existing intake authority.

Successful creation of a qualified candidate event MUST atomically establish the investigation and enter MANIFOLD. This Manifold-first flow supersedes the previous direct intake-to-COMPARE transition.

Cancelling intake SHALL return to LIBRARY without mutation.

## 9. Guest and authenticated behavior

### 9.1 Guest behavior

- Library browsing SHALL remain available without an account where existing policy permits.
- A guest MAY maintain the existing supported local or session investigation.
- Guest investigation state SHALL remain browser- or session-scoped according to the existing persistence owner.
- Opening Canon as a guest SHALL create local investigative work and MUST NOT fabricate a saved account investigation.
- Candidate-event intake SHALL remain governed and session-scoped.
- Guest-to-account adoption MAY preserve compatible Library-origin state through the existing adoption authority.
- Guest disclosures MUST remain visible and accurate.

### 9.2 Authenticated behavior

- Authorized saved-investigation summaries MAY appear in LIBRARY.
- Opening and resuming MUST use the existing account-continuity and authorization owners.
- Last-active-investigation restoration remains governed by those owners.
- Stale, unauthorized, missing, or malformed records MUST fail closed.
- LIBRARY MUST NOT create a second account-investigation store.

## 10. MANIFOLD boundary

MANIFOLD remains the first deterministic analytical workspace and owns:

- investigation topology and event-space manifold presentation;
- deterministic relationship analysis and relationship-candidate computation;
- candidate inspection;
- explicit relationship acceptance through existing authority;
- projection and view instruments.

LIBRARY MUST NOT absorb these responsibilities. Preview graphics in LIBRARY are explanatory projections and MUST NOT become a competing Manifold or computation authority.

## 11. Guide boundary

LIBRARY requires its own contextual iSEES Guide definition. The Library Guide SHALL explain:

- browsing versus opening;
- preview-only selection;
- guest versus saved persistence;
- candidate-event intake;
- explicit workspace activation;
- transition to MANIFOLD;
- protected Canon and computation boundaries.

The long-form guided orientation SHALL finish in LIBRARY rather than returning the researcher to OVERVIEW.

Future audible Library guidance SHOULD reuse the existing governed Guide narration, transcript, focus, dismissal, and accessibility infrastructure. It MUST NOT create a media-specific workspace state machine.

## 12. Featured UAP event library

LIBRARY MAY demonstrate iSEES through governed presentations of notable UAP events. Potential collections include naval encounters, aviation encounters, nuclear-site incidents, multi-sensor events, mass sightings, historical cases, witness-centered cases, and unresolved candidate events.

Potential event examples include the Nimitz Tic Tac Encounter, Rendlesham Forest Incident, Roosevelt Training Range Encounters, Belgian UFO Wave, Tehran 1976, Japan Air Lines Flight 1628, Phoenix Lights, Ariel School Encounter, and Malmstrom incidents. Their mention here neither creates Canon records nor asserts evidentiary status.

Every displayed event MUST expose its actual authority classification. Applicable classifications include:

- **SYSTEM CANON**;
- **ACCEPTED INVESTIGATION KNOWLEDGE**;
- **CANDIDATE EVENT**;
- **REFERENCE**;
- **PLANNED**;
- **UNAVAILABLE**.

Visual prominence MUST NOT imply canonical acceptance, factual certainty, causation, probability, proof, or truth.

## 13. Visual presentation and cognitive placement

Featured-event graphics SHOULD explain research structure rather than sensationalize the subject. Appropriate graphics MAY include maps, timelines, sensor participation, witness or platform topology, evidence-domain coverage, source lineage, small manifold previews, vessel or aircraft silhouettes, radar-style diagrams, licensed or public-domain archival imagery, and governed data-generated graphics.

Visual content MUST:

- preserve provenance and identify unavailable information;
- respect copyright and licensing;
- avoid fabricated documentary imagery;
- distinguish archival evidence from explanatory or decorative graphics;
- avoid presenting decorative illustration as evidence;
- provide accessible text alternatives.

Featured cards belong in the lower discovery section and SHALL NOT dominate first-contact or primary-task cognition. The authoritative vertical hierarchy is:

1. Library orientation and primary actions
2. Search and authority filters
3. Current guest work and owned investigations
4. System Canon and external records
5. Featured Events

This ordering supersedes the earlier placement of Featured Events before external repositories while preserving the intended cognitive flow: `Understand → choose an action → locate existing work → inspect governed collections → explore notable events`.

Featured graphics SHOULD have restrained visual weight until reached or intentionally engaged and MUST NOT displace primary actions above the fold. Autoplay, automatic motion, unsolicited narration, and visually dominant carousels MUST NOT interfere with onboarding or case management.

### 13.1 System Canon card imagery

System Canon event cards SHOULD support a governed visual header occupying approximately 35–45 percent of the card. Preferred visual classes are archival photography; contextual platform or location photography; maps; timelines; radar or sensor diagrams; restrained event topology; and clearly identified explanatory illustration.

The treatment SHALL remain documentary and scientific rather than sensational or cinematic. It SHOULD apply a coherent iSEES presentation treatment comprising dark navy grading, restrained contrast, a readable gradient beneath text, cyan structural accents, a stable aspect ratio, useful alternative text, and visible focus and selection states.

### 13.2 External-record imagery

External research records SHOULD use restrained institutional identity treatments rather than dramatic event imagery. They MAY use authorized institutional marks, repository identity graphics, restrained contextual icons, or a neutral placeholder when no governed asset exists.

External imagery MUST NOT imply partnership, endorsement, federation, live connectivity, System Canon authority, or evidentiary acceptance. Existing authority labels, including **EXTERNAL READING**, **REFERENCE**, and **PLANNED**, SHALL remain visually dominant.

### 13.3 Governed visual-asset contract

Every Library visual asset MUST have deterministic metadata sufficient to establish:

- asset ID and associated record ID;
- asset class, title, and caption;
- source and creator when known;
- license or usage authority;
- capture or publication date when known;
- useful alternative text;
- integrity reference or content hash when locally governed;
- whether the asset is archival, contextual, diagrammatic, or illustrative;
- explicit reconstruction or generated-image disclosure where applicable.

The authoritative asset classes are **ARCHIVAL**, **CONTEXTUAL**, **DIAGRAMMATIC**, **ILLUSTRATIVE**, **INSTITUTIONAL**, and **UNAVAILABLE**. Unknown metadata SHALL remain unknown or unavailable. Implementations MUST NOT fabricate provenance, dates, creators, licenses, or evidentiary meaning.

### 13.4 Contextual imagery and evidence boundary

Library imagery is presentational and contextual unless it is separately governed as evidence. Displaying an image on a Library card MUST NOT:

- make it Investigation Evidence;
- add it to Candidate Evidence or the Research Inbox;
- make it Canon evidence;
- assert that it depicts the event;
- imply authenticity or verification;
- participate in deterministic computation.

An image that is also governed evidence MUST retain its independent evidence identity, provenance, authority, and acceptance state. Illustrative, reconstructed, or generated material SHALL be conspicuously labeled and MUST NOT be visually indistinguishable from authenticated archival evidence.

An original generated contextual asset commissioned for iSEES MAY serve as a primary Library visual when it is classified **ILLUSTRATIVE · CONTEXTUAL**, carries the status **NOT_EVENT_EVIDENCE** and source type **ORIGINAL_GENERATED_ASSET**, and visibly states **AI-generated historical reconstruction. Not event evidence.** Its depiction MUST NOT authenticate people, light, positions, weather, landscape arrangement, infrastructure details, or any other event circumstance. A deterministic non-evidentiary fallback SHALL remain available, and neither visual acquires Canon, Evidence, Research Inbox, or computational authority through presentation.

## 14. Featured event card and Library Inspector

A featured event card MAY expose:

- event name, year or date range, and location;
- canonical or candidate identifier and authority status;
- research collection and evidence-domain participation;
- source or citation counts when authoritatively available;
- research completeness only when governed by a defined measure;
- a restrained explanatory graphic;
- **PREVIEW RECORD**.

A card SHALL NOT activate an event merely by selection, imply evidentiary completeness through design, fabricate a score or completeness percentage, present similarity as probability, present candidate material as accepted knowledge, use unsupported source counts, or bypass the Library Preview.

Selecting a record MAY present a mode-local Library Preview containing available governed fields such as event synopsis; time and place; classification; authority state; investigation vectors; participating entities; evidence availability; source and citation lineage; related events; persistence effect; image caption; asset class; source; attribution; license or usage status; contextual-versus-evidentiary status; and an explicit **OPEN IN WORKSPACE**, **RESUME INVESTIGATION**, or **CONTINUE SETUP** action.

The Library Preview MUST visibly distinguish preview from activation. Unknown values MUST remain unavailable rather than inferred or fabricated. Imagery MUST NOT be enlarged without retaining its caption and provenance.

### 14.1 Featured Events visual extension

Featured Events MAY later use richer maps, timelines, sensor diagrams, and topology graphics, but every such asset remains subject to the visual-asset contract and evidence boundary in this canon.

### 14.2 Responsive, performance, and accessibility requirements

Library visual presentation SHALL provide:

- responsive image sizing and stable dimensions that avoid layout shift;
- lazy loading for imagery below the initial viewport;
- optimized local assets or governed delivery paths;
- useful alternative text;
- keyboard-operable cards and visible focus states;
- reduced-motion compliance for any future animated graphics;
- a deterministic fallback when an asset is unavailable or fails to load.

A missing or failed image MUST NOT prevent record selection, preview, opening, or resumption.

## 15. Persistence and compatibility

A production-complete implementation MUST adopt LIBRARY in:

- frontend mode contracts, ordering, labels, availability, navigation, and shell presentation;
- Guide definitions;
- persistence and reload compatibility;
- guest-to-account adoption vocabulary;
- backend accepted mode literals where applicable;
- exhaustive mode-indexed records;
- regression verification.

Compatible persistence MUST restore LIBRARY when the researcher was browsing without activating a case and MUST restore MANIFOLD after successful activation. Invalid or unsupported persisted state MUST use an accurate governed fallback without inventing an investigation or silently activating one.

Compatibility aliases MAY remain while required by current persistence or internal contracts and SHOULD be removed only through a safe, verified migration.

## 16. Implementation governance

Implementation SHALL extend and reuse:

- Workspace Runtime;
- existing investigation activation;
- existing Overview/front-door catalog projections;
- existing selection and inspection contracts where appropriate;
- existing guest persistence and account continuity;
- existing Guide infrastructure;
- existing System Canon and repository projections.

Implementation SHALL NOT create:

- a parallel router or second mode runtime;
- a duplicate account-investigation store;
- a second candidate-event intake;
- a competing activation command;
- a new backend service merely for mode separation;
- a media-specific workspace state machine.

Before implementation, repository discovery MUST identify the current owner of each responsibility. This canon authorizes the responsibility split, not unbounded redesign.

## 17. Preferred implementation increments

### I1A — Mode foundation

- Add LIBRARY to the existing mode contract.
- Add ordering, label, availability, routing, shell presentation, Guide definition, and compatibility adoption.
- Create a composition-ready Library workspace.
- Preserve current Overview operational behavior temporarily.

### I1B1 — Shared authority preparation

- Hoist or rename existing selection and activation providers.
- Expose existing authorized account-open commands through the shared owner.
- Add atomic qualified activation to MANIFOLD.
- Adopt LIBRARY in backend compatibility literals.

### I1B2 — Operational extraction

- Move or compose existing catalogs, repositories, summaries, previews, Inspector, intake, opening, import, and resumption under LIBRARY.
- Add only local filtering over existing records.
- Preserve capability disclosures.

### I1C — Calm Overview

- Remove operational catalogs and dashboards from OVERVIEW.
- Add **ENTER LIBRARY**.
- Route **BRING YOUR OWN CASE** to the shared Library intake.
- Retain orientation and future media or audible extension points.

### I1D — Regression and compatibility

- Complete reload, guest/account adoption, Guide, accessibility, keyboard, mode-indexed-record, and authority regression gates.
- Remove compatibility aliases only when safe.

These increments define preferred sequencing. They do not authorize runtime change within this Canon-adoption task.

### I2 — Library visual records and mode-specific spatial architecture

The recommended incremental sequence is:

1. **I2A — Visual-asset contract and registry foundation**
2. **I2B — Mode-specific full-width Library shell**
3. **I2C — System Canon image-led card composition**
4. **I2D — External institutional identity cards**
5. **I2E — Responsive mode-local Library Preview**
6. **I2F — Featured Events graphical collection**

Implementation MAY divide these increments further, but MUST preserve the ownership, authority, activation, evidence, and mode-shell boundaries established by this canon.

## 18. Normative invariants

1. OVERVIEW orients; LIBRARY selects and manages cases; MANIFOLD computes deterministic relationships.
2. Selection is preview-only; opening and resuming require an explicit command.
3. Qualified activation and publication of MANIFOLD as the target mode are atomic.
4. Failed activation preserves the prior investigation and mode.
5. Empty saved investigations remain in LIBRARY with **CONTINUE SETUP**.
6. Candidate-event intake has one governed mutation path in LIBRARY.
7. Successful qualified candidate creation enters MANIFOLD, not COMPARE.
8. Guest and account persistence reuse their existing owners.
9. Library presentation never strengthens epistemic authority or fabricates availability.
10. LIBRARY neither computes relationships nor mutates Canon or the Research Inbox through selection.
11. UAP is a domain profile, not the iSEES product identity.
12. Existing runtimes, stores, activation, intake, Guide, and projection owners are extended rather than duplicated.
13. LIBRARY and OVERVIEW receive distinct mode-local full-width shells; analytical modes retain their established instrument panels, and the two-panel similarity does not transfer operational responsibility to OVERVIEW.
14. Library visual assets have deterministic provenance metadata and remain presentational unless independently governed as evidence.
15. Library Preview is mode-local, responsive, and never substitutes preview identity for active-investigation identity.

## 19. Acceptance obligations for implementation

Any production implementation claiming conformance MUST verify:

- the complete mode order and governed availability rules;
- preview-only selection and explicit activation;
- atomic activation-to-MANIFOLD success and no-effect failure;
- empty-investigation **CONTINUE SETUP** behavior;
- single intake ownership and cancellation without mutation;
- guest, authenticated, adoption, reload, and invalid-state behavior;
- manual navigation without deactivation or recomputation;
- Guide content, keyboard behavior, focus, disclosures, and accessibility;
- truthful repository and featured-event availability and authority labels;
- mode-specific full-width Library composition without global Navigator, Selection Intelligence, or Research Inbox space;
- mode-specific full-width Overview composition without global operational panels or Research Inbox space;
- Overview entry actions route into Library-owned workflows without taking ownership of browsing, preview, intake state, activation, or resumption;
- responsive Library Preview behavior and accurate active, session-local, empty, and preview header semantics;
- deterministic visual-asset metadata, fallback behavior, accessibility, provenance, and contextual-versus-evidentiary disclosure;
- confirmation that imagery neither changes authority nor enters evidence, Inbox, Canon, or computation merely through display;
- absence of duplicate runtime, router, persistence, intake, and activation owners.

## 20. Canonical conclusion

LIBRARY answers what the researcher wants to investigate. OVERVIEW explains what iSEES is and where to begin. MANIFOLD remains the first deterministic analytical workspace.

This separation preserves a calm front door, an explicit governed selection boundary, a Library-specific full-width collection and preview shell, and one authoritative transition into investigation without weakening existing computation, provenance, ownership, persistence, Guide, System Canon, Evidence, or publication authority.
