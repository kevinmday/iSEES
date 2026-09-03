import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject";
import { buildCanonicalInvestigationGraph } from "../../intelligence/selection/CanonicalInvestigationGraph";
import type { GraphEdge, GraphNode, InvestigationGraph } from "../../manifold/graphTypes";
import { commitRevision, createRevision } from "../engine/revisionEngine";
import type { Investigation, InvestigationRevision, ManifoldLayer, ManifoldRevision } from "../investigationTypes";

export const OPERATIONAL_GRAPH_ALGORITHM_VERSION = "KNOWLEDGE_TOPOLOGY_V1";

export interface OperationalRevisionOptions {
  readonly recordedAt?: string;
  readonly algorithmVersion?: string;
  readonly activeLayers?: readonly ManifoldLayer[];
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cloneCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneCanonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => lexical(left, right))
        .map(([key, child]) => [key, cloneCanonicalValue(child)]),
    );
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function canonicalNode(node: GraphNode): GraphNode {
  const metadata = node.metadata === undefined ? undefined : cloneCanonicalValue(node.metadata) as Record<string, unknown>;
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    ...(node.iconType === undefined ? {} : { iconType: node.iconType }),
    ...(metadata === undefined ? {} : { metadata }),
  };
}

function canonicalEdge(edge: GraphEdge): GraphEdge {
  const copy = cloneCanonicalValue(edge) as GraphEdge;
  return {
    id: copy.id,
    source: copy.source,
    target: copy.target,
    relationship: copy.relationship,
    weight: copy.weight,
    ...(copy.metrics === undefined ? {} : { metrics: copy.metrics }),
    rationale: [...copy.rationale],
  };
}

