import { readFileSync } from "node:fs";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts";
import { buildCanonicalInvestigationGraph } from "../../src/intelligence/selection/CanonicalInvestigationGraph.ts";
import { resolveCanonicalSelectionIntelligence } from "../../src/intelligence/selection/CanonicalSelectionIntelligence.ts";
import { resolveSelectionIntelligence } from "../../src/manifold/selection/selectionIntelligenceResolver.ts";
import type { InvestigationGraph } from "../../src/manifold/graphTypes.ts";
import type { WorkspaceSelection } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`VERIFY FAILED: ${message}`);
}
const serialize = (value: unknown): string => JSON.stringify(value);

const knowledgeObjects = buildKnowledgeBootstrapPopulation();
const originalKnowledge = serialize(knowledgeObjects);
const originalKnowledgeOrder = knowledgeObjects.map(object => object.identity.id);
const graph = buildCanonicalInvestigationGraph(knowledgeObjects);
const originalGraph = serialize(graph);
const firstNode = graph.nodes[0];
const firstEdge = graph.edges[0];
assert(firstNode !== undefined, "Canonical graph must contain at least one node.");
assert(firstEdge !== undefined, "Canonical graph must contain at least one edge.");

assert(graph.nodes.length === 16, "Canonical graph must contain exactly 16 System Canon nodes.");
assert(graph.edges.length === 13, "Canonical graph must contain exactly 13 System Canon edges.");
console.log("PASS 1 — real System Canon Knowledge produces the live 16-node, 13-edge graph");

const noneSelection: WorkspaceSelection = { kind: "NONE" };
const nodeSelection: WorkspaceSelection = { kind: "NODE", nodeId: firstNode.id };
const edgeSelection: WorkspaceSelection = { kind: "EDGE", edgeId: firstEdge.id };
const missingNodeSelection: WorkspaceSelection = { kind: "NODE", nodeId: "missing:canonical:node" };
const missingEdgeSelection: WorkspaceSelection = { kind: "EDGE", edgeId: "missing:canonical:edge" };

const noneIntelligence = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: noneSelection });
assert(noneIntelligence.kind === "NONE", "NONE selection must resolve NONE intelligence.");
assert(noneIntelligence.availability.status === "AVAILABLE", "Intentional NONE must remain available NONE.");
console.log("PASS 2 — NONE selection remains NONE");

const contextFreeCluster = resolveSelectionIntelligence(
  { kind: "CLUSTER", clusterId: "cluster:compatibility" },
  graph,
);
assert(contextFreeCluster.kind === "CLUSTER", "Context-free CLUSTER must preserve established resolution.");
assert(contextFreeCluster.clusterId === "cluster:compatibility", "Context-free CLUSTER identity must be preserved.");
assert(contextFreeCluster.binding === undefined, "Omitted context must not fabricate a CLUSTER binding.");

const nodeIntelligence = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: nodeSelection });
assert(nodeIntelligence.kind === "NODE", "Context-free canonical NODE must preserve established resolution.");
assert(nodeIntelligence.binding === undefined, "Omitted context must not suppress NODE intelligence or fabricate a binding.");
assert(nodeIntelligence.intelligence.nodeId === firstNode.id, "Resolved node identity must equal the selected node.");
assert(nodeIntelligence.intelligence.title === firstNode.label, "Resolved node title must equal the graph label.");
const expectedConnectionCount = graph.edges.filter(edge => edge.source === firstNode.id || edge.target === firstNode.id).length;
assert(nodeIntelligence.intelligence.connectionCount === expectedConnectionCount, "Node connections must derive from topology.");
console.log("PASS 3 — context-free NODE preserves identity, label, and topology-derived connections");

const edgeIntelligence = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: edgeSelection });
assert(edgeIntelligence.kind === "EDGE", "Context-free canonical EDGE must preserve established resolution.");
assert(edgeIntelligence.binding === undefined, "Omitted context must not suppress EDGE intelligence or fabricate a binding.");
assert(edgeIntelligence.intelligence.edgeId === firstEdge.id, "Resolved edge identity must equal the selected edge.");
assert(edgeIntelligence.intelligence.sourceId === firstEdge.source, "Resolved edge source must equal canonical topology.");
assert(edgeIntelligence.intelligence.targetId === firstEdge.target, "Resolved edge target must equal canonical topology.");
assert(edgeIntelligence.intelligence.relationship === firstEdge.relationship, "Resolved relationship must equal canonical topology.");
for (const field of ["confidence", "narrative", "observability", "infrastructure", "topology", "geo"] as const) {
  assert(typeof edgeIntelligence.intelligence[field] === "number", `Established edge field ${field} must remain numeric.`);
}
console.log("PASS 4 — context-free EDGE preserves identity, endpoints, relationship, and numeric metrics");

