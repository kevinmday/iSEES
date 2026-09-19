import { readFileSync } from "node:fs";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts";
import { buildCanonicalInvestigationGraph } from "../../src/intelligence/selection/CanonicalInvestigationGraph.ts";
import { resolveCanonicalSelectionIntelligence } from "../../src/intelligence/selection/CanonicalSelectionIntelligence.ts";
import { formatMetricAvailability, resolveSelectionIntelligence } from "../../src/manifold/selection/selectionIntelligenceResolver.ts";
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

const noneIntelligence = resolveCanonicalSelectionIntelligence({ graph, selection: noneSelection });
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

const nodeIntelligence = resolveCanonicalSelectionIntelligence({ graph, selection: nodeSelection });
assert(nodeIntelligence.kind === "NODE", "Context-free canonical NODE must preserve established resolution.");
assert(nodeIntelligence.binding === undefined, "Omitted context must not suppress NODE intelligence or fabricate a binding.");
assert(nodeIntelligence.intelligence.nodeId === firstNode.id, "Resolved node identity must equal the selected node.");
assert(nodeIntelligence.intelligence.title === firstNode.label, "Resolved node title must equal the graph label.");
const expectedConnectionCount = graph.edges.filter(edge => edge.source === firstNode.id || edge.target === firstNode.id).length;
assert(nodeIntelligence.intelligence.connectionCount === expectedConnectionCount, "Node connections must derive from topology.");
console.log("PASS 3 — context-free NODE preserves identity, label, and topology-derived connections");

const edgeIntelligence = resolveCanonicalSelectionIntelligence({ graph, selection: edgeSelection });
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

const missingNode = resolveCanonicalSelectionIntelligence({ graph, selection: missingNodeSelection });
assert(missingNode.kind === "NONE", "Missing canonical node must safely resolve NONE.");
assert(missingNode.availability.status === "UNAVAILABLE" && missingNode.availability.reason === "SELECTION_NOT_FOUND", "Missing node must not be available.");
console.log("PASS 5 — missing NODE safely resolves truthful unavailable NONE");

const missingEdge = resolveCanonicalSelectionIntelligence({ graph, selection: missingEdgeSelection });
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

const repeatedNode = resolveCanonicalSelectionIntelligence({ graph, selection: nodeSelection });
const repeatedEdge = resolveCanonicalSelectionIntelligence({ graph, selection: edgeSelection });
assert(serialize(nodeIntelligence) === serialize(repeatedNode), "Repeated NODE resolution must be byte-equivalent.");
assert(serialize(edgeIntelligence) === serialize(repeatedEdge), "Repeated EDGE resolution must be byte-equivalent.");
console.log("PASS 7 — repeated context-free NODE and EDGE resolution is deterministic");

const reversedKnowledgeObjects = [...knowledgeObjects].reverse();
const reversedGraph = buildCanonicalInvestigationGraph(reversedKnowledgeObjects);
const reversedNode = resolveCanonicalSelectionIntelligence({ graph: reversedGraph, selection: nodeSelection });
const reversedEdge = resolveCanonicalSelectionIntelligence({ graph: reversedGraph, selection: edgeSelection });
assert(serialize(graph) === serialize(reversedGraph), "Equivalent reordered Knowledge must produce the same graph.");
assert(serialize(nodeIntelligence) === serialize(reversedNode), "Knowledge order must not change NODE intelligence.");
assert(serialize(edgeIntelligence) === serialize(reversedEdge), "Knowledge order must not change EDGE intelligence.");
console.log("PASS 8 — Knowledge order does not change graph, NODE intelligence, or EDGE intelligence");

assert(serialize(originalKnowledgeOrder) === serialize(knowledgeObjects.map(object => object.identity.id)), "Resolution must not reorder Knowledge.");
assert(serialize(knowledgeObjects) === originalKnowledge, "Resolution must not mutate Knowledge.");
assert(serialize(graph) === originalGraph, "Resolution must not mutate the graph.");
console.log("PASS 9 — canonical Knowledge ordering, Knowledge data, and graph remain unmodified");

