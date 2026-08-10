// ============================================================
// src/knowledge/topology/KnowledgeTopologySemanticComparator.ts
// P56A
// KNOWLEDGE TOPOLOGY SEMANTIC MIGRATION COMPARATOR
//
// Migration-aware deterministic comparison between:
//
//     Legacy InvestigationGraph
//              ⇅
//     Knowledge-derived InvestigationGraph
//
// The physical graph identifiers intentionally differ:
//
//     E-TICTAC-2004
//          ≡
//     system:event:E-TICTAC-2004
//
//     facility:USS Princeton
//          ≡
//     system:entity:uss-princeton
//
// This comparator therefore compares canonicalized semantic
// identities rather than requiring physical identifier equality.
//
// Purpose:
//
// • Separate namespace migration from topology differences
// • Identify semantically shared nodes
// • Identify semantically shared edges
// • Identify legacy-only computed topology
// • Identify knowledge-only explicit topology
//
// Diagnostic only.
//
// No React.
// No runtime access.
// No Corpus access.
// No mutation.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {
  GraphEdge,
  GraphNode,
  InvestigationGraph,
} from "../../manifold/graphTypes";

// ============================================================
// SEMANTIC NODE
// ============================================================

export interface SemanticNodeMatch {

  semanticId: string;

  legacy:
    GraphNode;

  knowledge:
    GraphNode;

  legacyId:
    string;

  knowledgeId:
    string;

  typeEquivalent:
    boolean;

  labelEquivalent:
    boolean;

}

// ============================================================
// SEMANTIC EDGE
// ============================================================

export interface SemanticEdgeMatch {

  semanticId: string;

  legacy:
    GraphEdge;

  knowledge:
    GraphEdge;

  legacyId:
    string;

  knowledgeId:
    string;

  relationshipEquivalent:
    boolean;

  weightEquivalent:
    boolean;

}

// ============================================================
// SUMMARY
// ============================================================

export interface SemanticTopologyComparisonSummary {

  semanticallyEquivalent: boolean;

  legacyNodeCount: number;

  knowledgeNodeCount: number;

  sharedSemanticNodeCount: number;

  legacyOnlyNodeCount: number;

  knowledgeOnlyNodeCount: number;

  nodeSemanticDifferenceCount: number;

  legacyEdgeCount: number;

  knowledgeEdgeCount: number;

  sharedSemanticEdgeCount: number;

  legacyOnlyEdgeCount: number;

  knowledgeOnlyEdgeCount: number;

  edgeSemanticDifferenceCount: number;

}

// ============================================================
// RESULT
// ============================================================

export interface SemanticTopologyComparison {

  summary:
    SemanticTopologyComparisonSummary;

  sharedNodes:
    SemanticNodeMatch[];

  legacyOnlyNodes:
    GraphNode[];

  knowledgeOnlyNodes:
    GraphNode[];

  nodeDifferences:
    SemanticNodeMatch[];

  sharedEdges:
    SemanticEdgeMatch[];

  legacyOnlyEdges:
    GraphEdge[];

  knowledgeOnlyEdges:
    GraphEdge[];

  edgeDifferences:
    SemanticEdgeMatch[];

}

// ============================================================
// TEXT NORMALIZATION
// ============================================================

function normalizeText(
  value: string,
): string {

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );

}

// ============================================================
// EVENT ID NORMALIZATION
// ============================================================

function normalizeEventId(
  id: string,
): string {

  const prefix =
    "system:event:";

  if (
    id
      .toLowerCase()
      .startsWith(prefix)
  ) {

    return normalizeText(
      id.slice(
        prefix.length,
      ),
    );

  }

  return normalizeText(
    id,
  );

}

// ============================================================
// LEGACY FACILITY ID NORMALIZATION
// ============================================================

function normalizeFacilityId(
  id: string,
): string {

  const prefix =
    "facility:";

  if (
    id
      .toLowerCase()
      .startsWith(prefix)
  ) {

    return normalizeText(
      id.slice(
        prefix.length,
      ),
    );

  }

  return normalizeText(
    id,
  );

}