const missingNode = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: missingNodeSelection });
assert(missingNode.kind === "NONE", "Missing canonical node must safely resolve NONE.");
assert(missingNode.availability.status === "UNAVAILABLE" && missingNode.availability.reason === "SELECTION_NOT_FOUND", "Missing node must not be available.");
console.log("PASS 5 — missing NODE safely resolves truthful unavailable NONE");

const missingEdge = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: missingEdgeSelection });
assert(missingEdge.kind === "NONE", "Missing canonical edge must safely resolve NONE.");
assert(missingEdge.availability.status === "UNAVAILABLE" && missingEdge.availability.reason === "SELECTION_NOT_FOUND", "Missing edge must not be available.");
console.log("PASS 6 — missing EDGE safely resolves truthful unavailable NONE");

const directMissingNode = resolveSelectionIntelligence(
  { kind: "NODE", nodeId: "missing:direct:node", nodeType: "EVENT" },
  graph,
  { investigationId: "INV-MISSING", manifoldRevisionId: "REV-MISSING" },
);
const directMissingEdge = resolveSelectionIntelligence(
  { kind: "EDGE", edgeId: "missing:direct:edge", sourceId: "missing:source", targetId: "missing:target" },
  graph,
  { investigationId: "INV-MISSING", manifoldRevisionId: "REV-MISSING" },
);
assert(directMissingNode.kind === "NONE" && directMissingNode.availability.status === "UNAVAILABLE" && directMissingNode.availability.reason === "SELECTION_NOT_FOUND", "Direct missing NODE must remain truthfully unavailable.");
assert(directMissingEdge.kind === "NONE" && directMissingEdge.availability.status === "UNAVAILABLE" && directMissingEdge.availability.reason === "SELECTION_NOT_FOUND", "Direct missing EDGE must remain truthfully unavailable.");

const repeatedNode = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: nodeSelection });
const repeatedEdge = resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: edgeSelection });
assert(serialize(nodeIntelligence) === serialize(repeatedNode), "Repeated NODE resolution must be byte-equivalent.");
assert(serialize(edgeIntelligence) === serialize(repeatedEdge), "Repeated EDGE resolution must be byte-equivalent.");
console.log("PASS 7 — repeated context-free NODE and EDGE resolution is deterministic");

const reversedKnowledgeObjects = [...knowledgeObjects].reverse();
const reversedGraph = buildCanonicalInvestigationGraph(reversedKnowledgeObjects);
const reversedNode = resolveCanonicalSelectionIntelligence({ knowledgeObjects: reversedKnowledgeObjects, selection: nodeSelection });
const reversedEdge = resolveCanonicalSelectionIntelligence({ knowledgeObjects: reversedKnowledgeObjects, selection: edgeSelection });
assert(serialize(graph) === serialize(reversedGraph), "Equivalent reordered Knowledge must produce the same graph.");
assert(serialize(nodeIntelligence) === serialize(reversedNode), "Knowledge order must not change NODE intelligence.");
assert(serialize(edgeIntelligence) === serialize(reversedEdge), "Knowledge order must not change EDGE intelligence.");
console.log("PASS 8 — Knowledge order does not change graph, NODE intelligence, or EDGE intelligence");

assert(serialize(originalKnowledgeOrder) === serialize(knowledgeObjects.map(object => object.identity.id)), "Resolution must not reorder Knowledge.");
assert(serialize(knowledgeObjects) === originalKnowledge, "Resolution must not mutate Knowledge.");
assert(serialize(graph) === originalGraph, "Resolution must not mutate the graph.");
console.log("PASS 9 — canonical Knowledge ordering, Knowledge data, and graph remain unmodified");

