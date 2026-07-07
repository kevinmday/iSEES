\# iSEES SESSION BRIEFING



\*\*Last Updated:\*\* 2026-07-06

\*\*Project:\*\* iSEES Operator

\*\*Repository:\*\* C:\\dev\\IntentionalTradingSystem

\*\*Frontend:\*\* isees-ui

\*\*Branch:\*\* hf-deploy



\---



\# ENGINEERING VECTOR



The deterministic backend architecture is considered mature.



Engineering emphasis has shifted from creating new computational subsystems to exposing existing deterministic capabilities through an operator-centric workspace.



Every engineering decision should improve the operator's ability to investigate, understand, and discover relationships—not merely add interface elements.



The frontend is now responsible for revealing the power already present in the backend.



\---



\# CURRENT HYPOTHESIS



The Workspace is becoming the primary owner of the operator experience.



The Investigation Manifold is one operational workspace—not the application itself.



All future operational surfaces (Narrative, Evidence, Compare, Timeline, Research, Layers, etc.) should participate equally within the Workspace framework.



Operator state should survive sessions exactly as the operator left it.



\---



\# PROJECT CANON



These principles are considered architectural truth unless intentionally superseded.



\- Workspace owns investigation state.

\- Resolve and Dissolve are deterministic computational operators.

\- Resolve/Dissolve always recompute the entire Investigation Manifold.

\- Layer changes are computational inputs—not visibility toggles.

\- Toolbar components never perform computation.

\- UI emits operator intent only.

\- Deterministic mathematics remain authoritative.

\- No hidden AI or black-box reasoning.

\- Every result should be inspectable and explainable.

\- Nodes and edges emerge from computation—they are not manually authored.



\---



\# THINGS WE REFUSE TO DO



\- Duplicate ownership of investigation state.

\- UI-owned computation.

\- Hidden or non-deterministic reasoning.

\- Manual edge creation.

\- Investigation-specific special cases.

\- Architecture that bypasses the deterministic runtime.

\- Features that weaken explainability.



\---



\# NEXT ARCHITECTURAL DECISION



Complete the execution contract between the Workspace UI and the deterministic runtime.



Desired execution path:



Operator



↓



Toolbar



↓



Workspace



↓



Deterministic Runtime



↓



computeManifold()



↓



Updated Investigation Manifold



↓



Workspace refresh



Every future operator action should eventually share this execution path.



\---



\# CURRENT MILESTONE



P33A — Workspace Runtime Integration



\---



\# CURRENT PROJECT STATUS



\## Repository



Root:

C:\\dev\\IntentionalTradingSystem



Frontend:

isees-ui



Branch:

hf-deploy



Working Tree:

Clean



\---



\## Build Status



Latest verification:



npm run build



✓ TypeScript passed



✓ Vite production build passed



\---



\# COMPLETED



\## Workspace Framework



✓ Seven canonical workspace modes established



\- Manifold

\- Compare

\- Narrative

\- Evidence

\- Research

\- Timeline

\- Layers



✓ MainLayout promoted into workspace architecture.



✓ Landing page now functions as the primary Investigation Manifold workspace.



✓ Center-panel layout stabilized.



\---



\# CURRENT ARCHITECTURAL DECISIONS



\## Account-Owned Investigation



Current deployment loads NIMITZ TIC TAC.



Production should instead restore the account-owned investigation automatically.



Future restored state includes:



\- Imported investigations

\- Focused investigation

\- Active workspace

\- Active layers

\- Projection

\- Selection

\- History

\- Operator preferences



\---



\## Resolve–Dissolve Computation (RDC)



Resolve and Dissolve are computational operators.



They do not simply toggle layers.



Each execution recomputes the complete Investigation Manifold, potentially producing:



\- New topology

\- New nodes

\- New edges

\- New clusters

\- Newly discovered relationships



This behavior is considered project canon.



\---



\# OUTSTANDING WORK



Immediate



\- Connect Resolve button to deterministic runtime.

\- Connect Dissolve button.

\- Remove passive toolbar behavior.



Next



\- Workspace persistence.

\- Account-owned investigation loading.

\- Temporal history.

\- Playback.

\- Snapshot management.



Future



\- Multi-investigation manifolds.

\- Collaborative workspaces.

\- Shared investigations.



\---



\# CURRENT FILES OF INTEREST



src/manifold/



src/manifold/components/



src/manifold/engine/



MainLayout



ManifoldToolbar



computeManifold()



\---



\# NEXT CODING TASK



Wire the Manifold Toolbar into the deterministic runtime.



First objective:



Toolbar



↓



Workspace



↓



computeManifold()



↓



Projection



↓



Workspace refresh



Do not introduce shortcut paths.



Maintain deterministic ownership throughout the execution chain.



\---



\# SESSION NOTES



The architectural foundation is now sufficiently mature that development should accelerate.



The primary challenge is no longer creating backend capability but exposing deterministic operator capability through a coherent operational UX.



Every completed UI feature should strengthen the operator's ability to perform deterministic investigation rather than merely improve presentation.

