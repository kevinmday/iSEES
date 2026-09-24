// ============================================================
// src/manifold/components/PrimaryInvestigationManifold.tsx
// P56D-H
// PRIMARY INVESTIGATION WORKSPACE
//
// Central projection host for an Investigation Session.
//
// WorkspaceRuntime owns:
//
// â€¢ Active Workspace Mode
// â€¢ Active Investigation
// â€¢ Computational Configuration C = (L, T, S)
// â€¢ Canonical Operator Selection
//
// KnowledgeObjectRuntime owns:
//
// â€¢ Canonical Knowledge Object population K
//
// ResolveRuntime owns:
//
// â€¢ Resolve execution lifecycle
// â€¢ Canonical universe construction
// â€¢ Deterministic Resolve execution
// â€¢ Canonical manifold result
// â€¢ Candidate generation
// â€¢ Candidate evaluation
// â€¢ Provenance
// â€¢ Execution history
//
// Resolve Candidate Intelligence provides:
//
// â€¢ deterministic E -> Ic projection
// â€¢ operator-inspectable candidate explanation
//
// Workspace Candidate Selection provides:
//
// â€¢ deterministic Ic -> Sc projection
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Candidate derivation:
//
//                 C = h(M.similarityMatrix)
//
// Candidate evaluation:
//
//                 E = q(C)
//
// Candidate Intelligence:
//
//                 Ic = p(E)
//
// Candidate selection:
//
//                 Sc = s(Ic)
//
// LIVE OPERATOR PATH
//
// Operator
//      â†“
// RESOLVE
//      â†“
// Primary Investigation Manifold
//      â”œâ”€â”€ Investigation
//      â”œâ”€â”€ K â€” Knowledge Objects
//      â”œâ”€â”€ L â€” Active Layers
//      â”œâ”€â”€ T â€” Temporal Context
//      â””â”€â”€ S â€” Investigative Scale
//              â†“
//         ResolveRuntime
//              â†“
//      Canonical Universe
//              â†“
//        Resolve Engine
//              â†“
//        M -> C -> E
//              â†“
//             Ic[]
//              â†“
//     Resolve Candidate Surface
//              â†“
//         operator click
//              â†“
//              Sc
//              â†“
//       WorkspaceRuntime
//              â†“
//          RightPanel
//
// CRITICAL EPISTEMIC BOUNDARY
//
//                 CANDIDATE != EDGE
//
// Candidate affordances represent potential relationships.
//
// They do NOT:
//
// â€¢ establish relationships
// â€¢ create GraphEdges
// â€¢ mutate graph topology
// â€¢ promote Knowledge
// â€¢ generate Research Vectors
// â€¢ execute REX
// â€¢ recompute similarity
// â€¢ recompute evaluation
// â€¢ rank candidates
// â€¢ threshold candidates
// â€¢ introduce AI inference
//
// ============================================================
import {
  Fragment,
  useEffect,
  useState,
} from "react";

import InvestigationGraph
from "./InvestigationGraph";

import type {
  ManifoldToolbarAction,
} from "./ManifoldToolbar";

import {
  manifoldRuntime,
} from "../engine/manifoldRuntime";

import {
  useKnowledgeObjectRuntime,
  useKnowledgeObjects,
} from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";
import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";

import {
  useResolveRuntimeState,
} from "../../resolve/runtime/ResolveRuntimeContext";
import { resolveCurrentExecutionCandidateSelection } from "../../resolve/runtime/useResolveExecutionCommand";

// ============================================================
// P57-UI-A5-I3 — PROJECTION ACCEPTANCE GUARD
// ============================================================

import {
  ManifoldProjectionStatusValue,
  useManifoldProjectionStatus,
} from "../../components/workspace/ManifoldProjectionStatus";

import {
  resolveCandidateIntelligenceCollection,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  createWorkspaceCandidateSelection,
} from "../../resolve/intelligence/ResolveCandidateSelection";

import {
  materializeAcceptedResolveCandidate,
  ResolveCandidateAcceptanceState,
  resolveCandidateAcceptanceState,
} from "../../resolve/acceptance/ResolveCandidateAcceptance";