const context = { investigationId: "INV-SELECTION-VERIFY", manifoldRevisionId: "REV-IMMUTABLE-0001" } as const;
const resolveBoundNode = () => resolveCanonicalSelectionIntelligence({ graph, selection: nodeSelection, ...context });
const resolveBoundEdge = () => resolveCanonicalSelectionIntelligence({ graph, selection: edgeSelection, ...context });
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
  graph,
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
assert(formatMetricAvailability(metricResult.metricAvailability.geo) === "NOT COMPUTED", "Unavailable metric must project as NOT COMPUTED.");
assert(formatMetricAvailability(metricResult.metricAvailability.geo) !== "0.0%", "Unavailable metric must never format as zero.");
assert(formatMetricAvailability(metricResult.metricAvailability.confidence) === "0.0%", "Genuine available zero must remain 0.0%.");
assert(formatMetricAvailability({ status: "AVAILABLE", value: 0.96 }) === "96.0%", "Available nonzero metric must remain correctly formatted.");
assert(formatMetricAvailability({ status: "UNAVAILABLE", reason: "NOT_SUPPLIED" }) !== "NaN%", "Unavailable metric must never format as NaN%.");
assert(serialize(metricGraph) === metricGraphBefore, "Metric graph must remain immutable.");
console.log("PASS 11 — unavailable metrics and genuine numeric zero remain truthfully distinguishable and compatible");

