// ============================================================
// src/knowledge/topology/KnowledgeTopologyAdapter.ts
// P56A
// KNOWLEDGE TOPOLOGY → MANIFOLD GRAPH ADAPTER
//
// Compatibility adapter between:
//
//     canonical Knowledge Topology G₀
//
// and:
//
//     existing manifold InvestigationGraph contract.
//
// The Knowledge Topology remains semantically authoritative.
//
// This adapter exists only because the legacy manifold graph
// contract currently supports a narrower node / relationship
// vocabulary than the Computational Knowledge Object Model.
//
// IMPORTANT:
//
// Canonical Knowledge semantics are NEVER rewritten here.
//
// Compatibility projection may use canonical semantic metadata
// to select the closest legacy manifold representation.
//
// No computation.
// No topology discovery.
// No inference.
// No layout.
// No React.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {
  GraphEdge,
  GraphIconType,
  GraphNode,
  GraphNodeType,
  GraphRelationshipType,
  GraphStatistics,
  InvestigationGraph,
} from "../../manifold/graphTypes";

import type {
  KnowledgeTopology,
  KnowledgeTopologyEdge,
  KnowledgeTopologyNode,
} from "./KnowledgeTopologyTypes";

// ============================================================
// SUPPORTED MANIFOLD NODE TYPES
// ============================================================

const SUPPORTED_NODE_TYPES =
  new Set([
    "EVENT",
    "FACILITY",
    "ARTIFACT",
    "PERSON",
    "ORGANIZATION",
    "LOCATION",
    "NARRATIVE",
    "HYPOTHESIS",
  ]);

// ============================================================
// SUPPORTED MANIFOLD RELATIONSHIP TYPES
// ============================================================

const SUPPORTED_RELATIONSHIP_TYPES =
  new Set([
    "SIMILARITY",
    "OBSERVED_AT",
    "ASSOCIATED_WITH",
    "LOCATED_AT",
    "SUPPORTS",
    "CONTRADICTS",
    "DERIVED_FROM",
    "REFERENCES",
    "INVESTIGATES",
  ]);

// ============================================================
// SEMANTIC TAG LOOKUP
// ============================================================
//
// KnowledgeTopologyBuilder preserves canonical Knowledge tags
// in:
//
//     node.metadata.tags
//
// The adapter may inspect those tags for compatibility
// projection.
//
// This does NOT modify canonical Knowledge semantics.
//
// ============================================================

function hasSemanticTag(
  node: KnowledgeTopologyNode,
  tag: string,
): boolean {

  const tags =
    node.metadata?.tags;

  if (
    !Array.isArray(
      tags,
    )
  ) {

    return false;

  }

  return tags.some(
    value =>
      typeof value === "string" &&
      value === tag,
  );

}

// ============================================================
// NODE TYPE ADAPTER
// ============================================================
//
// IMPORTANT:
//
// This conversion does NOT alter the canonical Knowledge Object
// type.
//
// It only maps richer KOM semantics into the narrower legacy
// manifold rendering vocabulary.
//
// Original type is preserved in node metadata.
//
// Canonical ENTITY is intentionally NOT globally equivalent to
// legacy FACILITY.
//
// Only an ENTITY explicitly carrying canonical facility
// semantics is projected as FACILITY.
//
// ============================================================