const context = { investigationId: "INV-SELECTION-VERIFY", manifoldRevisionId: "REV-IMMUTABLE-0001" } as const;
const resolveBoundNode = () => resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: nodeSelection, ...context });
const resolveBoundEdge = () => resolveCanonicalSelectionIntelligence({ knowledgeObjects, selection: edgeSelection, ...context });
const boundNode = resolveBoundNode();
const boundEdge = resolveBoundEdge();
assert(boundNode.kind === "NODE", "Context-bound NODE must resolve.");
assert(boundEdge.kind === "EDGE", "Context-bound EDGE must resolve.");
assert(boundNode.binding !== undefined, "Context-bound NODE must expose a binding.");
assert(boundEdge.binding !== undefined, "Context-bound EDGE must expose a binding.");
for (const result of [boundNode, boundEdge] as const) {
  assert(result.binding !== undefined, "Supplied context must create a binding.");
  assert(result.binding.investigationId === context.investigationId, "Investigation identity must be bound.");
  assert(result.binding.manifoldRevisionId === context.manifoldRevisionId, "Manifold revision must be bound.");
  assert(result.binding.selectionKind === result.kind, "Selection kind must be bound.");
  assert(result.binding.targetId === (result.kind === "NODE" ? firstNode.id : firstEdge.id), "Target identity must be bound.");
  assert(/^fnv1a32:[0-9a-f]{8}$/.test(result.binding.projectionFingerprint), "Stable fingerprint must be structured.");
  assert(result.provenance.sourceType === "CANONICAL_INVESTIGATION_GRAPH", "Provenance source must be explicit.");
  assert(result.provenance.sourceIds.length > 0, "Provenance source identities must be explicit.");
  assert(result.provenance.derivation === "DETERMINISTIC_LOCAL_PROJECTION", "Provenance derivation must be explicit.");
  assert(result.intelligenceOrigin === "DETERMINISTICALLY_DERIVED", "Projection must not claim REX origin.");
  assert(result.availability.status === "AVAILABLE", "Resolved intelligence must be explicitly available.");
}
const repeatedBoundNode = resolveBoundNode();
const repeatedBoundEdge = resolveBoundEdge();
assert(serialize(boundNode) === serialize(repeatedBoundNode), "Repeated bound NODE must be deterministic.");
assert(serialize(boundEdge) === serialize(repeatedBoundEdge), "Repeated bound EDGE must be deterministic.");
assert(repeatedBoundNode.kind === "NODE" && repeatedBoundNode.binding?.projectionFingerprint === boundNode.binding.projectionFingerprint, "NODE fingerprint must be stable.");
assert(repeatedBoundEdge.kind === "EDGE" && repeatedBoundEdge.binding?.projectionFingerprint === boundEdge.binding.projectionFingerprint, "EDGE fingerprint must be stable.");
const reboundNode = resolveCanonicalSelectionIntelligence({
  knowledgeObjects,
  selection: nodeSelection,
  investigationId: context.investigationId,
  manifoldRevisionId: "REV-IMMUTABLE-0002",
});
assert(reboundNode.kind === "NODE" && reboundNode.binding !== undefined, "Revised context-bound NODE must resolve.");
assert(reboundNode.binding.projectionFingerprint !== boundNode.binding.projectionFingerprint, "Manifold revision changes must change the projection fingerprint.");
console.log("PASS 10 — I1C binding, fingerprint, provenance, origin, availability, and repetition are deterministic");

const metricGraph: InvestigationGraph = {
  nodes: [{ id: "source", label: "Source", type: "EVENT" }, { id: "target", label: "Target", type: "LOCATION" }],
  edges: [{ id: "edge-zero", source: "source", target: "target", relationship: "ASSOCIATED_WITH", weight: 0, metrics: { confidence: 0, narrative: 0 }, rationale: [] }],
  statistics: { nodeCount: 2, edgeCount: 1, eventCount: 1, facilityCount: 0, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 1, narrativeCount: 0, hypothesisCount: 0 },
};
const metricGraphBefore = serialize(metricGraph);
const metricResult = resolveSelectionIntelligence({ kind: "EDGE", edgeId: "edge-zero", sourceId: "source", targetId: "target" }, metricGraph, context);
assert(metricResult.kind === "EDGE", "Metric fixture edge must resolve.");
assert(metricResult.intelligence.confidence === 0 && metricResult.intelligence.narrative === 0, "Genuine numeric zero must be preserved.");
assert(metricResult.intelligence.geo === 0, "Unavailable geo must retain its legacy numeric zero default.");
assert(metricResult.metricAvailability.confidence.status === "AVAILABLE" && metricResult.metricAvailability.confidence.value === 0, "Genuine confidence zero must be available.");
assert(metricResult.metricAvailability.narrative.status === "AVAILABLE" && metricResult.metricAvailability.narrative.value === 0, "Genuine narrative zero must be available.");
assert(metricResult.metricAvailability.geo.status === "UNAVAILABLE", "Defaulted geo zero must be distinguished as unavailable.");
assert(serialize(metricGraph) === metricGraphBefore, "Metric graph must remain immutable.");
console.log("PASS 11 — unavailable metrics and genuine numeric zero remain truthfully distinguishable and compatible");

const implementationSource = `${readFileSync("src/manifold/selection/selectionIntelligenceResolver.ts", "utf8")}\n${readFileSync("src/intelligence/selection/CanonicalSelectionIntelligence.ts", "utf8")}`;
for (const capability of ["fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon", "localStorage", "sessionStorage", "indexedDB", "RexApi", "invokeRex", "publishResearch", "setSelection(", "writeFile", "buildKnowledgeBootstrapPopulation"]) {
  assert(!implementationSource.includes(capability), `Projection must have zero side-effect capability: ${capability}`);
}
assert(serialize(knowledgeObjects) === originalKnowledge, "No research mutation may occur.");
assert(serialize(graph) === originalGraph, "No graph mutation may occur.");
console.log("PASS 12 — no REX invocation, publication, graph/research mutation, persistence, or network effects");
console.log("\n============================================================");
console.log("CANONICAL SELECTION INTELLIGENCE VERIFIED");
console.log("============================================================");