const revisionGraph: InvestigationGraph = {
  nodes: [
    { id: "revision-node", label: "Revision Label", type: "EVENT", metadata: { source: "REVISION", confidence: 0.73, marker: "revision" } },
    { id: "revision-target", label: "Revision Target", type: "LOCATION" },
    { id: "revision-extra", label: "Revision Extra", type: "ARTIFACT" },
  ],
  edges: [
    { id: "revision-edge", source: "revision-target", target: "revision-node", relationship: "SUPPORTS", weight: 0.61, metrics: { confidence: 0.91, narrative: 0.81, observability: 0.71, infrastructure: 0.51, topology: 0.41, geo: 0.31 }, rationale: ["revision rationale"] },
    { id: "revision-incident", source: "revision-node", target: "revision-extra", relationship: "REFERENCES", weight: 0.2, rationale: [] },
  ],
  statistics: { nodeCount: 3, edgeCount: 2, eventCount: 1, facilityCount: 0, artifactCount: 1, personCount: 0, organizationCount: 0, locationCount: 1, narrativeCount: 0, hypothesisCount: 0 },
};
const knowledgeGraph: InvestigationGraph = {
  nodes: [
    { id: "revision-node", label: "Knowledge Label", type: "EVENT", metadata: { source: "KNOWLEDGE", confidence: 0.1, marker: "knowledge" } },
    { id: "knowledge-target", label: "Knowledge Target", type: "PERSON" },
    { id: "knowledge-only-node", label: "Knowledge Only", type: "NARRATIVE" },
  ],
  edges: [
    { id: "revision-edge", source: "revision-node", target: "knowledge-target", relationship: "CONTRADICTS", weight: 0.12, metrics: { confidence: 0.11, narrative: 0.21 }, rationale: ["knowledge rationale"] },
    { id: "knowledge-only-edge", source: "revision-node", target: "knowledge-only-node", relationship: "ASSOCIATED_WITH", weight: 0.3, rationale: [] },
  ],
  statistics: { nodeCount: 3, edgeCount: 2, eventCount: 1, facilityCount: 0, artifactCount: 0, personCount: 1, organizationCount: 0, locationCount: 0, narrativeCount: 1, hypothesisCount: 0 },
};
const olderRevisionGraph: InvestigationGraph = {
  ...revisionGraph,
  nodes: [...revisionGraph.nodes, { id: "older-only-node", label: "Older Only", type: "HYPOTHESIS" }],
  edges: [...revisionGraph.edges, { id: "older-only-edge", source: "revision-node", target: "older-only-node", relationship: "INVESTIGATES", weight: 0.4, rationale: [] }],
};
const revisionBefore = serialize(revisionGraph);
const knowledgeGraphBefore = serialize(knowledgeGraph);
const revisionNodeSelection = { kind: "NODE" as const, nodeId: "revision-node" };
const revisionEdgeSelection = { kind: "EDGE" as const, edgeId: "revision-edge" };
const revisionNode = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection: revisionNodeSelection, ...context });
const revisionEdge = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection: revisionEdgeSelection, ...context });
const revisionWeightEdge = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection: { kind: "EDGE", edgeId: "revision-incident" }, ...context });
assert(revisionNode.kind === "NODE" && revisionNode.intelligence.title === "Revision Label" && revisionNode.intelligence.metadata?.marker === "revision", "Supplied revision node label and metadata must win over divergent Knowledge.");
assert(revisionNode.kind === "NODE" && revisionNode.intelligence.connectionCount === 2, "Supplied revision incident edges must determine connection count.");
assert(revisionEdge.kind === "EDGE" && revisionEdge.intelligence.sourceId === "revision-target" && revisionEdge.intelligence.targetId === "revision-node", "Supplied revision edge endpoints must win.");
assert(revisionEdge.kind === "EDGE" && revisionEdge.intelligence.relationship === "SUPPORTS", "Supplied revision edge relationship must win.");
assert(revisionEdge.kind === "EDGE" && revisionEdge.intelligence.rationale[0] === "revision rationale" && revisionEdge.intelligence.confidence === 0.91 && revisionEdge.intelligence.narrative === 0.81 && revisionEdge.intelligence.geo === 0.31, "Supplied revision rationale, weight-derived contract, and metrics must win.");
assert(revisionWeightEdge.kind === "EDGE" && revisionWeightEdge.intelligence.confidence === 0.2, "Supplied revision edge weight must win when no confidence metric is present.");
for (const selection of [
  { kind: "NODE" as const, nodeId: "knowledge-only-node" },
  { kind: "EDGE" as const, edgeId: "knowledge-only-edge" },
  { kind: "NODE" as const, nodeId: "older-only-node" },
  { kind: "EDGE" as const, edgeId: "older-only-edge" },
]) {
  const unavailable = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection, ...context });
  assert(unavailable.kind === "NONE" && unavailable.availability.status === "UNAVAILABLE", `${selection.kind} outside the supplied current revision must fail closed.`);
}
const sameRevisionAfterKnowledgeChange = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection: revisionEdgeSelection, ...context });
assert(serialize(sameRevisionAfterKnowledgeChange) === serialize(revisionEdge), "Changing broader Knowledge while preserving the revision graph must not change intelligence.");
const knowledgeProjection = resolveCanonicalSelectionIntelligence({ graph: knowledgeGraph, selection: revisionEdgeSelection, ...context });
assert(knowledgeProjection.kind === "EDGE" && revisionEdge.kind === "EDGE" && knowledgeProjection.binding?.projectionFingerprint !== revisionEdge.binding?.projectionFingerprint, "Changing the supplied revision graph must change applicable intelligence and its fingerprint.");
const revisionIdentityChanged = resolveCanonicalSelectionIntelligence({ graph: revisionGraph, selection: revisionEdgeSelection, investigationId: context.investigationId, manifoldRevisionId: "REV-DIVERGENT-2" });
assert(revisionIdentityChanged.kind === "EDGE" && revisionEdge.kind === "EDGE" && revisionIdentityChanged.binding?.projectionFingerprint !== revisionEdge.binding?.projectionFingerprint, "Fingerprint must derive from supplied revision graph projection and revision identity.");
assert(serialize(revisionGraph) === revisionBefore && serialize(knowledgeGraph) === knowledgeGraphBefore && olderRevisionGraph.nodes.length === 4, "Divergent graph inputs must remain immutable.");
console.log("PASS 12 — supplied immutable revision graph exclusively owns NODE, EDGE, availability, and fingerprints");

