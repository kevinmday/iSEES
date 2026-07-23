\# SC-009



\# Manifold Instrument Architecture



\## Status



CANONICAL



\---



\## Purpose



This document establishes the canonical interaction architecture governing analytical controls within the iSEES Investigation Manifold.



The Manifold is the primary investigation surface.



Controls used to manipulate, navigate, project, filter, search, or otherwise operate upon the Manifold SHALL be treated as analytical instruments layered over the investigation surface rather than as permanent layout regions surrounding it.



This architecture exists to preserve the Manifold as the dominant visual and computational workspace while allowing the investigative toolset to expand without progressively reducing usable topology space.



\---



\# 1. Core Principle



> \*\*The Manifold owns the workspace. Instruments float above it. Intelligence surrounds it. UI chrome does not unnecessarily consume investigation space.\*\*



The topology viewport is not a container placed between toolbars.



It is the investigation surface itself.



Analytical controls SHALL therefore be projected over that surface whenever their function does not require permanent structural layout space.



\---



\# 2. Canonical Architectural Decision



> \*\*Manifold controls SHALL be treated as analytical instruments layered over the investigation surface rather than permanent layout regions surrounding the investigation surface. Instruments MAY be docked or floated without changing the dimensions or coordinate system of the underlying Manifold.\*\*



This principle governs present and future Manifold controls.



It applies to instrument classes including, but not limited to:



\* computation

\* projection

\* navigation

\* search

\* filtering

\* layer control

\* temporal navigation

\* investigation expansion

\* topology inspection

\* future analytical instruments



The addition of an instrument SHALL NOT, by default, reduce the dimensions of the topology viewport.



\---



\# 3. Surface Ownership



The canonical Manifold workspace hierarchy is:



```text

Manifold Workspace

&#x20;   │

&#x20;   ├── Manifold Header

&#x20;   │

&#x20;   └── Topology Viewport

&#x20;         │

&#x20;         ├── Graph / Topology

&#x20;         │

&#x20;         └── Instrument Layer

&#x20;               │

&#x20;               ├── Computation Instrument

&#x20;               ├── Projection Instrument

&#x20;               ├── Navigation Instrument

&#x20;               └── Future Instruments

```



The Topology Viewport owns the available investigation surface.



The Instrument Layer exists within that viewport as an overlay.



The Instrument Layer SHALL NOT participate in topology layout calculations.



\---



\# 4. Instrument Layer



The Manifold SHALL provide a dedicated Instrument Layer above the rendered topology.



The Instrument Layer SHALL:



\* render above topology

\* preserve the full dimensions of the topology viewport

\* remain independent of graph pan and zoom transforms

\* allow topology to conceptually continue beneath instruments

\* intercept pointer interaction only within active instrument bounds

\* maintain appropriate visual stacking above topology

\* provide the placement environment for Manifold instruments



The Instrument Layer is responsible for instrument placement architecture.



Individual instruments are responsible for their own controls and presentation.



\---



\# 5. Instrument Architecture



A Manifold instrument is a compact analytical control surface associated with operations upon the investigation topology.



An instrument MAY be:



```text

DOCKED

```



or:



```text

FLOATING

```



Instrument presentation SHALL remain separate from the computational semantics of the controls contained within it.



A generic instrument shell SHOULD provide:



\* title

\* drag handle

\* instrument contents

\* default position

\* current position

\* docking state

\* floating state

\* viewport boundary constraints

\* common visual treatment



Domain-specific operations SHALL NOT be embedded into the generic instrument infrastructure.



For example, Resolve and Dissolve belong to the Computation instrument, not to the generic instrument component.



\---



\# 6. Default Instrument Rail



The canonical default Manifold instrument location is the upper-left region of the topology viewport.



This region forms the:



> \*\*Default Instrument Rail\*\*



The Default Instrument Rail is an overlay concept.



It is NOT a layout column.



It SHALL consume zero topology width.



Initial ordering is:



```text

COMPUTATION

&#x20;    ↓

PROJECTION

&#x20;    ↓

NAVIGATION

&#x20;    ↓

FUTURE INSTRUMENTS

```



Docked instruments SHALL stack predictably and SHALL NOT overlap one another.



\---



\# 7. Computation Instrument



The Computation instrument contains controls that alter the computational state or resolution of the investigation topology.



Initial controls are:



```text

COMPUTATION



RESOLVE

DISSOLVE

COLLAPSE

```



Existing computational behavior SHALL remain unchanged when controls are relocated into the instrument architecture.



Presentation relocation SHALL NOT constitute a computational rewrite.



\---



\# 8. Projection Instrument



The Projection instrument controls how the investigation topology is projected to the operator.



Initial controls are:



```text

PROJECTION



2D

3D

```



The architecture SHALL permit additional projection modes without requiring changes to the generic instrument system.



Projection semantics remain owned by the existing Manifold projection architecture.



\---



\# 9. Navigation Instrument



Navigation SHALL eventually be represented as a dedicated Manifold instrument.



Expected operations may include:



```text

NAVIGATION



ZOOM IN

ZOOM OUT

CENTER

FIT

RESET VIEW

```



Future navigation capabilities may include:



\* pan mode

\* zoom level

\* focus selection

\* return to center node

\* fit investigation

\* reset camera



Controls SHALL NOT be exposed merely to populate the instrument.



