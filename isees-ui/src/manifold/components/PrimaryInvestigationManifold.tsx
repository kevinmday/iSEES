// ============================================================
// src/manifold/components/PrimaryInvestigationManifold.tsx
// P56
// PRIMARY INVESTIGATION WORKSPACE
//
// Central projection host for an Investigation Session.
//
// The Workspace Runtime owns:
// • Active Workspace Mode
// • Active Investigation
// • Computational Configuration C = (L, T, S)
//
// KnowledgeObjectRuntime owns:
// • Canonical Knowledge Object population K
//
// ResolveRuntime owns:
// • Resolve execution lifecycle
// • Canonical universe construction
// • Deterministic Resolve execution
// • Canonical manifold result
// • Provenance
// • Execution history
//
// ManifoldRuntime continues to own manifold-facing operator
// orchestration and presentation operations.
//
// Resolve path:
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
//      Canonical Manifold
//
// ============================================================

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

  // ----------------------------------------------------------
  // Resolve state is observed only for the temporary P56
  // execution diagnostic.
  //
  // The diagnostic performs no computation and owns no state.
  // It will be removed after the end-to-end Resolve execution
  // boundary has been verified.
  // ----------------------------------------------------------

  const resolveState =
    useResolveRuntimeState();

  // ==========================================================
  // OPERATOR ACTIONS
  // ==========================================================

  function handleToolbarAction(
    action:
      ManifoldToolbarAction,
  ): void {

    // --------------------------------------------------------
    // RESOLVE
    // --------------------------------------------------------
    //
    // RESOLVE crosses the operator-intent boundary into the
    // canonical P55B Resolve Runtime.
    //
    // The UI does not perform computation.
    //
    // It gathers the current deterministic runtime-owned
    // inputs and submits them to ResolveRuntime.
    //
    // The active Investigation is owned by WorkspaceRuntime.
    // No separate Investigation React context is required.
    //
    // --------------------------------------------------------

    if (
      action ===
      "RESOLVE"
    ) {

      const activeInvestigation =
        workspaceRuntime.getActiveInvestigation();

      // ------------------------------------------------------
      // RESOLVE PRECONDITION
      // ------------------------------------------------------
      //
      // ResolveComputationInput requires a canonical active
      // Investigation.
      //
      // If none exists, terminate the operator command at
      // this boundary.
      //
      // We deliberately do NOT:
      //
      // • manufacture an Investigation
      // • cast undefined into Investigation
      // • infer Investigation state
      // • fall back to parallel React-owned state
      //
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
      // CANONICAL RESOLVE EXECUTION
      // ------------------------------------------------------
      //
      // At this boundary:
      //
      //     I + K + L + T + S
      //
      // become the deterministic Resolve computation input.
      //
      // ------------------------------------------------------

      resolveRuntime.execute({

        investigation:
          activeInvestigation,

        knowledgeObjects,

        activeLayers,

        temporalContext,

        investigativeScale,

      });

      return;

    }

    // --------------------------------------------------------
    // MANIFOLD OPERATIONS
    // --------------------------------------------------------
    //
    // DISSOLVE
    // COLLAPSE
    // VIEW_2D
    // VIEW_3D
    //
    // remain owned by the existing Manifold Runtime until
    // their canonical P56/P57 integration boundaries are
    // realized.
    //
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
      {/*
          This instrument exists only to verify the live
          end-to-end Resolve execution boundary.

          It observes ResolveRuntime state.

          It performs no computation.
          It owns no computational state.
      */}

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

      </div>

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