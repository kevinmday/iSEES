\# ============================================================

\# SYSTEM CANON

\# ============================================================



System Canon ID:

SC-004



Title:

Investigation Control



Status:

SYSTEM CANON



Version:

1.0



Introduced:

P30



Author:

Kevin M. Day



Dependencies:

SC-001 Resolve–Dissolve Computation

SC-002 Computational Layers

SC-003 Investigation Manifold



Dependent Canon:

SC-005 Intention Engine



Purpose:

Define the operator interaction model for iSEES and establish

Investigation Control as the sole interface through which an operator

constructs and computes an investigation.



\# ============================================================

\# SC-004

\# INVESTIGATION CONTROL

\# ============================================================



\## Abstract



Investigation Control is the operator's primary interface to iSEES.



Its purpose is not to visualize information.



Its purpose is to control the investigation itself.



Every action performed within Investigation Control either



• constructs the investigation



or



• changes the computational universe used to evaluate it.



Investigation Control therefore serves as the operational bridge between

the human investigator and the deterministic computational engines of

iSEES.



\---



\# 1. Philosophy



Traditional investigative software separates information into numerous

independent windows, menus, and tools.



iSEES adopts a different philosophy.



The operator should always answer two questions:



What am I investigating?



How should it be computed?



Everything else follows naturally.



\---



\# 2. Architectural Position



The iSEES operator workflow is



Operator



↓



Investigation Control



↓



Resolve–Dissolve Computation



↓



Investigation Manifold



↓



Analytical Surfaces



↓



Intention Engine



↓



Assessment



Investigation Control becomes the single point of interaction through

which investigations are created and modified.



\---



\# 3. Modes of Operation



Investigation Control contains two primary operating modes.



Explore



Compute



Each mode serves a distinct purpose.



\---



\# 4. Explore Mode



Explore Mode constructs the investigation.



Its purpose is evidence acquisition and investigative assembly.



Typical operator actions include



• browse repositories



• search corpus



• preview evidence



• import investigations



• compare historical events



• select active workspace



• manage artifacts



Explore answers the question



"What evidence should participate in this investigation?"



\---



\# 5. Compute Mode



Compute Mode defines the computational universe.



Its purpose is analytical configuration rather than evidence selection.



Typical operator actions include



• activate computational layers



• deactivate computational layers



• select research profiles



• select layer groups



• choose computational presets



• initiate recomputation



Compute answers the question



"How should this investigation be mathematically interpreted?"



\---



\# 6. Separation of Responsibilities



Explore never performs computation.



Compute never imports evidence.



This separation is intentional.



Evidence construction and computational interpretation remain distinct

activities.



\---



\# 7. Relationship to Resolve–Dissolve Computation



Investigation Control does not perform computation.



Instead it provides deterministic inputs to Resolve–Dissolve

Computation.



The relationship is



Operator



↓



Investigation Control



↓



Resolve–Dissolve Computation



↓



Investigation Manifold



Investigation Control owns interaction.



Resolve–Dissolve Computation owns mathematics.



\---



\# 8. Relationship to the Investigation Manifold



Operators never edit the Investigation Manifold directly.



Instead they modify



• evidence



• computational layers



• investigative scope



• temporal context



• investigative scale



The manifold is then reconstructed through deterministic computation.



\---



\# 9. User Interface Model



The canonical operator layout is



LEFT



Investigation Control



• Explore



• Compute



CENTER



Primary Investigation Manifold



RIGHT



Selection Intelligence



The center of the application is always occupied by the Investigation

Manifold.



The left side changes the investigation.



The right side explains the current selection.



\---



\# 10. Explore Components



Representative Explore components include



• Corpus Browser



• Federation Browser



• Repository Preview



• Workspace Manager



• Artifact Manager



• Event Import



Future additions should continue to support investigative construction.



\---



\# 11. Compute Components



Representative Compute components include



• Computational Layers



• Layer Groups



• Research Profiles



• Compute Presets



• Resolve–Dissolve Controls



• Recompute Status



Future additions should support deterministic computation.



\---



\# 12. Investigation Record



Every operator action affecting computational state should become part

of the permanent investigation record.



Examples include



• imported evidence



• active computational layers



• selected profiles



• temporal scope



• investigative scale



This ensures every investigation remains reproducible.



\---



\# 13. Design Principles



Investigation Control follows several guiding principles.



Simplicity



Only expose controls that directly affect the investigation.



Determinism



Every operator action produces a reproducible computational result.



Transparency



Operators always know what computational assumptions are active.



Reproducibility



Every investigation can be reconstructed from its recorded state.



\---



\# 14. Future Expansion



Future versions of Investigation Control may introduce



• collaborative investigations



• saved computational profiles



• automated investigation templates



• federation synchronization



• live data ingestion



• comparative workspaces



These additions extend Investigation Control without changing its core

responsibility.



\---



\# 15. System Canon



The following statements constitute system canon.



• Investigation Control is the operator's primary interface.



• Investigation Control owns interaction, not computation.



• Explore constructs investigations.



• Compute defines the computational universe.



• Operators never edit the Investigation Manifold directly.



• Every computational change is routed through Resolve–Dissolve

&#x20; Computation.



• Investigation state is permanently reproducible.



\---



\# Conclusion



Investigation Control establishes the operational philosophy of iSEES.



Rather than presenting a collection of unrelated tools, it provides a

single coherent interface through which investigators construct evidence,

define computational assumptions, and initiate deterministic analysis.



By separating investigative construction from computational

interpretation, Investigation Control ensures that every conclusion

generated by iSEES can be traced back to explicit operator decisions and

fully reproducible mathematical processes.



Investigation Control is therefore not merely a user interface—it is the

human-facing gateway into the deterministic investigative framework of

iSEES.

\---

\# Future Engineering Note

\## iSEES Live Watch — Future External Signal Monitoring Contract

Live Watch is a future, opt-in subsystem separate from Investigation
membership. It may eventually use external repository, news, sensor-notice,
and metadata adapters, but no operational implementation is authorized by
this note and Live Watch is not a production computational layer.

Each alert must retain a stable alert identity, source and timestamp
provenance, deduplication state, confidence, and availability. The binding
flow is: external signal → Live Watch alert → researcher inspection → explicit
Import into Investigation. An alert is not an imported EVENT, focused EVENT,
Resolve candidate, accepted relationship, or canonical Knowledge.

Alerts never become canonical Knowledge automatically and never trigger
Resolve acceptance automatically. Notification, popup, or radar presentation
may be explored in V2 only after the activation, adapter, provenance, and
explicit-import contracts are authorized.

V1 also still requires an explicit Close/Restart Investigation contract.
Closing must not delete System Canon, and preservation handling is required
for Research state and unsaved Studio work.