An operation SHOULD appear only when corresponding runtime behavior exists.



\---



\# 10. Docking and Floating



Manifold instruments MAY transition between docked and floating states.



Canonical interaction:



```text

DOCKED

&#x20;  ↓

DRAG

&#x20;  ↓

FLOATING

&#x20;  ↓

MOVE TO DOCK REGION

&#x20;  ↓

DOCKED

```



Dragging SHALL occur through a dedicated instrument handle or header.



Instrument interaction SHALL NOT unintentionally initiate topology pan or selection behavior.



Floating instruments SHALL remain constrained to the usable topology viewport.



\---



\# 11. Docking Model



The initial canonical docking model is deliberately constrained.



The Manifold SHALL initially support:



```text

UPPER-LEFT DOCK

\+

FREE FLOATING

```



Arbitrary docking regions are not required.



When a floating instrument approaches the Default Instrument Rail, the system MAY expose a docking affordance.



On docking, instruments SHALL:



\* snap to the canonical rail

\* enter predictable stacking order

\* avoid overlap with other docked instruments



Additional docking models MAY be introduced later if demonstrated investigative need justifies them.



\---



\# 12. Instrument Runtime State



Instrument state SHALL be logically separated from instrument presentation.



Runtime state may include:



\* docked or floating state

\* floating coordinates

\* dock ordering

\* collapsed or expanded state

\* instrument visibility



Initial persistence MAY remain within workspace or session runtime state.



Backend persistence is not required for the initial instrument architecture.



Long-term persistence MAY later allow operator-specific workspace arrangements.



\---



\# 13. Visual Language



Manifold instruments SHALL share a coherent visual language.



They SHOULD be:



\* compact

\* visually subordinate to investigation content

\* immediately discoverable

\* clearly interactive

\* dark or translucent where appropriate

\* bounded by subtle structural borders

\* identified by concise canonical headings

\* equipped with recognizable drag affordances

\* consistent in button geometry

\* restrained when inactive

\* prominent when active



Instrument presentation MAY become visually subdued after inactivity.



However, controls SHALL remain discoverable.



Analytical instruments SHALL NOT disappear merely to maximize topology visibility.



\---



\# 14. Graph Independence



Instrument architecture and graph geometry are separate concerns.



Instrument placement SHALL NOT alter:



\* topology dimensions

\* topology coordinate system

\* graph center calculations

\* node coordinates

\* edge coordinates

\* graph projection mathematics



Responsive graph geometry SHALL be addressed independently.



This separation prevents presentation architecture from contaminating topology computation.



\---



\# 15. Responsive Topology Geometry



The topology projection SHOULD eventually derive its geometry from the actual available viewport dimensions.



Future work may include:



\* viewport-derived layout center

\* viewport-derived topology radius

\* responsive node spacing

\* node collision handling

\* label collision handling

\* fit-to-view

\* resize handling

\* expanded-workspace behavior



These capabilities belong to Manifold projection and layout architecture rather than Instrument Architecture.



\---



\# 16. Intelligence Boundary



Analytical instruments and contextual intelligence serve different purposes.



The canonical distinction is:



```text

INSTRUMENTS

operate upon the investigation



INTELLIGENCE

explains the investigation

```



Therefore:



> \*\*Instruments float above the Manifold. Intelligence surrounds the Manifold.\*\*



Selection Intelligence, evidence details, contextual explanations, and similar information MAY occupy surrounding workspace regions when persistent visibility is justified.



Operational controls SHOULD preferentially exist as instruments over the investigation surface.



\---



\# 17. Architectural Invariant



The growth of the Manifold toolset SHALL NOT progressively strangle the investigation surface.



When introducing a new Manifold control system, engineering SHALL first ask:



> \*\*Is this a structural workspace region, contextual intelligence, or an analytical instrument?\*\*



If the capability operates upon the Manifold and does not require permanent structural space, it SHOULD be implemented as an instrument.



The default architectural assumption SHALL NOT be the creation of another toolbar, sidebar, or permanent control region.



\---



\# 18. Engineering Consequence



This architecture establishes a scalable control model for the Investigation Manifold.



New analytical capabilities can be introduced as instruments without repeatedly redesigning the surrounding workspace.



The resulting system preserves the central cognitive hierarchy:



```text

&#x20;                INTELLIGENCE

&#x20;                     │

&#x20;                     ▼



&#x20;             ┌───────────────┐

&#x20;             │               │

INSTRUMENTS → │   MANIFOLD    │ ← INSTRUMENTS

&#x20;             │               │

&#x20;             └───────────────┘



&#x20;                     ▲

&#x20;                     │

&#x20;                INTELLIGENCE

```



The Manifold remains the dominant investigation surface.



The analytical system grows over it rather than around it.



\---



\# Canonical Summary



The Investigation Manifold is the primary investigation surface.



Its dimensions SHALL be protected from unnecessary interface chrome.



Operational controls SHALL preferentially exist as analytical instruments layered over the topology viewport.



Instruments MAY dock or float independently of topology geometry.



The upper-left topology region SHALL serve as the initial Default Instrument Rail.



Instrument infrastructure SHALL remain generic and separate from domain-specific computational behavior.



This architecture SHALL govern the future introduction of Manifold computation, projection, navigation, search, filtering, layer, temporal, and other investigative controls.



