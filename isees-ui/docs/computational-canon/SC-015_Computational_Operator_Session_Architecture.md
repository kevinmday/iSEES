\# SC-015 — Computational Operator Session Architecture



\*\*Status:\*\* Canonical  

\*\*Session:\*\* P54  

\*\*Category:\*\* Computational Shell Architecture  

\*\*Depends On:\*\*



\- SC-001 Computational Runtime Architecture

\- SC-006 Workspace Runtime Architecture

\- SC-009 Computational Instrument Architecture

\- SC-010 Investigative Provenance Architecture

\- SC-012 Computational Projection Architecture

\- SC-013 Computational Observation Architecture



\---



\# 1. Abstract



This canon establishes the Computational Operator Session as a deterministic

runtime responsible for governing the operator's current investigative task.



It introduces a strict architectural separation between:



\- Workspace

\- Operator Session

\- Instruments



These concepts SHALL remain computationally independent.



The objective is to preserve operator cognition while allowing the shell to

adapt to the current task without forcing unnecessary workspace transitions.



\---



\# 2. Motivation



Earlier iterations of iSEES implicitly coupled panel behavior to the active

workspace.



For example:



```

MANIFOLD



↓



Repositories

Selection Intelligence

```



Changing workspaces caused surrounding instruments to change.



This approach breaks operator continuity.



Research rarely proceeds as isolated workspace visits.



Instead, researchers move repeatedly between graph analysis, authoring,

comparison, review, timeline inspection, and evidence collection while

remaining engaged in the same investigative task.



The shell SHALL preserve this continuity.



\---



\# 3. Three Independent Computational Concepts



The shell is composed of three orthogonal computational systems.



\## Workspace



Determines what occupies the center of the application.



Examples:



\- Manifold

\- Studio

\- Compare

\- Timeline

\- Evidence



A Workspace answers:



> "What am I looking at?"



\---



\## Operator Session



Determines the operator's current task.



Examples:



\- Normal Investigation

\- Candidate Review

\- Authoring

\- Presentation

\- Comparative Analysis



An Operator Session answers:



> "What am I doing?"



\---



\## Instruments



Determine which computational tools surround the active workspace.



Examples:



\- Research Inbox

\- Candidate Queue

\- Knowledge Explorer

\- Selection Intelligence

\- Promotion Intelligence

\- Outline

\- Timeline Navigator



An Instrument answers:



> "What tools do I currently need?"



\---



\# 4. Architectural Separation



The shell SHALL resolve independently.



```

Workspace



↓



Center Workspace

```



and



```

Operator Session



↓



Instrument Resolver



↓



Left Instruments



Right Instruments

```



These computational systems SHALL NOT directly own one another.



\---



\# 5. Fundamental Principle



Changing the active Workspace SHALL NOT implicitly terminate an active

Operator Session.



Workspace navigation is considered observational.



Operator Sessions represent intentional work.



These are distinct computational concepts.



\---



\# 6. Candidate Review Session



The Candidate Review Session illustrates the architecture.



Research proceeds normally.



```

MANIFOLD



↓



Select Node



↓



Collect



↓



Research Inbox

```



The operator intentionally accumulates research candidates.



Multiple nodes, edges, observations, notes, and artifacts may be collected.



Collection SHALL remain lightweight.



No computational knowledge is created during collection.



\---



Once sufficient evidence has been gathered the operator begins review.



```

Review Candidates

```



The shell enters:



```

Operator Session



RESEARCH\_REVIEW

```



The center workspace becomes the Candidate Review Surface.



The surrounding instruments change accordingly.



\---



\# 7. Candidate Queue



During Candidate Review the left instrument SHALL become the Candidate Queue.



Example:



```

Research Candidates



□ USS Nimitz



□ FLIR Video



□ Princeton Radar



□ Cmdr Fravor



□ Radar Relationship



5 Remaining

```



The queue represents pending review.



It is not the Knowledge Library.



It is not the Research Inbox.



It is a temporary computational work queue.



\---



\# 8. Candidate Review Surface



The center workspace SHALL support intentional evaluation.



Typical content includes:



\- Summary

\- Description

\- Provenance

\- Supporting Evidence

\- Relationships

\- Timeline

\- Research Notes

\- References

\- Confidence



The purpose of this workspace is singular:



> Determine whether a Research Candidate should become Computational Knowledge.



\---



\# 9. Promotion Intelligence



During Candidate Review the right instrument SHALL become Promotion

Intelligence.



Examples include:



\- Supporting Evidence Count

\- Duplicate Detection

\- Existing Knowledge References

\- Narrative Participation

\- Conflicts

\- Observability

\- Promotion Confidence



Promotion Intelligence assists decision making.



It does not perform autonomous decisions.



\---



\# 10. Promotion Outcomes



Each reviewed candidate transitions into one of several computational states.



Examples include:



\- Promote

\- Needs Additional Research

\- Reject



These transitions are deterministic.



Promotion creates Computational Knowledge.



Rejection does not.



\---



\# 11. Session Persistence



The Candidate Review Session persists while the operator continues the review

task.



The operator may freely switch workspaces.



For example:



```

Candidate Review



↓



Switch to Manifold



↓



Inspect Graph



↓



Collect Additional Nodes



↓



Return to Review

```



The Candidate Queue SHALL remain active.



The Operator Session remains unchanged.



\---



\# 12. Session Completion



Completion SHALL occur through explicit operator intent.



Example:



```

End Review Session

```



Automatic termination based solely upon workspace navigation SHALL NOT occur.



This preserves operator cognition.



\---



\# 13. Instrument Resolution



The shell SHALL resolve instruments using the active Operator Session rather

than the active Workspace.



Illustrative examples:



Normal Investigation



Left



\- Repositories



Right



\- Selection Intelligence



\---



Candidate Review



Left



\- Candidate Queue



Right



\- Promotion Intelligence



\---



Authoring



Left



\- Research Inbox

\- Outline



Right



\- Reference Inspector



The workspace may remain identical while instruments change according to the

active task.



\---



\# 14. Computational Principles



The following principles are normative.



1\. Workspace and Operator Session SHALL remain computationally independent.



2\. Instruments SHALL resolve from the active Operator Session.



3\. Changing workspaces SHALL NOT terminate an Operator Session.



4\. Sessions terminate through explicit operator intent or deterministic rules

&#x20;  defined by the session type.



5\. Candidate Review SHALL operate upon Research Candidates rather than

&#x20;  Computational Knowledge.



6\. Promotion SHALL be an intentional computational transition.



7\. Knowledge accumulation is the result of review rather than the purpose of

&#x20;  review.



8\. The shell SHALL preserve operator cognitive continuity whenever possible.



\---



\# 15. Architectural Summary



The Computational Operator Session introduces an intermediate computational

layer between the shell and individual workspaces.



This layer governs operator intent rather than visual presentation.



As a result:



\- Workspaces determine what is displayed.

\- Sessions determine why the operator is there.

\- Instruments provide the tools appropriate to the current task.



Together these concepts form the canonical behavioral architecture of the

iSEES computational shell.