const familyNodes: InvestigationGraph["nodes"] = [
  { id: "candidate-evidence", label: "Candidate Evidence", type: "ARTIFACT", iconType: "DOCUMENT", metadata: { canonicalKnowledgeType: "EVIDENCE", sourceId: "source:candidate", knowledgeSourceType: "RESEARCHER_SUPPLIED", sourceRevision: 3, revision: 7, lineage: { adapter: "fixture/v1" }, knowledgeClassification: "CANDIDATE_KNOWLEDGE", epistemicStatus: "UNVERIFIED", reviewStatus: "RESEARCHER_REVIEW_REQUIRED", canonEffect: "NONE" } },
  { id: "isolated-person", label: "Isolated Person", type: "PERSON" },
  ...Array.from({ length: 10 }, (_, index) => ({ id: `neighbor-${String(index).padStart(2, "0")}`, label: `Neighbor ${index}`, type: index % 2 === 0 ? "EVENT" as const : "LOCATION" as const })),
];
const familyEdges: InvestigationGraph["edges"] = Array.from({ length: 10 }, (_, index) => ({
  id: `edge-${String(9 - index).padStart(2, "0")}`,
  source: index % 2 === 0 ? "candidate-evidence" : `neighbor-${String(index).padStart(2, "0")}`,
  target: index % 2 === 0 ? `neighbor-${String(index).padStart(2, "0")}` : "candidate-evidence",
  relationship: index % 2 === 0 ? "SUPPORTS" as const : "REFERENCES" as const,
  weight: index === 0 ? 0 : index / 10,
  metrics: index === 0 ? { confidence: 0 } : undefined,
  rationale: index === 0 ? ["zeta", "alpha", "alpha"] : [],
}));
const familyGraph: InvestigationGraph = {
  nodes: familyNodes,
  edges: familyEdges,
  statistics: { nodeCount: familyNodes.length, edgeCount: familyEdges.length, eventCount: 5, facilityCount: 0, artifactCount: 1, personCount: 1, organizationCount: 0, locationCount: 5, narrativeCount: 0, hypothesisCount: 0 },
};
const familyBefore = serialize(familyGraph);
const candidateNode = resolveSelectionIntelligence({ kind: "NODE", nodeId: "candidate-evidence", nodeType: "ARTIFACT" }, familyGraph, context);
const isolatedPerson = resolveSelectionIntelligence({ kind: "NODE", nodeId: "isolated-person", nodeType: "PERSON" }, familyGraph, context);
assert(candidateNode.kind === "NODE" && isolatedPerson.kind === "NODE", "Representative ARTIFACT and PERSON families must resolve.");
if (candidateNode.kind !== "NODE" || isolatedPerson.kind !== "NODE") throw new Error("unreachable");
const entity = candidateNode.intelligence.entitySpecific;
assert(entity.identity.id === "candidate-evidence" && entity.identity.label === "Candidate Evidence", "NODE entity identity must be explicit.");
assert(entity.classification.projectedType === "ARTIFACT" && entity.classification.canonicalType.status === "AVAILABLE" && entity.classification.canonicalType.value === "EVIDENCE", "Projected and canonical entity classifications must remain distinct.");
assert(entity.investigationRole === "HUB" && isolatedPerson.intelligence.entitySpecific.investigationRole === "ISOLATED", "Investigation role must derive only from supplied topology.");
assert(entity.provenance.sourceId.status === "AVAILABLE" && entity.provenance.sourceRevision.status === "AVAILABLE" && entity.provenance.lineage.status === "AVAILABLE", "Actually supplied NODE provenance and lineage must remain available.");
assert(isolatedPerson.intelligence.entitySpecific.provenance.sourceId.status === "UNAVAILABLE" && isolatedPerson.intelligence.entitySpecific.evidence.knowledgeClassification.status === "UNAVAILABLE", "Absent provenance and evidence must remain explicitly unavailable.");
assert(entity.evidence.candidateEvidenceBoundary === "NON_CANONICAL_REVIEW_ONLY", "Graph-identified Candidate Evidence must remain non-canonical and review-only.");
assert(entity.relationships.totalCount === 10 && entity.relationships.returnedCount === 8 && entity.relationships.truncated, "NODE relationship summaries must be bounded at eight while preserving totals.");
assert(entity.relationships.incomingCount === 5 && entity.relationships.outgoingCount === 5, "NODE relationship direction counts must derive from supplied edges.");
assert(serialize(entity.relationships.items.map(item => item.edgeId)) === serialize([...entity.relationships.items.map(item => item.edgeId)].sort()), "Bounded relationships must use deterministic canonical ordering.");
assert(Object.isFrozen(entity) && Object.isFrozen(entity.relationships) && Object.isFrozen(entity.relationships.items), "Entity-specific NODE projections must be immutable.");
console.log("PASS 13 — representative NODE families expose immutable identity, classification, role, truthful provenance/evidence, and bounded deterministic relationships");