export function buildCanonicalOperationalGraph(
  knowledgeObjects: readonly KnowledgeObject[],
): InvestigationGraph {
  const projected = buildCanonicalInvestigationGraph([...knowledgeObjects]);
  const nodes = projected.nodes.map(canonicalNode).sort((left, right) => lexical(left.id, right.id));
  const edges = projected.edges.map(canonicalEdge).sort((left, right) => lexical(left.id, right.id));
  const statistics = cloneCanonicalValue(projected.statistics) as InvestigationGraph["statistics"];
  return deepFreeze({ nodes, edges, statistics });
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => lexical(left, right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

export function createOperationalGraphFingerprint(graph: InvestigationGraph): string {
  const canonical = {
    nodes: [...graph.nodes].sort((left, right) => lexical(left.id, right.id)).map(node => stableValue(canonicalNode(node))),
    edges: [...graph.edges].sort((left, right) => lexical(left.id, right.id)).map(edge => stableValue(canonicalEdge(edge))),
  };
  return JSON.stringify(canonical);
}

function expectedManifoldId(investigationId: string, revisionId: string): string {
  return `operational:${encodeURIComponent(investigationId)}:${revisionId}`;
}

function requireIdentity(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} must not be blank.`);
}

function requireFrozenGraph(graph: InvestigationGraph): void {
  function isDeepFrozen(value: unknown): boolean {
    if (value === null || typeof value !== "object") return true;
    return Object.isFrozen(value) && Object.values(value as Record<string, unknown>).every(isDeepFrozen);
  }
  if (!isDeepFrozen(graph)) {
    throw new Error("Operational graph collections must be immutable.");
  }
}

function validateGraph(graph: InvestigationGraph): void {
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new Error("Operational graph collections are malformed.");
  const nodeIds = new Set<string>();
  for (const node of graph.nodes) {
    requireIdentity(node.id, "NODE identity");
    if (nodeIds.has(node.id)) throw new Error(`Duplicate NODE identity: ${node.id}`);
    nodeIds.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    requireIdentity(edge.id, "EDGE identity");
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate EDGE identity: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) throw new Error(`EDGE ${edge.id} references a missing NODE endpoint.`);
  }
  requireFrozenGraph(graph);
}

export function resolveCurrentOperationalRevision(investigation: Investigation): InvestigationRevision {
  validateOperationalRevisionInvestigation(investigation);
  return investigation.revisions.find(revision => revision.id === investigation.currentRevisionId)!;
}

export function validateOperationalRevisionInvestigation(investigation: Investigation): void {
  requireIdentity(investigation.id, "Investigation identity");
  if (investigation.revisions.length === 0) throw new Error("Operational Investigation requires a revision history.");
  if (!investigation.currentRevisionId?.trim()) throw new Error("Operational Investigation requires currentRevisionId.");
  if (!Object.isFrozen(investigation.revisions)) throw new Error("Operational revision history must be immutable.");
  const ids = new Set<string>();
  const numbers = new Set<number>();
  investigation.revisions.forEach((revision, index) => {
    requireIdentity(revision.id, "Revision identity");
    if (ids.has(revision.id)) throw new Error(`Duplicate revision identity: ${revision.id}`);
    if (!Number.isSafeInteger(revision.revisionNumber) || revision.revisionNumber <= 0) throw new Error("Revision numbers must be positive safe integers.");
    if (numbers.has(revision.revisionNumber)) throw new Error(`Duplicate revision number: ${revision.revisionNumber}`);
    if (revision.revisionNumber !== index + 1) throw new Error("Revision numbers must be monotonic and contiguous.");
    if (index === 0 ? revision.parentRevisionId !== undefined : revision.parentRevisionId !== investigation.revisions[index - 1]!.id) throw new Error("Operational revision parent lineage is broken.");
    if (revision.manifold.id !== expectedManifoldId(investigation.id, revision.id)) throw new Error("Operational revision belongs to a different Investigation.");
    if (!Object.isFrozen(revision) || !Object.isFrozen(revision.manifold) || !Object.isFrozen(revision.manifold.activeLayers)) throw new Error("Operational revisions must be immutable.");
    validateGraph(revision.manifold.graph);
    ids.add(revision.id);
    numbers.add(revision.revisionNumber);
  });
  const matches = investigation.revisions.filter(revision => revision.id === investigation.currentRevisionId);
  if (matches.length !== 1) throw new Error(`currentRevisionId resolved ${matches.length} times.`);
  if (matches[0] !== investigation.revisions[investigation.revisions.length - 1]) throw new Error("Current revision must be the latest revision.");
}

function revisionOptions(investigation: Investigation, revisionId: string, graph: InvestigationGraph, options: OperationalRevisionOptions): ManifoldRevision {
  const recordedAt = options.recordedAt ?? investigation.updatedAt;
  requireIdentity(recordedAt, "Operational revision timestamp");
  const algorithmVersion = options.algorithmVersion ?? OPERATIONAL_GRAPH_ALGORITHM_VERSION;
  requireIdentity(algorithmVersion, "Operational graph algorithm version");
  return deepFreeze({
    id: expectedManifoldId(investigation.id, revisionId),
    timestamp: recordedAt,
    algorithmVersion,
    activeLayers: [...(options.activeLayers ?? [])],
    graph,
  });
}

export function materializeInitialOperationalRevision(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
  options: OperationalRevisionOptions = {},
): Investigation {
  if (investigation.revisions.length !== 0 || investigation.currentRevisionId !== undefined) {
    throw new Error("Initial materialization requires a legitimately revisionless Investigation.");
  }
  const graph = buildCanonicalOperationalGraph(knowledgeObjects);
  const revisionId = "REV-0001";
  const revision = createRevision(investigation, revisionOptions(investigation, revisionId, graph, options), "SYSTEM", "Initial canonical operational graph");
  const result = commitRevision(investigation, revision);
  const immutable = { ...result, revisions: Object.freeze([...result.revisions]) as InvestigationRevision[] };
  validateOperationalRevisionInvestigation(immutable);
  return Object.freeze(immutable);
}

export function prepareNextOperationalRevision(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
  options: OperationalRevisionOptions = {},
): InvestigationRevision | undefined {
  const current = resolveCurrentOperationalRevision(investigation);
  const graph = buildCanonicalOperationalGraph(knowledgeObjects);
  if (createOperationalGraphFingerprint(current.manifold.graph) === createOperationalGraphFingerprint(graph)) return undefined;
  const nextNumber = current.revisionNumber + 1;
  const revisionId = `REV-${nextNumber.toString().padStart(4, "0")}`;
  return createRevision(investigation, revisionOptions(investigation, revisionId, graph, options), "SYSTEM", "Canonical operational graph changed");
}

export function reconcileOperationalGraphRevision(
  investigation: Investigation,
  knowledgeObjects: readonly KnowledgeObject[],
  options: OperationalRevisionOptions = {},
): Investigation {
  validateOperationalRevisionInvestigation(investigation);
  const revision = prepareNextOperationalRevision(investigation, knowledgeObjects, options);
  if (!revision) return investigation;
  const result = commitRevision(investigation, revision);
  const immutable = { ...result, revisions: Object.freeze([...result.revisions]) as InvestigationRevision[] };
  validateOperationalRevisionInvestigation(immutable);
  return Object.freeze(immutable);
}
