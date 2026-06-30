// ============================================================
// src/manifold/engine/manifoldContextResolver.ts
// P29 MANIFOLD ENGINE FOUNDATION
// DETERMINISTIC INVESTIGATION CONTEXT RESOLVER
// FULL DROP-IN FILE
// ============================================================

import type {
  InvestigationGraph,
  GraphSelection,
} from "../graphTypes";

import type {
  InvestigationContext,
} from "../context/GraphContext";

// ============================================================
// RESOLVE INVESTIGATION CONTEXT
// ============================================================
//
// This resolver converts low-level graph interaction into
// operator-facing investigation context.
//
// The rest of the application should consume this resolved
// context instead of directly inspecting graph nodes or edges.
//
// Future:
//
// • entity resolution
// • inferred investigation focus
// • recommended surfaces
// • RDC recomputation
// • operator workflow guidance
//
// ============================================================

export function resolveInvestigationContext(

  graph: InvestigationGraph,

  selection: GraphSelection,

): InvestigationContext {

  // ==========================================================
  // DEFAULT CONTEXT
  // ==========================================================

  const context: InvestigationContext = {

    selectedNodeId: null,

    selectedEdgeId: null,

    selectedEventId: null,

    selectedFacilityId: null,

    selectedArtifactId: null,

    selectedClusterId: null,

  };

  // ==========================================================
  // NO SELECTION
  // ==========================================================

  if (

    selection.kind === "NONE"

  ) {

    return context;

  }

  // ==========================================================
  // NODE SELECTION
  // ==========================================================

  if (

    selection.kind === "NODE"

  ) {

    context.selectedNodeId =
      selection.nodeId;

    const node =

      graph.nodes.find(

        n =>

          n.id ===

          selection.nodeId

      );

    if (

      !node

    ) {

      return context;

    }

    switch (

      node.type

    ) {

      case "EVENT":

        context.selectedEventId =
          node.id;

        break;

      case "FACILITY":

        context.selectedFacilityId =
          node.id;

        break;

      case "ARTIFACT":

        context.selectedArtifactId =
          node.id;

        break;

      default:

        break;

    }

    return context;

  }

  // ==========================================================
  // EDGE SELECTION
  // ==========================================================

  if (

    selection.kind === "EDGE"

  ) {

    context.selectedEdgeId =
      selection.edgeId;

    return context;

  }

  // ==========================================================
  // CLUSTER SELECTION
  // ==========================================================

  if (

    selection.kind === "CLUSTER"

  ) {

    context.selectedClusterId =
      selection.clusterId;

    return context;

  }

  return context;
}

// ============================================================
// FUTURE
// ============================================================
//
// Planned evolution:
//
// resolveInvestigationContext()
//      ↓
//
// Graph Selection
//      ↓
//
// Entity Resolution
//      ↓
//
// Narrative Resolution
//      ↓
//
// Layer Resolution
//      ↓
//
// Topology Resolution
//      ↓
//
// Recommended Surface
//      ↓
//
// Operator Intent
//
// At that point the Investigation Context becomes the
// deterministic cognitive state shared by every panel in
// iSEES.
//
// ============================================================