// ============================================================
// KNOWLEDGE ENTITY ID NORMALIZATION
// ============================================================

function normalizeKnowledgeEntityId(
  id: string,
): string {

  const prefix =
    "system:entity:";

  if (
    id
      .toLowerCase()
      .startsWith(prefix)
  ) {

    return normalizeText(
      id.slice(
        prefix.length,
      ),
    );

  }

  return normalizeText(
    id,
  );

}

// ============================================================
// NODE SEMANTIC KIND
// ============================================================
//
// Legacy FACILITY nodes correspond to canonical Knowledge
// ENTITY nodes during this migration.
//
// This is deliberately a migration rule.
//
// It does NOT redefine the canonical Knowledge type system.
//
// ============================================================

function semanticNodeKind(
  node: GraphNode,
): string {

  switch (
    node.type
  ) {

    case "FACILITY":

      return "ENTITY";

    default:

      return node.type;

  }

}

// ============================================================
// NODE SEMANTIC ID
// ============================================================
//
// IMPORTANT:
//
// Namespace identity must be resolved before compatibility-
// projected manifold type.
//
// A canonical Knowledge ENTITY may be projected by the
// KnowledgeTopologyAdapter as FACILITY for compatibility with
// the legacy manifold vocabulary while retaining its canonical
// physical identifier:
//
//     system:entity:uss-princeton
//
// The legacy equivalent is:
//
//     facility:USS Princeton
//
// Therefore:
//
//     facility:USS Princeton
//          ≡
//     system:entity:uss-princeton
//
// Both must reduce deterministically to:
//
//     ENTITY:uss-princeton
//
// ============================================================

function semanticNodeId(
  node: GraphNode,
): string {

  const kind =
    semanticNodeKind(
      node,
    );

  // ----------------------------------------------------------
  // CANONICAL KNOWLEDGE ENTITY NAMESPACE
  // ----------------------------------------------------------

  if (
    node.id
      .toLowerCase()
      .startsWith(
        "system:entity:",
      )
  ) {

    return [
      "ENTITY",
      normalizeKnowledgeEntityId(
        node.id,
      ),
    ].join(
      ":",
    );

  }

  // ----------------------------------------------------------
  // LEGACY / OTHER MANIFOLD TYPES
  // ----------------------------------------------------------

  switch (
    node.type
  ) {

    case "EVENT":

      return [
        kind,
        normalizeEventId(
          node.id,
        ),
      ].join(
        ":",
      );

    case "FACILITY":

      return [
        kind,
        normalizeFacilityId(
          node.id,
        ),
      ].join(
        ":",
      );

    default:

      return [
        kind,
        normalizeText(
          node.id,
        ),
      ].join(
        ":",
      );

  }

}

// ============================================================
// NODE INDEX
// ============================================================

function indexNodesBySemanticId(
  nodes: GraphNode[],
): Map<
  string,
  GraphNode
> {

  const index =
    new Map<
      string,
      GraphNode
    >();

  for (
    const node of nodes
  ) {

    const id =
      semanticNodeId(
        node,
      );

    if (
      !index.has(
        id,
      )
    ) {

      index.set(
        id,
        node,
      );

    }

  }

  return index;

}

// ============================================================
// NODE TYPE EQUIVALENCE
// ============================================================

function nodeTypesEquivalent(
  legacy: GraphNode,
  knowledge: GraphNode,
): boolean {

  return (
    semanticNodeKind(
      legacy,
    ) ===
    semanticNodeKind(
      knowledge,
    )
  );

}

// ============================================================
// NODE LABEL EQUIVALENCE
// ============================================================

function nodeLabelsEquivalent(
  legacy: GraphNode,
  knowledge: GraphNode,
): boolean {

  return (
    normalizeText(
      legacy.label,
    ) ===
    normalizeText(
      knowledge.label,
    )
  );

}

// ============================================================
// EDGE ENDPOINT SEMANTIC ID
// ============================================================