const projectedEdge = resolveSelectionIntelligence({ kind: "EDGE", edgeId: "edge-09", sourceId: "candidate-evidence", targetId: "neighbor-00" }, familyGraph, context);
assert(projectedEdge.kind === "EDGE", "Representative entity-specific EDGE must resolve.");
if (projectedEdge.kind !== "EDGE") throw new Error("unreachable");
const edgeEntity = projectedEdge.intelligence.entitySpecific;
assert(edgeEntity.endpoints[0].role === "SOURCE" && edgeEntity.endpoints[0].identity.id === projectedEdge.intelligence.sourceId, "EDGE source endpoint profile must preserve source identity.");
assert(edgeEntity.endpoints[1].role === "TARGET" && edgeEntity.endpoints[1].identity.id === projectedEdge.intelligence.targetId, "EDGE target endpoint profile must preserve target identity.");
assert(edgeEntity.direction.kind === "DIRECTED" && edgeEntity.direction.sourceId === "candidate-evidence" && edgeEntity.direction.targetId === "neighbor-00", "EDGE direction must be explicit and topology-owned.");
assert(edgeEntity.semantics.relationship === "SUPPORTS", "EDGE relationship semantics must be explicit.");
assert(edgeEntity.weight.status === "AVAILABLE" && edgeEntity.weight.value === 0, "A supplied zero edge weight must remain an available zero.");
assert(projectedEdge.metricAvailability.confidence.status === "AVAILABLE" && projectedEdge.metricAvailability.confidence.value === 0, "A supplied zero metric must remain available.");
assert(projectedEdge.metricAvailability.geo.status === "UNAVAILABLE", "An absent metric must remain unavailable rather than becoming zero.");
assert(edgeEntity.provenance.sourceId.status === "UNAVAILABLE" && edgeEntity.evidence.knowledgeClassification.status === "UNAVAILABLE", "EDGE provenance/evidence absent from the supplied graph must remain unavailable.");
assert(serialize(edgeEntity.rationale) === serialize(["alpha", "zeta"]), "EDGE rationale must be deduplicated and deterministically ordered.");
assert(Object.isFrozen(edgeEntity) && Object.isFrozen(edgeEntity.endpoints) && Object.isFrozen(edgeEntity.rationale), "Entity-specific EDGE projections must be immutable.");
assert(serialize(familyGraph) === familyBefore, "Entity-specific projection must not mutate its graph fixture.");
const reorderedFamilyGraph: InvestigationGraph = { ...familyGraph, nodes: [...familyGraph.nodes].reverse(), edges: [...familyGraph.edges].reverse() };
const reorderedCandidate = resolveSelectionIntelligence({ kind: "NODE", nodeId: "candidate-evidence", nodeType: "ARTIFACT" }, reorderedFamilyGraph, context);
assert(reorderedCandidate.kind === "NODE" && serialize(reorderedCandidate.intelligence.entitySpecific.relationships) === serialize(entity.relationships), "Graph array order must not change the deterministic relationship summary.");
assert(reorderedCandidate.kind === "NODE" && reorderedCandidate.binding?.projectionFingerprint === candidateNode.binding?.projectionFingerprint, "Equivalent reordered graph input must preserve the projection fingerprint.");
const missingEndpointGraph: InvestigationGraph = { ...familyGraph, nodes: familyGraph.nodes.filter(node => node.id !== "neighbor-00") };
const missingEndpoint = resolveSelectionIntelligence({ kind: "EDGE", edgeId: "edge-09", sourceId: "candidate-evidence", targetId: "neighbor-00" }, missingEndpointGraph, context);
assert(missingEndpoint.kind === "NONE" && missingEndpoint.availability.status === "UNAVAILABLE", "EDGE projection must fail closed when either endpoint is absent.");
console.log("PASS 14 — EDGE profiles preserve endpoint integrity, direction, semantics, zero/unavailable distinctions, deterministic rationale, fingerprint stability, and input immutability");

