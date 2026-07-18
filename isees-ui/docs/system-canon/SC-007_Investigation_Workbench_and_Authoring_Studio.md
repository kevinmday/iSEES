// ============================================================

// SC-007

// INVESTIGATION WORKBENCH \& AUTHORING STUDIO

//

// P40 CANON

//

// COGNITIVE ARCHITECTURE

//

// Status:

// CANONICAL

//

// ============================================================



\# SC-007

\# Investigation Workbench \& Authoring Studio

\## P40 Cognitive Architecture



\---



\# Purpose



This document establishes the canonical cognitive architecture of iSEES.



It defines how investigators interact with the system, how information flows between major workspaces, and the responsibilities of each operational surface.



This specification supersedes ad hoc workspace evolution and serves as the foundation for future UI and workflow development.



\---



\# Engineering Stability



\## Runtime Contracts



The following runtime identifiers are engineering contracts.



They SHALL NOT be renamed without a compelling architectural reason.



```text

OVERVIEW

MANIFOLD

COMPARE

NARRATIVE

EVIDENCE

TIMELINE

LAYERS

INTENTION

RESEARCH

```



These identifiers are used by:



\- runtime

\- serialization

\- snapshots

\- persistence

\- APIs

\- workspace routing

\- future integrations



Operator-facing terminology may evolve independently.



Presentation labels SHALL NOT require runtime refactoring.



\---



\# Investigation Workbench



The Investigation Workbench is the primary operational environment of iSEES.



It is \*\*not\*\* a workspace.



It is \*\*not\*\* a tab.



It is the complete investigative operating environment.



The Workbench contains all investigative capabilities, including:



\- Overview

\- Investigation Manifold

\- Compare

\- Narrative

\- Evidence

\- Timeline

\- Layers

\- Intention

\- Authoring Studio



\---



\# Investigation Manifold



The Investigation Manifold is the heart of iSEES.



It represents the investigation itself.



The graph owns navigation.



The graph owns investigative context.



All supporting information is projected from the graph.



The graph SHALL remain the dominant visual element of the Workbench.



\---



\## Responsibilities



The Investigation Manifold:



\- owns graph navigation

\- owns investigation context

\- owns selection

\- owns graph visualization

\- provides graph-first investigation



The graph represents objective investigative reality.



\---



\# Selection Intelligence



Selection Intelligence exists for one purpose.



Inspect.



It is deterministic.



It is graph-driven.



It presents information about the currently selected object.



Selection Intelligence SHALL NOT become a working surface.



Selection Intelligence SHALL NOT become a notebook.



Selection Intelligence SHALL remain read-only.



\---



\# Research Desk



The Research Desk represents the investigator's active reasoning.



It is not storage.



It is not a database.



It is not automatically populated.



It represents conscious investigator attention.



Everything placed on the Research Desk has been intentionally selected by the investigator.



\---



\## The Research Desk May Contain



\- Artifacts

\- Relationships

\- Notes

\- Questions

\- Leads

\- Collections

\- Timeline Selections

\- Graph Neighborhoods

\- Snapshots

\- Pinned Items



These are live references into the investigation.



They are not copies.



\---



\## Research Desk Principles



The Desk is:



\- persistent

\- investigator-owned

\- spatial

\- curated

\- manually populated



The Desk supports investigator reasoning.



It does not replace the graph.



\---



\## Quick Drop Zone



The Research Desk exposes a permanent Quick Drop Zone.



The Quick Drop Zone remains visible while the Desk is collapsed.



Investigators may drag objects directly from the graph into the Quick Drop Zone.



The Desk may expand when needed.



Selection Intelligence remains visible whenever possible.



\---



\# Authoring Studio



Internally:



```text

WorkspaceMode.RESEARCH

```



Operator-facing name:



\*\*Authoring Studio\*\*



The Authoring Studio transforms investigative reasoning into durable research artifacts.



Examples include:



\- reports

\- white papers

\- publications

\- congressional briefings

\- presentations

\- intelligence products

\- technical documentation



The Authoring Studio consumes curated material from the Research Desk.



\---



\# Artificial Intelligence



Artificial Intelligence serves the investigator.



It never replaces investigator judgment.



AI MAY:



\- summarize

\- organize

\- cluster

\- draft

\- recommend

\- identify contradictions

\- identify missing evidence

\- explain relationships



AI SHALL NOT:



\- silently modify the Research Desk

\- silently add artifacts

\- silently remove investigator work

\- silently answer unresolved questions

\- silently alter investigative context



All AI contributions shall remain explicitly attributable.



\---



\# Provenance



Objects placed upon the Research Desk should preserve provenance whenever practical.



Recommended metadata includes:



\- Added By

\- Added Time

\- Origin

\- Reason

\- AI Suggestion (if applicable)



Investigators should always understand why an object appears on the Desk.



\---



\# Cognitive Flow



The canonical investigative workflow is:



```text

Observe



↓



Investigate



↓



Inspect



↓



Collect



↓



Think



↓



Author



↓



Publish

```



Within iSEES this becomes:



```text

Investigation Workbench



↓



Investigation Manifold



↓



Selection Intelligence



↓



Research Desk



↓



Authoring Studio



↓



Research Artifact

```



\---



\# Cognitive Responsibilities



\## Investigation Manifold



Represents objective investigative reality.



\---



\## Selection Intelligence



Explains what is currently selected.



\---



\## Research Desk



Represents the investigator's evolving understanding.



\---



\## Authoring Studio



Transforms investigative understanding into durable research artifacts.



\---



\# Canonical Principle



The graph represents reality.



The Research Desk represents the investigator's mind.



The Authoring Studio communicates that understanding to others.



\---



\# Guiding Philosophy



iSEES is not a graph viewer.



It is not a reporting application.



It is an investigative operating environment designed around the natural cognitive workflow of professional investigators.



Investigators:



\- observe

\- inspect

\- collect

\- question

\- reason

\- communicate



Every major component of iSEES exists to support one—and only one—of those cognitive activities.



This separation of responsibilities minimizes cognitive friction while preserving deterministic, inspectable, investigator-controlled workflows.



\---



\# Implementation Guidance



Future development SHALL preserve the distinction between:



\- objective investigation state

\- investigator reasoning

\- authored communication



These responsibilities shall remain independent.



Future features should strengthen these boundaries rather than blur them.



This document establishes the canonical cognitive architecture for P40 and serves as the foundation for future iterations of the iSEES platform.