function semanticEndpointId(
  id: string,
  nodeIndex:
    Map<
      string,
      GraphNode
    >,
): string {

  const node =
    nodeIndex.get(
      id,
    );

  if (
    node
  ) {

    return semanticNodeId(
      node,
    );

  }

  // ----------------------------------------------------------
  // Defensive migration fallback.
  // ----------------------------------------------------------

  return [
    "UNKNOWN",
    normalizeText(
      id,
    ),
  ].join(
    ":",
  );

}

// ============================================================
// EDGE SEMANTIC ID
// ============================================================
//
// Direction is preserved.
//
// Relationship type is included because:
//
//     A -> B OBSERVED_AT
//
// and:
//
//     A -> B LOCATED_AT
//
// are different semantic relationships.
//
// ============================================================

function semanticEdgeId(
  edge: GraphEdge,
  nodeIndex:
    Map<
      string,
      GraphNode
    >,
): string {

  const source =
    semanticEndpointId(
      edge.source,
      nodeIndex,
    );

  const target =
    semanticEndpointId(
      edge.target,
      nodeIndex,
    );

  return [
    source,
    edge.relationship,
    target,
  ].join(
    "::",
  );

}

// ============================================================
// EDGE INDEX
// ============================================================

function indexEdgesBySemanticId(
  edges: GraphEdge[],
  nodeIndex:
    Map<
      string,
      GraphNode
    >,
): Map<
  string,
  GraphEdge
> {

  const index =
    new Map<
      string,
      GraphEdge
    >();

  for (
    const edge of edges
  ) {

    const id =
      semanticEdgeId(
        edge,
        nodeIndex,
      );

    if (
      !index.has(
        id,
      )
    ) {

      index.set(
        id,
        edge,
      );

    }

  }

  return index;

}

// ============================================================
// WEIGHT EQUIVALENCE
// ============================================================
//
// Weight equivalence remains diagnostic.
//
// It is intentionally NOT used to determine semantic topology
// equivalence.
//
// Legacy topology uses weight as a graph/rendering strength,
// commonly 1 for an explicit relationship.
//
// Canonical Knowledge topology uses weight to preserve
// epistemic confidence.
//
// Therefore:
//
//     legacy OBSERVED_AT weight = 1
//
// and:
//
//     Knowledge OBSERVED_AT weight = 0.96
//
// may describe the same semantic relationship.
//
// ============================================================

function weightsEquivalent(
  left: number,
  right: number,
): boolean {

  return left === right;

}

// ============================================================
// SORT HELPERS
// ============================================================

function sortNodes(
  nodes: GraphNode[],
): GraphNode[] {

  return [
    ...nodes,
  ].sort(
    (
      left,
      right,
    ) =>
      semanticNodeId(
        left,
      ).localeCompare(
        semanticNodeId(
          right,
        ),
      ),
  );

}

function sortEdges(
  edges: GraphEdge[],
  nodeIndex:
    Map<
      string,
      GraphNode
    >,
): GraphEdge[] {

  return [
    ...edges,
  ].sort(
    (
      left,
      right,
    ) =>
      semanticEdgeId(
        left,
        nodeIndex,
      ).localeCompare(
        semanticEdgeId(
          right,
          nodeIndex,
        ),
      ),
  );

}

// ============================================================
// PUBLIC COMPARATOR
// ============================================================