function adaptNodeType(
  node: KnowledgeTopologyNode,
): GraphNodeType {

  const type =
    node.type;

  if (
    SUPPORTED_NODE_TYPES.has(
      type as GraphNodeType,
    )
  ) {

    return type as GraphNodeType;

  }

  // ----------------------------------------------------------
  // CANONICAL FACILITY COMPATIBILITY
  // ----------------------------------------------------------
  //
  // System Canon represents infrastructure facilities as:
  //
  //     KnowledgeObjectType.ENTITY
  //
  // while preserving the semantic classification:
  //
  //     SYSTEM_CANON_FACILITY
  //
  // Therefore the legacy rendering projection is:
  //
  //     ENTITY + SYSTEM_CANON_FACILITY
  //                  ↓
  //              FACILITY
  //
  // Generic ENTITY remains generic at the canonical layer and
  // is NOT globally interpreted as a facility.
  //
  // ----------------------------------------------------------

  if (
    type === "ENTITY"
  ) {

    if (
      hasSemanticTag(
        node,
        "SYSTEM_CANON_FACILITY",
      )
    ) {

      return "FACILITY";

    }

    // --------------------------------------------------------
    // LEGACY FALLBACK
    // --------------------------------------------------------
    //
    // The current manifold vocabulary has no generic ENTITY
    // node type.
    //
    // Until that contract is expanded, an unclassified ENTITY
    // retains the historical compatibility fallback EVENT.
    //
    // Canonical type remains available through metadata as
    // canonicalKnowledgeType.
    //
    // --------------------------------------------------------

    return "EVENT";

  }

  switch (
    type
  ) {

    case "OBSERVATION":
      return "EVENT";

    case "EVIDENCE":
      return "ARTIFACT";

    case "DOCUMENT":
      return "ARTIFACT";

    case "REFERENCE":
      return "ARTIFACT";

    case "DATASET":
      return "ARTIFACT";

    case "MODEL":
      return "ARTIFACT";

    case "FACT":
      return "EVENT";

    case "RELATIONSHIP":
      return "EVENT";

    case "INTENTION":
      return "EVENT";

    case "CUSTOM":
      return "EVENT";

    default:
      return "EVENT";

  }

}

// ============================================================
// ICON TYPE ADAPTER
// ============================================================
//
// Icon projection follows the projected legacy node type where
// compatibility semantics matter.
//
// Canonical Knowledge type remains authoritative.
//
// ============================================================

function adaptIconType(
  node: KnowledgeTopologyNode,
  projectedType: GraphNodeType,
): GraphIconType | undefined {

  // ----------------------------------------------------------
  // PROJECTED FACILITY
  // ----------------------------------------------------------

  if (
    projectedType === "FACILITY"
  ) {

    // Canonical System Canon ingestion preserves the
    // original infrastructure classification as a tag.
    // Icon projection therefore remains deterministic and
    // does not infer identity from labels or descriptions.

    if (
      hasSemanticTag(
        node,
        "NAVAL STRIKE GROUP",
      )
    ) {

      return "SHIP";

    }

    if (
      hasSemanticTag(
        node,
        "AEGIS RADAR",
      )
    ) {

      return "RADAR";

    }

    if (
      hasSemanticTag(
        node,
        "AIRBORNE SENSOR",
      ) ||
      hasSemanticTag(
        node,
        "TARGETING POD",
      )
    ) {

      return "SENSOR";

    }

    if (
      hasSemanticTag(
        node,
        "MILITARY AIRSPACE",
      ) ||
      hasSemanticTag(
        node,
        "TRAINING RANGE",
      )
    ) {

      return "LOCATION";

    }

    return "BUILDING";

  }

  // ----------------------------------------------------------
  // CANONICAL TYPE
  // ----------------------------------------------------------

  switch (
    node.type
  ) {

    case "EVENT":
    case "OBSERVATION":
      return "UAP";

    case "PERSON":
      return "PERSON";

    case "ORGANIZATION":
      return "ORGANIZATION";

    case "LOCATION":
      return "LOCATION";

    case "NARRATIVE":
      return "NARRATIVE";

    case "HYPOTHESIS":
      return "HYPOTHESIS";

    case "ARTIFACT":
    case "EVIDENCE":
    case "DOCUMENT":
    case "REFERENCE":
    case "DATASET":
    case "MODEL":
      return "DOCUMENT";

    default:
      return undefined;

  }

}

// ============================================================
// RELATIONSHIP TYPE ADAPTER
// ============================================================
//
// Unknown canonical relationship semantics are projected as
// ASSOCIATED_WITH for compatibility with the existing manifold
// graph contract.
//
// The original canonical relationship type is preserved in the
// edge rationale.
//
// ============================================================

function adaptRelationshipType(
  type: string,
): GraphRelationshipType {

  if (
    SUPPORTED_RELATIONSHIP_TYPES.has(
      type as GraphRelationshipType,
    )
  ) {

    return type as GraphRelationshipType;

  }

  return "ASSOCIATED_WITH";

}

