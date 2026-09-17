import type { GraphSelection, InvestigationGraph } from "../graphTypes";
import type { GraphNodeIntelligence, GraphEdgeIntelligence } from "../../graph/graphInteractionTypes";

export type IntelligenceOrigin =
  | "KNOWN_LOCALLY"
  | "REX_DISCOVERED"
  | "DETERMINISTICALLY_DERIVED"
  | "RESEARCH_VECTOR";

export type IntelligenceAvailability =
  | { readonly status: "AVAILABLE" }
  | { readonly status: "UNAVAILABLE"; readonly reason: "SELECTION_NOT_FOUND" | "INVESTIGATION_CONTEXT_NOT_SUPPLIED" };

export type MetricAvailability =
  | { readonly status: "AVAILABLE"; readonly value: number }
  | { readonly status: "UNAVAILABLE"; readonly reason: "NOT_SUPPLIED" };

export interface SelectionIntelligenceContext {
  readonly investigationId: string;
  readonly manifoldRevisionId: string;
}

export interface SelectionIntelligenceBinding {
  readonly investigationId: string;
  readonly manifoldRevisionId: string;
  readonly selectionKind: "NODE" | "EDGE" | "CLUSTER";
  readonly targetId: string;
  readonly projectionFingerprint: string;
}

export interface SelectionIntelligenceProvenance {
  readonly sourceType: "CANONICAL_INVESTIGATION_GRAPH";
  readonly sourceIds: readonly string[];
  readonly derivation: "DETERMINISTIC_LOCAL_PROJECTION";
}

export interface EdgeMetricAvailability {
  readonly confidence: MetricAvailability;
  readonly narrative: MetricAvailability;
  readonly observability: MetricAvailability;
  readonly infrastructure: MetricAvailability;
  readonly topology: MetricAvailability;
  readonly geo: MetricAvailability;
}

interface AvailableResult {
  readonly availability: { readonly status: "AVAILABLE" };
  readonly binding?: SelectionIntelligenceBinding;
  readonly provenance: SelectionIntelligenceProvenance;
  readonly intelligenceOrigin: IntelligenceOrigin;
}

export type SelectionIntelligence =
  | { readonly kind: "NONE"; readonly availability: IntelligenceAvailability }
  | (AvailableResult & { readonly kind: "NODE"; readonly intelligence: GraphNodeIntelligence })
  | (AvailableResult & {
      readonly kind: "EDGE";
      readonly intelligence: GraphEdgeIntelligence;
      readonly metricAvailability: EdgeMetricAvailability;
    })
  | (AvailableResult & { readonly kind: "CLUSTER"; readonly clusterId: string });

function metric(value: number | undefined): MetricAvailability {
  return value === undefined || !Number.isFinite(value)
    ? { status: "UNAVAILABLE", reason: "NOT_SUPPLIED" }
    : { status: "AVAILABLE", value };
}

