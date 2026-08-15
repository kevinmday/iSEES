// ============================================================
// src/manifold/components/PrimaryInvestigationManifold.tsx
// P56D-H
// PRIMARY INVESTIGATION WORKSPACE
//
// Central projection host for an Investigation Session.
//
// WorkspaceRuntime owns:
//
// • Active Workspace Mode
// • Active Investigation
// • Computational Configuration C = (L, T, S)
// • Canonical Operator Selection
//
// KnowledgeObjectRuntime owns:
//
// • Canonical Knowledge Object population K
//
// ResolveRuntime owns:
//
// • Resolve execution lifecycle
// • Canonical universe construction
// • Deterministic Resolve execution
// • Canonical manifold result
// • Candidate generation
// • Candidate evaluation
// • Provenance
// • Execution history
//
// Resolve Candidate Intelligence provides:
//
// • deterministic E -> Ic projection
// • operator-inspectable candidate explanation
//
// Workspace Candidate Selection provides:
//
// • deterministic Ic -> Sc projection
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
//      ↓
// RESOLVE
//      ↓
// Primary Investigation Manifold
//      ├── Investigation
//      ├── K — Knowledge Objects
//      ├── L — Active Layers
//      ├── T — Temporal Context
//      └── S — Investigative Scale
//              ↓
//         ResolveRuntime
//              ↓
//      Canonical Universe
//              ↓
//        Resolve Engine
//              ↓
//        M -> C -> E
//              ↓
//             Ic[]
//              ↓
//     Resolve Candidate Surface
//              ↓
//         operator click
//              ↓
//              Sc
//              ↓
//       WorkspaceRuntime
//              ↓
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
// • establish relationships
// • create GraphEdges
// • mutate graph topology
// • promote Knowledge
// • generate Research Vectors
// • execute REX
// • recompute similarity
// • recompute evaluation
// • rank candidates
// • threshold candidates
// • introduce AI inference
//
// ============================================================

import {
  useMemo,
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
} from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

import {
  useResolveRuntime,
  useResolveRuntimeState,
} from "../../resolve/runtime/ResolveRuntimeContext";

import {
  resolveCandidateIntelligenceCollection,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceResolver";

import {
  createWorkspaceCandidateSelection,
} from "../../resolve/intelligence/ResolveCandidateSelection";

import type {
  ResolveCandidateIntelligence,
} from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";

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

  // ==========================================================
  // CANONICAL RUNTIME INPUT SOURCES
  // ==========================================================

  const knowledgeRuntime =
    useKnowledgeObjectRuntime();

  const workspaceRuntime =
    useWorkspaceRuntime();

  const resolveRuntime =
    useResolveRuntime();

  const resolveState =
    useResolveRuntimeState();

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

  const candidateEvaluations =
    resolveState
      .currentExecution
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
  // • sort
  // • rank
  // • threshold
  // • filter by score
  // • reinterpret evidence
  //
  // ==========================================================

  const candidateIntelligenceCollection =
    useMemo(
      () => {

        if (
          candidateEvaluations ===
          undefined
        ) {

          return undefined;

        }

        return resolveCandidateIntelligenceCollection(
          candidateEvaluations.evaluations,
        );

      },
      [
        candidateEvaluations,
      ],
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
      );

    workspaceRuntime.setSelection(
      selection,
    );

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
    // RESOLVE
    // --------------------------------------------------------

    if (
      action ===
      "RESOLVE"
    ) {

      console.log(
        "P56D-H LIVE RESOLVE CLICK RECEIVED",
      );

      const activeInvestigation =
        workspaceRuntime.getActiveInvestigation();

      console.log(
        "P56D-H ACTIVE INVESTIGATION:",
        activeInvestigation,
      );

      // ------------------------------------------------------
      // RESOLVE PRECONDITION
      // ------------------------------------------------------

      if (
        activeInvestigation ===
        undefined
      ) {

        console.warn(
          "RESOLVE ignored: no active Investigation.",
        );

        return;

      }

      // ------------------------------------------------------
      // K — CANONICAL KNOWLEDGE POPULATION
      // ------------------------------------------------------

      const knowledgeObjects =
        knowledgeRuntime.getObjects();

      // ------------------------------------------------------
      // L — ACTIVE COMPUTATIONAL LAYERS
      // ------------------------------------------------------

      const activeLayers =
        workspaceRuntime.getActiveLayers();

      // ------------------------------------------------------
      // T — TEMPORAL CONTEXT
      // ------------------------------------------------------

      const temporalContext =
        workspaceRuntime.getTemporalContext();

      // ------------------------------------------------------
      // S — INVESTIGATIVE SCALE
      // ------------------------------------------------------

      const investigativeScale =
        workspaceRuntime.getInvestigativeScale();

      // ------------------------------------------------------
      // INPUT DIAGNOSTIC
      // ------------------------------------------------------

      console.log(
        "P56D-H RESOLVE INPUT READY:",
        {

          investigationId:
            activeInvestigation.id,

          knowledgeObjectCount:
            knowledgeObjects.length,

          activeLayers,

          temporalContext,

          investigativeScale,

        },
      );

      // ------------------------------------------------------
      // CANONICAL RESOLVE EXECUTION
      // ------------------------------------------------------

      console.log(
        "P56D-H CALLING ResolveRuntime.execute()",
      );

      resolveRuntime.execute({

        investigation:
          activeInvestigation,

        knowledgeObjects,

        activeLayers,

        temporalContext,

        investigativeScale,

      });

      console.log(
        "P56D-H ResolveRuntime.execute() RETURNED",
      );

      return;

    }

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

      {/* =================================================== */}
      {/* TEMPORARY P56 RESOLVE DIAGNOSTIC                   */}
      {/* =================================================== */}

      <div
        style={{
          position:
            "absolute",

          top:
            12,

          right:
            12,

          zIndex:
            1000,

          padding:
            "8px 10px",

          border:
            "1px solid rgba(148,163,184,0.28)",

          borderRadius:
            6,

          background:
            "rgba(2,6,23,0.94)",

          color:
            "#e2e8f0",

          fontFamily:
            "monospace",

          fontSize:
            11,

          lineHeight:
            1.5,

          pointerEvents:
            "none",
        }}
      >

        <div>
          Resolve: {
            resolveState.status
          }
        </div>

        <div>
          Revision: {
            resolveState.revision
          }
        </div>

        <div>
          History: {
            resolveState.history.length
          }
        </div>

        <div>
          Current: {
            resolveState.currentExecution
              ? resolveState
                  .currentExecution
                  .executionId
              : "none"
          }
        </div>

        <div>
          Result: {
            resolveState
              .currentExecution
              ?.result
              ? "YES"
              : "NO"
          }
        </div>

        <div>
          Candidates: {
            candidateIntelligenceCollection
              ?.intelligenceCount ??
            0
          }
        </div>

      </div>

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

        <div
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

          <div
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
              RESOLVE CANDIDATES
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

          </div>

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
            Potential relationships — inspect only
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
      .candidateId;

                  return (

                    <button
                      key={
                        intelligence
                          .identity
                          .candidateId
                      }
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
                          CANDIDATE {
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

                  );

                },
              )}

          </div>

        </div>

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