const princeton = graph.nodes.find(node => node.id === "system:entity:uss-princeton");
assert(princeton !== undefined, "USS Princeton governed NODE must exist.");
const princetonProjection = resolveCanonicalSelectionIntelligence({ graph, selection: { kind: "NODE", nodeId: princeton.id }, ...context });
assert(princetonProjection.kind === "NODE" && princetonProjection.intelligence.entitySpecific.governedDossier.availability === "AVAILABLE", "Only the coherent selected governed NODE must expose its dossier projection.");
if (princetonProjection.kind !== "NODE" || princetonProjection.intelligence.entitySpecific.governedDossier.availability !== "AVAILABLE") throw new Error("unreachable");
assert(princetonProjection.intelligence.entitySpecific.governedDossier.binding.nodeId === princeton.id, "Governed dossier binding must pin selected node identity.");
assert(princetonProjection.intelligence.entitySpecific.governedDossier.dossierRevisionId === "dossier-revision:system:entity:uss-princeton:2" && princetonProjection.intelligence.entitySpecific.governedDossier.operationalProfile.profileId === "NAVAL_VESSEL", "Governed NODE must expose exact revision 2 NAVAL_VESSEL profile.");
assert(candidateNode.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE" && isolatedPerson.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE", "Non-dossier NODE behavior must remain unchanged and explicitly unavailable.");
assert(projectedEdge.kind === "EDGE" && !("governedDossier" in projectedEdge.intelligence.entitySpecific), "EDGE intelligence must not gain a governed dossier projection.");
console.log("PASS 15 — coherent governed NODE exclusively exposes exact dossier projection while other selection families remain unchanged");

const implementationSource = `${readFileSync("src/manifold/selection/selectionIntelligenceResolver.ts", "utf8")}\n${readFileSync("src/intelligence/selection/CanonicalSelectionIntelligence.ts", "utf8")}`;
for (const capability of ["fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon", "localStorage", "sessionStorage", "indexedDB", "RexApi", "invokeRex", "publishResearch", "setSelection(", "writeFile", "buildKnowledgeBootstrapPopulation"]) {
  assert(!implementationSource.includes(capability), `Projection must have zero side-effect capability: ${capability}`);
}
assert(serialize(knowledgeObjects) === originalKnowledge, "No research mutation may occur.");
assert(serialize(graph) === originalGraph, "No graph mutation may occur.");
console.log("PASS 16 — no REX invocation, publication, graph/research mutation, persistence, or network effects");
console.log("\n============================================================");
console.log("CANONICAL SELECTION INTELLIGENCE VERIFIED");
console.log("============================================================");
