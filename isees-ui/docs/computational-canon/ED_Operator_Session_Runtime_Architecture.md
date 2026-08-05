\# ED — Operator Session Runtime Architecture



\*\*Status:\*\* Engineering Design  

\*\*Implements:\*\* SC-015 Computational Operator Session Architecture  

\*\*Session:\*\* P54  

\*\*Layer:\*\* Computational Shell Runtime



\---



\# 1. Purpose



This document defines the engineering architecture for the Computational

Operator Session Runtime.



Unlike the Workspace Runtime, which determines the center workspace presented

to the operator, the Operator Session Runtime governs the operator's active

task and resolves the computational instruments appropriate to that task.



The runtime is deterministic.



It owns no UI.



It owns no React.



It owns no persistence.



It owns no networking.



It owns no AI.



React observes.



\---



\# 2. Runtime Responsibilities



The Operator Session Runtime SHALL be responsible for:



\- Maintaining the active Operator Session.

\- Managing session lifecycle transitions.

\- Resolving active left-side instruments.

\- Resolving active right-side instruments.

\- Publishing deterministic runtime state.

\- Notifying subscribers of session changes.



The runtime SHALL NOT:



\- Render components.

\- Own workspace navigation.

\- Persist session history.

\- Perform autonomous decision making.



\---



\# 3. Relationship to Workspace Runtime



The Workspace Runtime and Operator Session Runtime SHALL remain independent.



```

&#x20;                Operator



&#x20;                    │



&#x20;    ┌───────────────┴───────────────┐



&#x20;    ▼                               ▼



Workspace Runtime          Operator Session Runtime



&#x20;    │                               │



Center Workspace          Instrument Resolution

```



Neither runtime owns the other.



The shell composes both.



\---



\# 4. Runtime State



Conceptually the runtime owns:



```

OperatorSessionState



status



activeSession



previousSession



startedAt



revision



leftInstruments



rightInstruments

```



The runtime remains immutable.



State transitions produce new revisions.



\---



\# 5. Session Types



Initial session vocabulary includes:



```

NORMAL



RESEARCH\_REVIEW



AUTHORING



COMPARISON



PRESENTATION

```



Additional session types may be introduced without modifying shell

architecture.



\---



\# 6. Session Lifecycle



```

NORMAL



↓



Begin Review



↓



RESEARCH\_REVIEW



↓



End Review



↓



NORMAL

```



Transitions are deterministic.



\---



\# 7. Workspace Independence



The active workspace SHALL NOT alter the current Operator Session.



Example:



```

Session



RESEARCH\_REVIEW



↓



Workspace



MANIFOLD



↓



Workspace



TIMELINE



↓



Workspace



COMPARE

```



The Operator Session remains unchanged.



Only the center workspace changes.



\---



\# 8. Instrument Resolution



Instrument resolution is performed entirely from the active Operator Session.



Example:



```

NORMAL



Left



Repositories



Right



Selection Intelligence

```



\---



```

RESEARCH\_REVIEW



Left



Candidate Queue



Right



Promotion Intelligence

```



\---



```

AUTHORING



Left



Research Inbox



Outline



Right



Reference Inspector

```



The shell renders instruments returned by the runtime.



\---



\# 9. Candidate Review Flow



```

MANIFOLD



↓



Collect



↓



Research Inbox



↓



Begin Review



↓



Operator Session



RESEARCH\_REVIEW



↓



Candidate Queue



↓



Candidate Review Surface



↓



Promotion Decision



↓



Next Candidate

```



The session persists until explicitly completed.



\---



\# 10. Session Completion



Completion occurs through deterministic runtime transitions.



Examples:



```

End Review Session



↓



NORMAL

```



Future session types define their own completion rules.



Workspace navigation SHALL NOT terminate a session.



\---



\# 11. Instrument Resolver



A dedicated resolver shall map session types to instrument sets.



Illustrative behavior:



```

resolve(session)



↓



Left Instruments



Right Instruments

```



This resolver contains no UI logic.



It returns computational descriptors only.



\---



\# 12. React Integration



React components observe the runtime.



Typical pattern:



```

OperatorSessionRuntime



↓



subscribe()



↓



Shell



↓



Render Instruments

```



The shell performs presentation.



The runtime performs computation.



\---



\# 13. Future Integration



The runtime is expected to coordinate with:



\- Workspace Runtime

\- Research Runtime

\- Knowledge Runtime

\- Author Runtime

\- Investigation Runtime



No runtime ownership hierarchy is introduced.



Coordination occurs through deterministic composition.



\---



\# 14. Engineering Principles



The implementation SHALL adhere to the following principles.



1\. Runtime remains deterministic.



2\. Runtime owns task state.



3\. Runtime never owns presentation.



4\. Workspace Runtime remains independent.



5\. Instruments are resolved rather than hardcoded.



6\. Sessions are explicit computational objects.



7\. Navigation never implies session termination.



8\. React observes computational state.



9\. Future session types require no shell redesign.



\---



\# 15. Expected Evolution



The initial implementation supports Candidate Review.



Subsequent sessions are expected to include:



\- Authoring Session

\- Comparative Analysis Session

\- Presentation Session

\- Collaborative Review Session

\- Publication Session



The Operator Session Runtime provides the computational framework upon which

future shell behavior is composed while preserving a consistent operator

experience across all investigative workflows.