export function compareInvestigationGraphsSemantically(
  legacyGraph: InvestigationGraph,
  knowledgeGraph: InvestigationGraph,
): SemanticTopologyComparison {

  // ----------------------------------------------------------
  // PHYSICAL NODE INDEXES
  // ----------------------------------------------------------

  const legacyPhysicalNodes =
    new Map<
      string,
      GraphNode
    >(
      legacyGraph.nodes.map(
        node => [
          node.id,
          node,
        ],
      ),
    );

  const knowledgePhysicalNodes =
    new Map<
      string,
      GraphNode
    >(
      knowledgeGraph.nodes.map(
        node => [
          node.id,
          node,
        ],
      ),
    );

  // ----------------------------------------------------------
  // SEMANTIC NODE INDEXES
  // ----------------------------------------------------------

  const legacyNodes =
    indexNodesBySemanticId(
      legacyGraph.nodes,
    );

  const knowledgeNodes =
    indexNodesBySemanticId(
      knowledgeGraph.nodes,
    );

  const sharedNodes:
    SemanticNodeMatch[] = [];

  const legacyOnlyNodes:
    GraphNode[] = [];

  const knowledgeOnlyNodes:
    GraphNode[] = [];

  const nodeDifferences:
    SemanticNodeMatch[] = [];

  // ----------------------------------------------------------
  // COMPARE LEGACY NODES
  // ----------------------------------------------------------

  for (
    const [
      semanticId,
      legacyNode,
    ] of legacyNodes
  ) {

    const knowledgeNode =
      knowledgeNodes.get(
        semanticId,
      );

    if (
      !knowledgeNode
    ) {

      legacyOnlyNodes.push(
        legacyNode,
      );

      continue;

    }

    const match:
      SemanticNodeMatch = {

        semanticId,

        legacy:
          legacyNode,

        knowledge:
          knowledgeNode,

        legacyId:
          legacyNode.id,

        knowledgeId:
          knowledgeNode.id,

        typeEquivalent:
          nodeTypesEquivalent(
            legacyNode,
            knowledgeNode,
          ),

        labelEquivalent:
          nodeLabelsEquivalent(
            legacyNode,
            knowledgeNode,
          ),

      };

    sharedNodes.push(
      match,
    );

    if (
      !match.typeEquivalent ||
      !match.labelEquivalent
    ) {

      nodeDifferences.push(
        match,
      );

    }

  }

  // ----------------------------------------------------------
  // KNOWLEDGE-ONLY NODES
  // ----------------------------------------------------------

  for (
    const [
      semanticId,
      knowledgeNode,
    ] of knowledgeNodes
  ) {

    if (
      !legacyNodes.has(
        semanticId,
      )
    ) {

      knowledgeOnlyNodes.push(
        knowledgeNode,
      );

    }

  }

  // ----------------------------------------------------------
  // SEMANTIC EDGE INDEXES
  // ----------------------------------------------------------

  const legacyEdges =
    indexEdgesBySemanticId(
      legacyGraph.edges,
      legacyPhysicalNodes,
    );

  const knowledgeEdges =
    indexEdgesBySemanticId(
      knowledgeGraph.edges,
      knowledgePhysicalNodes,
    );

  const sharedEdges:
    SemanticEdgeMatch[] = [];

  const legacyOnlyEdges:
    GraphEdge[] = [];

  const knowledgeOnlyEdges:
    GraphEdge[] = [];

  const edgeDifferences:
    SemanticEdgeMatch[] = [];

  // ----------------------------------------------------------
  // COMPARE LEGACY EDGES
  // ----------------------------------------------------------

  for (
    const [
      semanticId,
      legacyEdge,
    ] of legacyEdges
  ) {

    const knowledgeEdge =
      knowledgeEdges.get(
        semanticId,
      );

    if (
      !knowledgeEdge
    ) {

      legacyOnlyEdges.push(
        legacyEdge,
      );

      continue;

    }

    const match:
      SemanticEdgeMatch = {

        semanticId,

        legacy:
          legacyEdge,

        knowledge:
          knowledgeEdge,

        legacyId:
          legacyEdge.id,

        knowledgeId:
          knowledgeEdge.id,

        relationshipEquivalent:
          legacyEdge.relationship ===
          knowledgeEdge.relationship,

        weightEquivalent:
          weightsEquivalent(
            legacyEdge.weight,
            knowledgeEdge.weight,
          ),

      };

    sharedEdges.push(
      match,
    );

    // --------------------------------------------------------
    // SEMANTIC EDGE DIFFERENCE
    // --------------------------------------------------------
    //
    // Semantic edge identity is defined by:
    //
    //     source
    //     relationship
    //     target
    //
    // Edge weight is intentionally NOT part of migration
    // semantic equivalence.
    //
    // The legacy graph uses weight=1 for explicit OBSERVED_AT
    // presence, while canonical Knowledge topology preserves
    // epistemic confidence as edge weight.
    //
    // weightEquivalent remains available on SemanticEdgeMatch
    // as diagnostic migration evidence.
    //
    // --------------------------------------------------------

    if (
      !match.relationshipEquivalent
    ) {

      edgeDifferences.push(
        match,
      );

    }

  }

  // ----------------------------------------------------------
  // KNOWLEDGE-ONLY EDGES
  // ----------------------------------------------------------

  for (
    const [
      semanticId,
      knowledgeEdge,
    ] of knowledgeEdges
  ) {

    if (
      !legacyEdges.has(
        semanticId,
      )
    ) {

      knowledgeOnlyEdges.push(
        knowledgeEdge,
      );

    }

  }

  // ----------------------------------------------------------
  // CANONICAL OUTPUT ORDER
  // ----------------------------------------------------------

  sharedNodes.sort(
    (
      left,
      right,
    ) =>
      left.semanticId.localeCompare(
        right.semanticId,
      ),
  );

  nodeDifferences.sort(
    (
      left,
      right,
    ) =>
      left.semanticId.localeCompare(
        right.semanticId,
      ),
  );

  sharedEdges.sort(
    (
      left,
      right,
    ) =>
      left.semanticId.localeCompare(
        right.semanticId,
      ),
  );

  edgeDifferences.sort(
    (
      left,
      right,
    ) =>
      left.semanticId.localeCompare(
        right.semanticId,
      ),
  );

  const sortedLegacyOnlyNodes =
    sortNodes(
      legacyOnlyNodes,
    );

  const sortedKnowledgeOnlyNodes =
    sortNodes(
      knowledgeOnlyNodes,
    );

  const sortedLegacyOnlyEdges =
    sortEdges(
      legacyOnlyEdges,
      legacyPhysicalNodes,
    );

  const sortedKnowledgeOnlyEdges =
    sortEdges(
      knowledgeOnlyEdges,
      knowledgePhysicalNodes,
    );

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const semanticallyEquivalent =
    sortedLegacyOnlyNodes.length === 0 &&
    sortedKnowledgeOnlyNodes.length === 0 &&
    nodeDifferences.length === 0 &&
    sortedLegacyOnlyEdges.length === 0 &&
    sortedKnowledgeOnlyEdges.length === 0 &&
    edgeDifferences.length === 0;

  const summary:
    SemanticTopologyComparisonSummary = {

      semanticallyEquivalent,

      legacyNodeCount:
        legacyGraph.nodes.length,

      knowledgeNodeCount:
        knowledgeGraph.nodes.length,

      sharedSemanticNodeCount:
        sharedNodes.length,

      legacyOnlyNodeCount:
        sortedLegacyOnlyNodes.length,

      knowledgeOnlyNodeCount:
        sortedKnowledgeOnlyNodes.length,

      nodeSemanticDifferenceCount:
        nodeDifferences.length,

      legacyEdgeCount:
        legacyGraph.edges.length,

      knowledgeEdgeCount:
        knowledgeGraph.edges.length,

      sharedSemanticEdgeCount:
        sharedEdges.length,

      legacyOnlyEdgeCount:
        sortedLegacyOnlyEdges.length,

      knowledgeOnlyEdgeCount:
        sortedKnowledgeOnlyEdges.length,

      edgeSemanticDifferenceCount:
        edgeDifferences.length,

    };

  return {

    summary,

    sharedNodes,

    legacyOnlyNodes:
      sortedLegacyOnlyNodes,

    knowledgeOnlyNodes:
      sortedKnowledgeOnlyNodes,

    nodeDifferences,

    sharedEdges,

    legacyOnlyEdges:
      sortedLegacyOnlyEdges,

    knowledgeOnlyEdges:
      sortedKnowledgeOnlyEdges,

    edgeDifferences,

  };

}

// ============================================================
// END
// ============================================================