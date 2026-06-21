// ============================================================
// src/graph/corpusGraphAdapter.ts
// P25.0 INVESTIGATION GRAPH FOUNDATION
// CORPUS → GRAPH ADAPTER
// FULL DROP-IN FILE
// ============================================================

import type {
CorpusEvent,
} from "../corpus/corpusTypes";

import type {
InvestigationGraph,
GraphNode,
GraphEdge,
} from "./graphTypes";

// ============================================================
// CORPUS → GRAPH
// ============================================================

export function buildInvestigationGraph(
corpus: CorpusEvent[]
): InvestigationGraph {

const nodes: GraphNode[] = [];

const edges: GraphEdge[] = [];

// ==========================================================
// NODES
// ==========================================================

for (const event of corpus) {


const primaryResolution =
  event.resolutions[0];

nodes.push({

  id:
    event.corpus_id,

  label:
    event.canonical_event
      .event_name,

  sourceType:
    primaryResolution
      ?.source_type ??
    "UNKNOWN",

  confidence:
    primaryResolution
      ?.confidence,

  metadata: {

    eventId:
      event.canonical_event
        .event_id,

    createdAt:
      event.created_at,

    updatedAt:
      event.updated_at,
  },
});


}

// ==========================================================
// EDGES
// ==========================================================

const edgeRegistry =
new Set<string>();

for (const event of corpus) {


const sourceId =
  event.corpus_id;

const resolutions =
  event.similarity_resolutions ??
  [];

for (
  const resolution
  of resolutions
) {

  const targetId =
    resolution.target_event_id;

  // ------------------------------------------------------
  // Prevent duplicate A↔B edges
  // ------------------------------------------------------

  const edgeKey =
    [sourceId, targetId]
      .sort()
      .join("::");

  if (
    edgeRegistry.has(
      edgeKey
    )
  ) {
    continue;
  }

  edgeRegistry.add(
    edgeKey
  );

  const edge: GraphEdge = {

    id: edgeKey,

    source:
      sourceId,

    target:
      targetId,

    weight:
      resolution.confidence,

    relationshipType:
      "SIMILARITY",

    metadata: {

      confidence:
        resolution.confidence,

      narrative:
        resolution
          .narrative_similarity,

      observability:
        resolution
          .observability_similarity,

      infrastructure:
        resolution
          .infrastructure_similarity,

      topology:
        resolution
          .topology_similarity,

      geo:
        resolution
          .geo_similarity,

      rationale:
        resolution.rationale,
    },
  };

  edges.push(
    edge
  );
}


}

// ==========================================================
// RESULT
// ==========================================================

return {


nodes,

edges,


};
}
