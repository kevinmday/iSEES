// ============================================================
// src/investigationGraph/buildGraph.ts
// P25.0
// INVESTIGATION GRAPH BUILDER
// DETERMINISTIC GRAPH CONSTRUCTION
// CORPUS -> RESOLUTION -> GRAPH
// ============================================================

import type {
  InvestigationGraph,
  InvestigationNode,
  InvestigationEdge,
} from "./investigationGraphTypes";

import type {
  CorpusEvent,
} from "../corpus/corpusTypes";

import type {
  SimilarityResolution,
} from "../corpus/resolution/resolutionTypes";

// ============================================================
// NODE BUILDERS
// ============================================================

function buildEventNode(
  event: CorpusEvent,
): InvestigationNode {
  return {
    id: event.canonical_event.event_id,

    type: "EVENT",

    label:
      event.canonical_event.event_name ??
      event.canonical_event.event_id,

    confidence:
      event.resolutions?.[0]?.confidence,

    source_id:
      event.resolutions?.[0]?.source_id,

    metadata: {
      corpus_id: event.corpus_id,
      created_at: event.created_at,
      updated_at: event.updated_at,
    },
  };
}

// ============================================================
// EDGE BUILDERS
// ============================================================

function buildResolutionEdges(
  sourceEvent: CorpusEvent,
): InvestigationEdge[] {
  const sourceId =
    sourceEvent.canonical_event.event_id;

  const resolutions =
    sourceEvent.similarity_resolutions ?? [];

  return resolutions.map(
    (
      resolution: SimilarityResolution,
      index: number,
    ): InvestigationEdge => ({
      id: `${sourceId}-${resolution.target_event_id}-${index}`,

      source: sourceId,

      target: resolution.target_event_id,

      relationship_type: "NARRATIVE",

      confidence: resolution.confidence,

      rationale: resolution.rationale ?? [],

      metadata: {
        narrative_similarity:
          resolution.narrative_similarity,

        observability_similarity:
          resolution.observability_similarity,

        infrastructure_similarity:
          resolution.infrastructure_similarity,

        topology_similarity:
          resolution.topology_similarity,

        geo_similarity:
          resolution.geo_similarity,
      },
    }),
  );
}

// ============================================================
// DEDUPLICATION
// ============================================================

function dedupeNodes(
  nodes: InvestigationNode[],
): InvestigationNode[] {
  const map = new Map<string, InvestigationNode>();

  for (const node of nodes) {
    map.set(node.id, node);
  }

  return Array.from(map.values());
}

function dedupeEdges(
  edges: InvestigationEdge[],
): InvestigationEdge[] {
  const map = new Map<string, InvestigationEdge>();

  for (const edge of edges) {
    map.set(edge.id, edge);
  }

  return Array.from(map.values());
}

// ============================================================
// GRAPH BUILDER
// ============================================================

export function buildInvestigationGraph(
  corpus: CorpusEvent[],
): InvestigationGraph {
  const nodes: InvestigationNode[] = [];
  const edges: InvestigationEdge[] = [];

  for (const corpusEvent of corpus) {
    nodes.push(
      buildEventNode(corpusEvent),
    );

    edges.push(
      ...buildResolutionEdges(corpusEvent),
    );
  }

  return {
    nodes: dedupeNodes(nodes),
    edges: dedupeEdges(edges),
  };
}

// ============================================================
// DIAGNOSTICS
// ============================================================

export function getGraphStats(
  graph: InvestigationGraph,
) {
  return {
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
  };
}