// ============================================================
// WEIGHT
// ============================================================

function normalizeWeight(
  confidence: number,
): number {

  if (
    Number.isNaN(
      confidence,
    )
  ) {

    return 0;

  }

  return Math.max(
    0,
    Math.min(
      1,
      confidence,
    ),
  );

}

// ============================================================
// NODE ADAPTER
// ============================================================

function adaptNode(
  node: KnowledgeTopologyNode,
): GraphNode {

  const projectedType =
    adaptNodeType(
      node,
    );

  return {

    id:
      node.id,

    label:
      node.label,

    type:
      projectedType,

    iconType:
      adaptIconType(
        node,
        projectedType,
      ),

    metadata: {

      ...node.metadata,

      // ------------------------------------------------------
      // CANONICAL SEMANTICS
      // ------------------------------------------------------

      canonicalKnowledgeType:
        node.type,

      knowledgeSourceType:
        node.sourceType,

      knowledgeConfidence:
        node.confidence,

      // ------------------------------------------------------
      // COMPATIBILITY PROJECTION
      // ------------------------------------------------------
      //
      // Diagnostic provenance for migration inspection.
      //
      // This does not alter canonical Knowledge.
      //
      // ------------------------------------------------------

      manifoldProjectionType:
        projectedType,

    },

  };

}

// ============================================================
// EDGE ADAPTER
// ============================================================

function adaptEdge(
  edge: KnowledgeTopologyEdge,
): GraphEdge {

  const relationship =
    adaptRelationshipType(
      edge.relationshipType,
    );

  return {

    id:
      edge.id,

    source:
      edge.source,

    target:
      edge.target,

    relationship,

    weight:
      normalizeWeight(
        edge.confidence,
      ),

    metrics: {

      confidence:
        normalizeWeight(
          edge.confidence,
        ),

    },

    rationale: [

      `Canonical relationship: ${edge.relationshipType}`,

    ],

  };

}

// ============================================================
// STATISTICS
// ============================================================

function buildStatistics(
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphStatistics {

  return {

    nodeCount:
      nodes.length,

    edgeCount:
      edges.length,

    eventCount:
      nodes.filter(
        node =>
          node.type === "EVENT",
      ).length,

    facilityCount:
      nodes.filter(
        node =>
          node.type === "FACILITY",
      ).length,

    artifactCount:
      nodes.filter(
        node =>
          node.type === "ARTIFACT",
      ).length,

    personCount:
      nodes.filter(
        node =>
          node.type === "PERSON",
      ).length,

    organizationCount:
      nodes.filter(
        node =>
          node.type === "ORGANIZATION",
      ).length,

    locationCount:
      nodes.filter(
        node =>
          node.type === "LOCATION",
      ).length,

    narrativeCount:
      nodes.filter(
        node =>
          node.type === "NARRATIVE",
      ).length,

    hypothesisCount:
      nodes.filter(
        node =>
          node.type === "HYPOTHESIS",
      ).length,

  };

}

// ============================================================
// ADAPT KNOWLEDGE TOPOLOGY
// ============================================================
//
// Converts canonical G₀ into the existing manifold graph
// representation.
//
// This function does not assign coordinates.
//
// Spatial projection remains owned by the Manifold Layout
// Engine.
//
// ============================================================

export function adaptKnowledgeTopology(
  topology: KnowledgeTopology,
  centerNodeId?: string,
): InvestigationGraph {

  const nodes =
    topology.nodes.map(
      adaptNode,
    );

  const edges =
    topology.edges.map(
      adaptEdge,
    );

  // ----------------------------------------------------------
  // CENTER VALIDATION
  // ----------------------------------------------------------
  //
  // Do not expose a center node that does not exist in the
  // projected topology.
  //
  // ----------------------------------------------------------

  const validCenterNodeId =
    centerNodeId !== undefined &&
    nodes.some(
      node =>
        node.id === centerNodeId,
    )
      ? centerNodeId
      : undefined;

  return {

    nodes,

    edges,

    statistics:
      buildStatistics(
        nodes,
        edges,
      ),

    centerNodeId:
      validCenterNodeId,

  };

}

// ============================================================
// END
// ============================================================