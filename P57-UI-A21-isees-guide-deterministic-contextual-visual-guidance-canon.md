# P57-UI-A21 — iSEES Guide: Deterministic Contextual and Visual Guidance Canon

Status: CANONICAL
Version: 1.0
Project: iSEES — Emergence Detection System
Capability: iSEES Guide
Classification: System-wide deterministic guidance
Complements: P57-UI-A20 — Front Door, Ownership, Intake and Provenance Canon

---

## 1. Canonical Decision

iSEES shall provide a persistent, mode-aware and state-aware guidance capability named **iSEES Guide**.

It helps the researcher answer:

1. Where am I?
2. What is happening here?
3. Why does this state matter?
4. What can I do next?
5. Where is the relevant control?
6. What will happen if I use it?
7. What will remain unchanged?

The Guide must make iSEES approachable without requiring the researcher to first understand its internal architecture, mathematical model, authority boundaries, or specialized terminology.

The Guide is not an AI authority. Its operational truth must be derived from deterministic application state.

## 2. Governing Promise

> At every meaningful system state, a researcher can discover where they are, understand why the state matters, and locate the safest productive next action without leaving their workflow.

## 3. Human-Centered Principle

iSEES is technically sophisticated, but its interface must not require researchers to think like its system designers.

The canonical presentation order is:

1. Understanding
2. Orientation
3. Productive action
4. Terminology
5. Mathematics and provenance machinery on demand

## 4. Canonical Terminology

The capability is named **iSEES Guide**.

Its engineering description is **Deterministic Contextual and Visual Guidance**.

The interface should normally display **GUIDE** or a consistent Guide icon with an accessible text label.

A new unexplained acronym shall not be introduced.

## 5. Relationship to IDI

IDI and iSEES Guide are complementary but distinct.

**IDI — iSEES Deterministic Insight** answers:

> What does this metric or finding mean?

The current IDI type is **IDI · Metric Finding**.

The preferred user-facing invitation is **WHY IT MATTERS**.

**iSEES Guide** answers:

> Where am I, what is the system state, and what should I do next?

IDI is object-centered. iSEES Guide is workflow-centered.

## 6. Relationship to Other Guidance

| Capability | Canonical question |
|---|---|
| Tooltip | What is this control? |
| IDI | What does this metric or finding mean? |
| iSEES Guide | Where am I, and what can I do next? |
| System Briefing | What is happening across the investigation? |

Their responsibilities must remain distinguishable.

## 7. System-Wide Scope

iSEES Guide applies across:

- Front Door
- Account creation and login
- Investigation Library
- Investigation creation and activation
- OVERVIEW
- MANIFOLD
- COMPARE
- NARRATIVE
- EVIDENCE
- TIMELINE
- LAYERS
- INTENTION
- STUDIO
- Research Inbox
- New Leads
- Incoming Sources
- Collected Findings
- Candidate Knowledge
- Source Integrity
- REX when introduced

## 8. Persistent Access

The Guide must have one stable and recognizable access point.

Researchers must not need to remember which panel, MODE, or menu contains help.

Opening the Guide must not:

- Leave the active MODE
- Resurface the Front Door
- Clear the current selection
- Lose a comparison pair
- Reset an experiment
- Close the Research Inbox
- Mutate canonical knowledge

## 9. Deterministic State Ownership

Guide truth must be computed from authoritative application state.

Relevant inputs may include:

- Account and ownership state
- Active investigation
- Focused event
- Active MODE
- Current selection
- Comparison pair
- Active and experimental layers
- Resolve state
- Projection synchronization
- Research Inbox contents
- Source intake state
- Publication state
- Epistemic classification
- Missing prerequisites
- Pending confirmations

The Guide must not infer operational truth from screen text or visual appearance.

## 10. Canonical Briefing Content

When applicable, a Guide briefing presents:

### Where You Are

The active MODE, investigation, focused object, comparison pair, or intake context.

### Current Situation

A plain-language description of the authoritative state.

### Why It Matters

The operational significance of that state.

### Recommended Next Step

One prominent productive action.

### Other Available Actions

A small number of meaningful alternatives.

### What Will Change

The expected consequence of the recommended action.

### What Will Not Change

Important authority or epistemic boundaries preserved by the action.

### Blockers

Missing prerequisites and how to satisfy them.

### Show Me

Visual help locating the relevant interface control.

## 11. One Recommended Action

A Guide briefing should normally identify one recommended next action.

It must not overwhelm researchers with a large undifferentiated checklist.

Actions should be classified as:

- Recommended
- Available
- Unavailable
- Blocked
- Consequential
- Informational

A recommendation is guidance, not a command.

## 12. Representative LAYERS Briefing

> You are in LAYERS.
>
> You are preparing a non-canonical experiment comparing the Nimitz Tic Tac Encounter and the Rendlesham Forest Incident. No experimental layer is currently selected.
>
> Recommended next step: Select Resolve Topology State, then run the experiment to inspect structural similarity.
>
> This creates an experimental result. It does not alter canonical knowledge or establish a canonical relationship between the cases.

## 13. Representative COMPARE Briefing