export function formatMetricAvailability(
  availability: MetricAvailability,
): string {
  return availability.status === "AVAILABLE"
    ? `${(availability.value * 100).toFixed(1)}%`
    : "NOT COMPUTED";
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(
    key => `${JSON.stringify(key)}:${stableValue(record[key])}`,
  ).join(",")}}`;
}

function fingerprint(value: unknown): string {
  const input = stableValue(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function binding(
  context: SelectionIntelligenceContext | undefined,
  selectionKind: "NODE" | "EDGE" | "CLUSTER",
  targetId: string,
  projection: unknown,
): SelectionIntelligenceBinding | undefined {
  return context === undefined ? undefined : {
    investigationId: context.investigationId,
    manifoldRevisionId: context.manifoldRevisionId,
    selectionKind,
    targetId,
    projectionFingerprint: fingerprint({ context, selectionKind, targetId, projection }),
  };
}

function unavailable(
  reason: "SELECTION_NOT_FOUND" | "INVESTIGATION_CONTEXT_NOT_SUPPLIED",
): SelectionIntelligence {
  return { kind: "NONE", availability: { status: "UNAVAILABLE", reason } };
}

export function resolveSelectionIntelligence(
  selection: GraphSelection,
  graph: InvestigationGraph,
  context?: SelectionIntelligenceContext,
): SelectionIntelligence {
  if (selection.kind === "NONE") {
    return { kind: "NONE", availability: { status: "AVAILABLE" } };
  }

  if (selection.kind === "NODE") {
    const node = graph.nodes.find(candidate => candidate.id === selection.nodeId);
    if (!node) return unavailable("SELECTION_NOT_FOUND");
    const connectionCount = graph.edges.filter(
      edge => edge.source === node.id || edge.target === node.id,
    ).length;
    const sourceType = typeof node.metadata?.source === "string" ? node.metadata.source : node.type;
    const confidenceValue = node.metadata?.confidence;
    const intelligence: GraphNodeIntelligence = {
      nodeId: node.id,
      title: node.label,
      sourceType,
      confidence: typeof confidenceValue === "number" ? confidenceValue : undefined,
      connectionCount,
      metadata: node.metadata,
    };
    const selectionBinding = binding(context, "NODE", node.id, intelligence);
    return {
      kind: "NODE",
      availability: { status: "AVAILABLE" },
      ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
      provenance: {
        sourceType: "CANONICAL_INVESTIGATION_GRAPH",
        sourceIds: [node.id],
        derivation: "DETERMINISTIC_LOCAL_PROJECTION",
      },
      intelligenceOrigin: "DETERMINISTICALLY_DERIVED",
      intelligence,
    };
  }

  if (selection.kind === "EDGE") {
    const edge = graph.edges.find(candidate => candidate.id === selection.edgeId);
    if (!edge) return unavailable("SELECTION_NOT_FOUND");
    const sourceNode = graph.nodes.find(candidate => candidate.id === edge.source);
    const targetNode = graph.nodes.find(candidate => candidate.id === edge.target);
    const confidence = edge.metrics?.confidence ?? edge.weight;
    const metricAvailability: EdgeMetricAvailability = {
      confidence: metric(confidence),
      narrative: metric(edge.metrics?.narrative),
      observability: metric(edge.metrics?.observability),
      infrastructure: metric(edge.metrics?.infrastructure),
      topology: metric(edge.metrics?.topology),
      geo: metric(edge.metrics?.geo),
    };
    const intelligence: GraphEdgeIntelligence = {
      edgeId: edge.id,
      sourceId: edge.source,
      sourceLabel: sourceNode?.label ?? edge.source,
      targetId: edge.target,
      targetLabel: targetNode?.label ?? edge.target,
      relationship: edge.relationship,
      confidence: confidence ?? 0,
      narrative: edge.metrics?.narrative ?? 0,
      observability: edge.metrics?.observability ?? 0,
      infrastructure: edge.metrics?.infrastructure ?? 0,
      topology: edge.metrics?.topology ?? 0,
      geo: edge.metrics?.geo ?? 0,
      rationale: edge.rationale,
    };
    const selectionBinding = binding(context, "EDGE", edge.id, { intelligence, metricAvailability });
    return {
      kind: "EDGE",
      availability: { status: "AVAILABLE" },
      ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
      provenance: {
        sourceType: "CANONICAL_INVESTIGATION_GRAPH",
        sourceIds: [edge.id, edge.source, edge.target],
        derivation: "DETERMINISTIC_LOCAL_PROJECTION",
      },
      intelligenceOrigin: "DETERMINISTICALLY_DERIVED",
      intelligence,
      metricAvailability,
    };
  }

  const selectionBinding = binding(
    context,
    "CLUSTER",
    selection.clusterId,
    { clusterId: selection.clusterId },
  );
  return {
    kind: "CLUSTER",
    availability: { status: "AVAILABLE" },
    ...(selectionBinding === undefined ? {} : { binding: selectionBinding }),
    provenance: {
      sourceType: "CANONICAL_INVESTIGATION_GRAPH",
      sourceIds: [selection.clusterId],
      derivation: "DETERMINISTIC_LOCAL_PROJECTION",
    },
    intelligenceOrigin: "KNOWN_LOCALLY",
    clusterId: selection.clusterId,
  };
}