import type {
  ResolveCandidateIntelligence,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";
import { useResearchBridge } from "../../research/ResearchBridgeContext";
import { reconcilePublishedCompareCandidates } from "../../compare/research/CompareCandidateResearchPublication";
import { useSessionStudioCandidates, type SessionStudioCandidateKnowledge } from "../../studio/candidate/SessionStudioCandidate";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";

// ============================================================
// TYPES
// ============================================================

interface PrimaryInvestigationManifoldProps {

  focusedEventId:
    string;

}

// ============================================================
// COMPONENT
// ============================================================

export default function PrimaryInvestigationManifold({
  focusedEventId:
    _focusedEventId,
}: PrimaryInvestigationManifoldProps) {

  void _focusedEventId;

  // ==========================================================
  // CANONICAL RUNTIME INPUT SOURCES
  // ==========================================================

  const knowledgeRuntime =
    useKnowledgeObjectRuntime();

  const knowledgeObjects =
    useKnowledgeObjects();

  const [acceptanceError, setAcceptanceError] =
    useState<{ candidateId: string; message: string } | undefined>();

  const workspaceRuntime =
    useWorkspaceRuntime();

  const operatorIdentity = useOperatorIdentity();
  const sessionStudioCandidates = useSessionStudioCandidates(operatorIdentity.identity?.kind === "GUEST" ? workspaceRuntime.getActiveInvestigation()?.id : undefined).filter(() => operatorIdentity.identity?.kind === "GUEST");
  const [selectedStudioCandidate, setSelectedStudioCandidate] = useState<SessionStudioCandidateKnowledge | undefined>();

  const researchBridgeRuntime = useResearchBridge();

  useEffect(() => {
    reconcilePublishedCompareCandidates(
      researchBridgeRuntime,
      knowledgeObjects,
      workspaceRuntime.getActiveInvestigation()?.id,
    );
  }, [knowledgeObjects, researchBridgeRuntime, workspaceRuntime]);

  const resolveState =
    useResolveRuntimeState();

    // ==========================================================
  // P57-UI-A5-I3 — CANDIDATE ACCEPTANCE AUTHORITY
  // ==========================================================
  //
  // Resolve candidates remain available for inspection when
  // the projection is stale.
  //
  // Acceptance may cross the candidate-to-Knowledge boundary
  // only when the latest Resolve execution corresponds to the
  // currently selected computational context C = (L,T,S).
  //
  // ==========================================================

  const projectionStatus =
    useManifoldProjectionStatus();

  const candidateAcceptanceAllowed =
    projectionStatus.status ===
    ManifoldProjectionStatusValue.SYNCHRONIZED;

  // ==========================================================
  // LATEST CANONICAL CANDIDATE EVALUATION PRODUCT
  // ==========================================================
  //
  // Candidate evaluations are produced by ResolveEngine and
  // preserved by ResolveRuntime.
  //
  // This component does not compute or alter them.
  //
  // ==========================================================

  const completedExecution =
    resolveCurrentInvestigationExecution(
      workspaceRuntime.getActiveInvestigation(),
      resolveState.currentExecution,
    );

  const candidateEvaluations =
    completedExecution
      ?.result
      ?.candidateEvaluations;

  // ==========================================================
  // CANDIDATE INTELLIGENCE PROJECTION
  // ==========================================================
  //
  //                 E -> Ic
  //
  // This is the same deterministic explanatory projection
  // consumed by RightPanel.
  //
  // IMPORTANT:
  //
  // The collection preserves canonical evaluation ordering.
  //
  // This surface deliberately does NOT:
  //
  // â€¢ sort
  // â€¢ rank
  // â€¢ threshold
  // â€¢ filter by score
  // â€¢ reinterpret evidence
  //
  // ==========================================================

  const candidateIntelligenceCollection =
    candidateEvaluations === undefined
      ? undefined
      : resolveCandidateIntelligenceCollection(
          candidateEvaluations.evaluations,
        );

  // ==========================================================
  // WORKSPACE OPERATOR SELECTION
  // ==========================================================
  //
  // WorkspaceRuntime owns canonical operator selection.
  //
  // GraphContext remains responsible only for graph-local
  // NODE / EDGE / NONE selection.
  //
  // ==========================================================

  const workspaceSelection =
    workspaceRuntime.getSelection();

  // ==========================================================
  // CANDIDATE SELECTION
  // ==========================================================
  //
  //                 Ic -> Sc
  //
  // Candidate selection is inspection state only.
  //
  // It creates no topology.
  //
  // ==========================================================

  function handleCandidateSelection(
    intelligence:
      ResolveCandidateIntelligence,
  ): void {

    const selection =
      createWorkspaceCandidateSelection(
        intelligence,
        completedExecution?.executionId,
      );

    workspaceRuntime.setSelection(
      selection,
    );

  }

  // ==========================================================
  // CANDIDATE ACCEPTANCE
  // ==========================================================
  //
  // Candidate selection is inspection only.
  //
  // Explicit operator acceptance crosses the epistemic
  // boundary:
  //
  //        Candidate Intelligence
  //                 ↓
  //              ACCEPT
  //                 ↓
  //       Knowledge Relationship
  //
  // No GraphEdge is manufactured here. Canonical Knowledge
  // remains authoritative.
  //
  // ==========================================================

  function handleCandidateAcceptance(
    intelligence:
      ResolveCandidateIntelligence,
  ): void {

    const currentSelection = workspaceRuntime.getSelection();
    const selectedFromCurrentExecution = currentSelection?.kind === "CANDIDATE" &&
      resolveCurrentExecutionCandidateSelection(currentSelection, completedExecution) &&
      currentSelection.candidateId === intelligence.identity.candidateId &&
      currentSelection.evaluationId === intelligence.identity.evaluationId &&
      currentSelection.leftKnowledgeObjectId === intelligence.identity.leftKnowledgeObjectId &&
      currentSelection.rightKnowledgeObjectId === intelligence.identity.rightKnowledgeObjectId;

    // ========================================================
    // P57-UI-A5-I3 — STALE CANDIDATE GUARDRAIL
    // ========================================================
    //
    // Inspection remains permitted for historical Resolve
    // candidates. Acceptance is blocked unless the candidate
    // belongs to a projection synchronized with the current
    // computational context C = (L,T,S).
    //
    // ========================================================

    if (
      !candidateAcceptanceAllowed ||
      !selectedFromCurrentExecution
    ) {

      console.warn(
        "CANDIDATE ACCEPTANCE BLOCKED: manifold projection is not synchronized.",
        {
          candidateId:
            intelligence.identity.candidateId,

          projectionStatus:
            projectionStatus.status,

          selectedLayerCount:
            projectionStatus.selectedLayerCount,

          resolvedLayerCount:
            projectionStatus.resolvedLayerCount,

          executionId:
            projectionStatus.executionId,
        },
      );

      setAcceptanceError(
        {
          candidateId: intelligence.identity.candidateId,
          message: "Relationship acceptance failed: recompute after governing context changes, then select an exact current relationship candidate.",
        },
      );

      return;

    }

    try {
      const result =
        materializeAcceptedResolveCandidate(
          intelligence,
          knowledgeRuntime.getObjects(),
        );

      if (
        !result.changed
      ) {

        setAcceptanceError(undefined);

      console.log(
        "P56D-I1-G6 CANDIDATE ALREADY ACCEPTED:",
        result.relationship.id,
      );

        return;

    }

      knowledgeRuntime.updateObject(
        result.knowledgeObject,
      );

      reconcilePublishedCompareCandidates(
        researchBridgeRuntime,
        knowledgeRuntime.getObjects(),
        workspaceRuntime.getActiveInvestigation()?.id,
      );

      setAcceptanceError(undefined);

      console.log(
      "P56D-I1-G6 CANDIDATE ACCEPTED:",
      {
        candidateId:
          intelligence.identity.candidateId,

        sourceKnowledgeObjectId:
          result.sourceKnowledgeObjectId,

        targetKnowledgeObjectId:
          result.targetKnowledgeObjectId,

        relationshipId:
          result.relationship.id,
      },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown acceptance error.";

      setAcceptanceError(
        {
          candidateId: intelligence.identity.candidateId,
          message: `Relationship acceptance failed: ${message}`,
        },
      );

      console.error(
        "CANDIDATE ACCEPTANCE FAILED:",
        error,
      );
    }

  }

  // ==========================================================
  // OPERATOR ACTIONS
  // ==========================================================

  function handleToolbarAction(
    action:
      ManifoldToolbarAction,
  ): void {

    // --------------------------------------------------------
    // P56D-H OPERATOR-GESTURE DIAGNOSTIC
    // --------------------------------------------------------
    //
    // Retained temporarily while live P56D-H integration is
    // verified.
    //
    // --------------------------------------------------------

    console.log(
      "P56D-H MANIFOLD ACTION RECEIVED:",
      action,
    );

    // --------------------------------------------------------
    // MANIFOLD OPERATIONS
    // --------------------------------------------------------

    manifoldRuntime.dispatch(
      action,
    );

  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <section
      style={{
        width:
          "100%",

        height:
          "100%",

        flex:
          1,

        minWidth:
          0,

        minHeight:
          0,

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          16,

        overflow:
          "hidden",

        position:
          "relative",
      }}
    >

      {sessionStudioCandidates.length > 0 && <aside className="manifold-session-candidates" aria-label="Session Candidate Knowledge overlay" style={{ position:"absolute", left:12, top:118, zIndex:1000, width:300, padding:12, border:"2px dashed #c084fc", borderRadius:10, background:"rgba(30, 10, 50, .96)", color:"#f5d0fe" }}>
        <strong style={{ display:"block", letterSpacing:".1em" }}>CANDIDATE KNOWLEDGE</strong><span style={{ display:"block", color:"#f0abfc", fontSize:11 }}>SESSION ONLY · NON-CANONICAL</span>
        <p style={{ fontSize:11, color:"#d8b4fe" }}>Inspectable Studio publications. Excluded from canonical topology, accepted relationship counts, and Resolve inputs.</p>
        <div style={{ display:"grid", gap:6 }}>{sessionStudioCandidates.map(candidate => <button key={candidate.candidateId} type="button" onClick={() => setSelectedStudioCandidate(candidate)} style={{ padding:8, border:"1px dashed #d8b4fe", background:selectedStudioCandidate?.candidateId === candidate.candidateId ? "#581c87" : "#2e1065", color:"#fff", textAlign:"left", cursor:"pointer" }}><strong>{candidate.title}</strong><small style={{ display:"block" }}>UNACCEPTED · Canon effect NONE</small></button>)}</div>
        {selectedStudioCandidate && <dl style={{ display:"grid", gridTemplateColumns:"38% 1fr", gap:4, marginBottom:0, fontSize:10 }}><dt>Summary</dt><dd>{selectedStudioCandidate.summary}</dd><dt>Document</dt><dd>{selectedStudioCandidate.sourceDocumentId}</dd><dt>Content hash</dt><dd>{selectedStudioCandidate.contentHash}</dd><dt>Provenance</dt><dd>Explicit Studio publication</dd><dt>Sources</dt><dd>{selectedStudioCandidate.sourceAnchors.length}</dd></dl>}
      </aside>}


      {/* =================================================== */}
      {/* RESOLVE CANDIDATE AFFORDANCE                       */}
      {/* =================================================== */}
      {/*
          Operator inspection surface only.

          This is NOT graph topology.

          Candidate order remains canonical evaluation order.
          No ranking or threshold is applied.
      */}

      {candidateIntelligenceCollection !==
        undefined &&
        candidateIntelligenceCollection
          .intelligenceCount > 0 && (

        <details
          style={{
            position:
              "absolute",

            top:
              118,

            right:
              12,

            zIndex:
              999,

            width:
              320,

            maxHeight:
              "calc(100% - 150px)",

            overflowY:
              "auto",

            padding:
              10,

            border:
              "1px solid rgba(56,189,248,0.30)",

            borderRadius:
              8,

            background:
              "rgba(2,6,23,0.96)",

            boxShadow:
              "0 12px 32px rgba(0,0,0,0.38)",

            fontFamily:
              "Consolas, monospace",
          }}
        >

          <summary
            title="Expand or collapse Relationship Candidates"
            onClick={
              event => {

                event.preventDefault();

                const details =
                  event.currentTarget
                    .parentElement;

                if (
                  details instanceof
                    HTMLDetailsElement
                ) {
                  details.open =
                    !details.open;
                }

              }
            }
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              marginBottom:
                8,

              color:
                "#7dd3fc",

              fontSize:
                11,

              fontWeight:
                700,

              letterSpacing:
                "0.08em",
            }}
          >

            <span>
              RELATIONSHIP CANDIDATES
            </span>

            <span
              style={{
                color:
                  "#94a3b8",
              }}
            >
              {
                candidateIntelligenceCollection
                  .intelligenceCount
              }
            </span>

          </summary>

          <div
            style={{
              marginBottom:
                8,

              color:
                "#64748b",

              fontSize:
                10,

              lineHeight:
                1.4,
            }}
          >
            Computation produces non-canonical candidate relationships. Inspecting a relationship candidate does not change the computation or accept the relationship.
          </div>

          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                6,
            }}
          >

             {candidateIntelligenceCollection
              .intelligence
              .map(
                (
                  intelligence,
                  index,
                ) => {

                  const isSelected =
                    workspaceSelection
                      ?.kind ===
                      "CANDIDATE" &&
                    workspaceSelection.candidateId ===
                      intelligence
                        .identity
                        .candidateId &&
                    workspaceSelection.evaluationId === intelligence.identity.evaluationId &&
                    workspaceSelection.leftKnowledgeObjectId === intelligence.identity.leftKnowledgeObjectId &&
                    workspaceSelection.rightKnowledgeObjectId === intelligence.identity.rightKnowledgeObjectId;
                  const selectedFromCurrentExecution = isSelected &&
                    resolveCurrentExecutionCandidateSelection(workspaceSelection, completedExecution);

                  return (

                    <Fragment
                      key={
                        intelligence
                          .identity
                          .candidateId
                      }
                    >

                      <button
                        type="button"

                        onClick={
                          () =>
                            handleCandidateSelection(
                              intelligence,
                            )
                        }
                        style={{
                          width:
                            "100%",

                          padding:
                            "8px 9px",

                          border:
                            isSelected
                              ? "1px solid rgba(56,189,248,0.85)"
                              : "1px solid rgba(148,163,184,0.20)",

                          borderRadius:
                            6,

                          background:
                            isSelected
                              ? "rgba(14,116,144,0.24)"
                              : "rgba(15,23,42,0.72)",

                          color:
                            "#e2e8f0",

                          textAlign:
                            "left",

                          cursor:
                            "pointer",

                          fontFamily:
                            "Consolas, monospace",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              8,

                            marginBottom:
                              5,
                          }}
                        >

                          <span
                            style={{
                              color:
                                "#7dd3fc",

                              fontSize:
                                10,

                              fontWeight:
                                700,
                            }}
                          >
                            RELATIONSHIP CANDIDATE {
                              index + 1
                            }
                          </span>

                          <span
                            style={{
                              color:
                                "#cbd5e1",

                              fontSize:
                                10,
                            }}
                          >
                            S={
                              intelligence
                                .explanation
                                .aggregate
                                .aggregateSimilarity
                                .toFixed(3)
                            }
                          </span>

                        </div>

                        <div
                          style={{
                            color:
                              "#f8fafc",

                            fontSize:
                              10,

                            lineHeight:
                              1.4,

                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {
                            intelligence
                              .identity
                              .leftKnowledgeObjectId
                          }
                        </div>

                        <div
                          style={{
                            color:
                              "#64748b",

                            fontSize:
                              10,

                            lineHeight:
                              1.2,
                          }}
                        >
                          ↕ potential relationship
                        </div>

                        <div
                          style={{
                            color:
                              "#f8fafc",

                            fontSize:
                              10,

                            lineHeight:
                              1.4,

                            overflowWrap:
                              "anywhere",
                          }}
                        >
                          {
                            intelligence
                              .identity
                              .rightKnowledgeObjectId
                          }
                        </div>

                        <div
                          style={{
                            marginTop:
                              6,

                            color:
                              "#94a3b8",

                            fontSize:
                              9,
                          }}
                        >
                          Evidence {
                            intelligence
                              .explanation
                              .evidence
                              .availableDimensionCount
                          }/{
                            intelligence
                              .explanation
                              .evidence
                              .totalDimensionCount
                          } dimensions
                        </div>

                      </button>

                                           {/* ===================================================== */}
                      {/* P56D-I1-G6 — EXPLICIT CANDIDATE ACCEPTANCE            */}
                      {/* ===================================================== */}
                      {/*
                        Candidate selection above is INSPECTION ONLY.

                        Explicit ACCEPT crosses the epistemic boundary:

                          Candidate Intelligence
                                   ↓
                                ACCEPT
                                   ↓
                          Knowledge Relationship

                        CANDIDATE != RELATIONSHIP
                      */}

                      {isSelected && (() => {
                        const acceptance = resolveCandidateAcceptanceState(
                          intelligence,
                          knowledgeObjects,
                        );
                        const accepted = acceptance.state === ResolveCandidateAcceptanceState.ACCEPTED;
                        const conflict = acceptance.state === ResolveCandidateAcceptanceState.MALFORMED_CONFLICT;
                        const acceptanceDescription = accepted
                          ? "This candidate has been accepted as a canonical relationship in the Investigation Manifold."
                          : conflict
                            ? acceptance.message ?? "Canonical relationship state is malformed."
                            : "Create a canonical relationship between these events. This changes the Investigation Manifold.";

                        return (

                        <div>

                        <button
                          type="button"

                                                    // P57-UI-A5-I3:
                          // Inspection remains available while stale.
                          // Acceptance requires a synchronized projection.

                          disabled={
                            accepted || conflict || !candidateAcceptanceAllowed || !selectedFromCurrentExecution
                          }

                          aria-disabled={
                            accepted || conflict || !candidateAcceptanceAllowed || !selectedFromCurrentExecution
                          }

                          title={acceptanceDescription}

                          aria-label={acceptanceDescription}

                          onClick={
                            event => {

                              event.stopPropagation();

                              handleCandidateAcceptance(
                                intelligence,
                              );

                            }
                          }
                          style={{
                            width:
                              "100%",

                            marginTop:
                              4,

                            padding:
                              "7px 9px",

                            border:
                              "1px solid rgba(34,197,94,0.55)",

                            borderRadius:
                              6,

                            background:
                              "rgba(20,83,45,0.32)",

                            color:
                              "#86efac",

                            cursor:
                              candidateAcceptanceAllowed && selectedFromCurrentExecution && !accepted && !conflict
                                ? "pointer"
                                : "not-allowed",

                            opacity:
                              (candidateAcceptanceAllowed && selectedFromCurrentExecution) || accepted
                                ? 1
                                : 0.48,

                            fontFamily:
                              "Consolas, monospace",

                            fontSize:
                              10,

                            fontWeight:
                              700,

                            letterSpacing:
                              "0.08em",

                            textAlign:
                              "center",
                          }}
                        >
                          {
                            accepted
                              ? "RELATIONSHIP ACCEPTED"
                              : conflict
                              ? "RELATIONSHIP CONFLICT"
                              : candidateAcceptanceAllowed && selectedFromCurrentExecution
                              ? "ACCEPT RELATIONSHIP"
                              : "RECOMPUTE REQUIRED"
                          }
                        </button>

                        {accepted && (
                          <div role="status" style={{ marginTop: 5, color: "#86efac", fontSize: 10 }}>
                            Canonical relationship created. EDGE {acceptance.relationshipId}
                          </div>
                        )}

                        {conflict && (
                          <div role="alert" style={{ marginTop: 5, color: "#fca5a5", fontSize: 10 }}>
                            {acceptance.message}
                          </div>
                        )}

                        {!accepted && !conflict && acceptanceError?.candidateId === intelligence.identity.candidateId && (
                          <div role="alert" style={{ marginTop: 5, color: "#fca5a5", fontSize: 10 }}>
                            {acceptanceError.message}
                          </div>
                        )}

                        </div>

                        );

                      })()}

                    </Fragment>

                  );

                },
              )}

          </div>

        </details>

      )}

      {/* =================================================== */}
      {/* INVESTIGATION MANIFOLD                              */}
      {/* =================================================== */}

      <div
        style={{
          flex:
            1,

          width:
            "100%",

          minWidth:
            0,

          minHeight:
            0,

          display:
            "flex",

          flexDirection:
            "column",

          overflow:
            "hidden",

          border:
            "1px solid rgba(148,163,184,0.12)",

          borderRadius:
            12,

          background:
            "#020617",
        }}
      >

        <InvestigationGraph
          onAction={
            handleToolbarAction
          }
        />

      </div>

    </section>

  );

}

// ============================================================
// END
// ============================================================