> You are in COMPARE.
>
> The Nimitz Tic Tac Encounter is the focused event. Rendlesham Forest Incident is the selected comparison candidate.
>
> Recommended next step: Inspect the participating dimensions before collecting or accepting the relationship.
>
> Collection adds the candidate to Research Inbox. Acceptance is a separate consequential action.

## 14. Visual Action Guidance

When the next productive action has a visible interface control, the Guide should show its location using:

- Live spotlight
- Scroll-to-target
- Focus ring
- Pointer or callout
- Short numbered sequence
- Version-matched reference image
- Cropped interface preview
- Cross-MODE navigation followed by spotlighting

## 15. Preferred Live Guidance

The preferred interaction is:

1. The researcher opens Guide.
2. Guide explains the next step.
3. The researcher selects **Show me**.
4. Guide minimizes or moves aside.
5. The target is scrolled into view.
6. The surrounding interface gently dims.
7. The target remains illuminated.
8. A short callout explains the action.
9. Escape immediately exits guidance.

The current working context must remain intact.

## 16. Stable Semantic Targets

Guide targets must use stable semantic identifiers rather than screen coordinates, incidental text matching, or DOM positions.

Representative identifier:

`data-guide-id="layers.run-experiment"`

Stable targets must be:

- Unique
- Testable
- Accessible
- Resolution-independent
- Independent of incidental layout order
- Versioned when necessary

Changing a targeted control must trigger Guide verification.

## 17. Reference Images

Reference images may be used when:

- The target exists in another MODE.
- The target cannot currently be rendered.
- Several steps need to be previewed.
- The action is blocked by a prerequisite.
- Live spotlighting is unavailable.

Reference images should identify:

- Application version
- Guide definition version
- MODE
- Fixture or state identity
- Semantic target
- Build or capture identity

A stale reference image must not be silently presented as current.

## 18. Navigation and Context Preservation

The Guide may offer **Take me there** when an action is located in another MODE.

Guide-directed navigation must preserve all safely retainable state, including:

- Active investigation
- Focused event
- Comparison pair
- Research Inbox contents
- New Leads
- Incoming Sources
- Collected Findings
- Valid projection context
- Non-destructive draft selections

If navigation would discard or invalidate work, that consequence must be explained first.

## 19. Researcher Authority

The Guide may:

- Explain
- Recommend
- Navigate
- Scroll
- Highlight
- Open a non-consequential panel
- Reveal prerequisites
- Present alternatives

The Guide must not silently:

- Accept or reject a relationship
- Activate canonical knowledge
- Publish Candidate Knowledge
- Publish an experiment
- Delete an artifact
- Replace an investigation
- Run a consequential computation
- Change ownership
- Submit material externally
- Mutate the MANIFOLD

Consequential actions require deliberate researcher confirmation through the authoritative control.

## 20. Epistemic Boundaries

The Guide must distinguish:

- Canonical
- Candidate
- Experimental
- Derived
- Non-canonical
- Unresolved
- Unavailable
- Published
- Collected
- Incoming
- Unassigned

Collection must never be described as canonical acceptance.

Experiments must never be described as proof.

## 21. Blockers and Prerequisites

A disabled control without explanation is an onboarding failure.

When an action is unavailable, the Guide must identify:

1. What is missing
2. Why it is required
3. How to provide it
4. Whether providing it changes canonical state
5. Whether another productive action is available

Representative blockers include:

- No active investigation
- No comparison event
- No selected operational layer
- Resolve not completed
- Projection stale
- Ownership required
- Authentication required
- Provenance unresolved
- Publication review incomplete
- Repository access unavailable

## 22. Progressive Disclosure

The first Guide view should remain concise.

Optional deeper views may include:

- Why this?
- What changes?
- What stays protected?
- Show deterministic basis
- Show state inputs
- Explain terminology
- Show workflow
- Open System Briefing
- Inspect provenance
- View mathematical basis

Technical material must not be required before the researcher can act safely.

## 23. Onboarding and Returning Researchers

First-contact lessons should be:

- Short
- State-aware
- Dismissible
- Resumable
- Individually remembered
- Available again on demand

For returning researchers, Guide should prioritize:

- Last active investigation
- Unsaved or unpublished work
- New Leads
- Incoming Sources
- Pending Source Integrity review
- Candidate relationships
- Stale projections
- Unfinished experiments
- Research Inbox contents
- Recommended continuation point

## 24. Research Inbox Guidance

The Guide must understand the Research Inbox lanes:

### New Leads

Account-owned material captured outside an active investigation.

### Incoming Sources

External material assigned to an investigation but not automatically accepted as evidence.

### Collected Findings

Nodes, edges, candidates, experiments, IDIs, and other findings selected from within an investigation.

The Guide must never imply that collection alone makes an item canonical.

## 25. Intake and Provenance Guidance

For uploaded, pasted, captured, or imported material, Guide may explain:

- Whether it is assigned or unassigned
- Whether provenance inspection is complete
- Whether it is an original source or researcher note
- Whether attribution is unresolved
- Whether the source can be replayed
- Whether rights require review
- Whether it entered an investigation
- Whether it has been classified as evidence

Provenance and rights must remain separate.

Metadata must not be presented as proof of authorship or authenticity.

## 26. IDI Handoff

When a metric has an IDI, Guide may direct the researcher to **WHY IT MATTERS**.

Guide should not duplicate the full IDI briefing.

IDI may return the researcher to Guide when a productive next action follows from the finding.

## 27. STUDIO Integration

STUDIO may later consume the deterministic Guide briefing contract.

The authority order is:

1. iSEES application state determines truth.
2. iSEES Guide produces a deterministic briefing.
3. STUDIO consumes that briefing.
4. The AI Assistant explains it conversationally.
5. The researcher decides what to do.

The AI Assistant must not invent current MODE, selection, ownership, canonical state, publication state, provenance, available actions, completed actions, or experimental results.

## 28. REX Integration

When REX is introduced, Guide may explain:

- What Candidate Knowledge is being inspected
- What MANIFOLD expansion is proposed
- Which nodes or edges are new
- Which claims remain unresolved
- What inspection is required
- What acceptance would change

REX proposals must never become silent MANIFOLD mutations.

## 29. Accessibility

Guide must support:

- Keyboard navigation
- Visible focus
- Screen-reader labels
- Escape to close
- Reduced-motion preferences
- Sufficient contrast
- Text alternatives for images
- Semantic relationships between callouts and targets
- Viewport resizing and browser zoom

A pulsing highlight must have a non-animated equivalent.

## 30. Failure Behavior

Guide failure must not block the underlying workflow.

If a target cannot be found:

- Do not click a substitute.
- Do not guess.
- Do not silently perform the action.
- Explain that the visual target is unavailable.
- Preserve researcher state.
- Offer textual guidance.
- Record diagnostic information.

A missing target is a Guide defect, not researcher error.

## 31. Privacy

Guide must not become ambient surveillance.

Research content must not enter telemetry merely because Guide was active.

Permitted operational measurements may include:

- Guide opened
- Recommendation viewed
- Show Me invoked
- Target located
- Target missing
- Lesson dismissed
- Blocker encountered

## 32. Non-Goals

iSEES Guide is not:

- An autonomous operator
- A generic chatbot
- A substitute for IDI
- A substitute for System Briefing
- A source of canonical truth
- An inference engine for missing state
- An excuse for unclear interface design
- A mechanism for silent behavioral collection

If Guide repeatedly compensates for the same interface defect, the underlying interface should also be improved.

## 33. Initial Engineering Sequence

### A21-I0 — Guidance-State Discovery

Identify authoritative state owners and produce a no-mutation discovery report.

### A21-I1 — Guide Contracts

Create deterministic contracts for briefing, action, blocker, consequence, protected boundary, semantic target, visual step, and state reference.

### A21-I2 — Persistent Guide Entry Point

Add the stable GUIDE entry point to the shared shell.

### A21-I3 — LAYERS Vertical Slice

Detect an unselected experimental layer, recommend Resolve Topology State, offer Show Me, spotlight the layer, then recommend Run Experiment while explaining the non-canonical boundary.

### A21-I4 — COMPARE Guidance

Distinguish candidate inspection, collection, acceptance, and publication.

### A21-I5 — Front Door Guidance

Integrate account, ownership, Investigation Library, New Leads, and investigation creation guidance after A20 ownership contracts exist.

### A21-I6 — Research Inbox Guidance

Explain New Leads, Incoming Sources, and Collected Findings.

### A21-I7 — Versioned Reference Images

Add verified reference-image fixtures and stale-image detection.

### A21-I8 — MODE Coverage

Extend deterministic briefings across all operational MODES.

### A21-I9 — STUDIO Consumption Boundary

Allow STUDIO AI to consume Guide context without transferring authority.

### A21-I10 — Final Acceptance

Verify onboarding, accessibility, authority preservation, context preservation, and target reliability.

## 34. First Vertical-Slice Acceptance

Acceptance requires:

1. GUIDE appears in a stable global location.
2. Opening it does not change application state.
3. LAYERS preparation state is described accurately.
4. One recommended action is identified.
5. Consequences are explained.
6. The non-canonical boundary is explicit.
7. Show Me locates the correct live control.
8. The view scrolls safely when necessary.
9. The target is visually distinguishable.
10. Escape exits guidance.
11. Guide does not click the target.
12. Comparison context remains intact.
13. Research Inbox remains intact.
14. Experiment state remains intact.
15. Missing targets fail safely.
16. Production build passes.
17. Deterministic verification passes.
18. Browser acceptance is documented.

## 35. Canonical Boundary Statement

> iSEES Guide reveals the researcher’s current location, explains the authoritative system state, recommends a safe productive action, and visually identifies where that action can be taken. It may orient, navigate, scroll, spotlight, and explain. It must not silently execute consequential actions, invent system truth, or transfer researcher authority to AI.

## 36. Final Canonical Principle

> A researcher should never be stranded inside iSEES wondering what the screen means or what to do next. The system must explain its current state, identify a productive path forward, and show exactly where that path begins while preserving determinism, context, and researcher authority.