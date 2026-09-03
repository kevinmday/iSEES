import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import type { Investigation, InvestigationRevision } from "../../src/investigation/investigationTypes.ts";
import { createRevision } from "../../src/investigation/engine/revisionEngine.ts";
import {
  buildCanonicalOperationalGraph,
  createOperationalGraphFingerprint,
  materializeInitialOperationalRevision,
  prepareNextOperationalRevision,
  reconcileOperationalGraphRevision,
  resolveCurrentOperationalRevision,
  validateOperationalRevisionInvestigation,
} from "../../src/investigation/revision/OperationalGraphRevision.ts";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function investigation(): Investigation {
  return {
    id: "INV-OPERATIONAL-VERIFY",
    name: "Operational verification",
    description: "",
    createdAt: "2004-11-14T00:00:00Z",
    updatedAt: "2004-11-14T00:00:00Z",
    createdBy: "SYSTEM_CANON",
    status: "ACTIVE",
    workspace: {
      id: "WS-OPERATIONAL-VERIFY",
      name: "",
      description: "",
      imported_events: [{ event_id: "E-TICTAC-2004", source: "SYSTEM_CANON" }],
      focused_event_id: "E-TICTAC-2004",
      investigations: [],
      artifacts: [],
      active_layers: [],
      created_at: "2004-11-14T00:00:00Z",
    },
    currentRevisionId: undefined,
    revisions: [],
  };
}

function frozenVariant(base: Investigation, revisions: InvestigationRevision[], currentRevisionId = base.currentRevisionId): Investigation {
  return deepFreeze({ ...base, currentRevisionId, revisions });
}

const knowledge = adaptSystemCanonToKnowledge(CANONICAL_EVENTS);
const sourceInvestigation = investigation();
const investigationBefore = JSON.stringify(sourceInvestigation);
const knowledgeBefore = JSON.stringify(knowledge);
const graph = buildCanonicalOperationalGraph(knowledge);
assert.equal(graph.nodes.length, 16);
assert.equal(graph.edges.length, 13);
assert.ok(graph.nodes.some(node => node.id === "system:event:E-TICTAC-2004" && node.metadata?.sourceId === "E-TICTAC-2004"));
assert.equal(new Set(graph.nodes.map(node => node.id)).size, 16);
assert.equal(new Set(graph.edges.map(edge => edge.id)).size, 13);

const initial = materializeInitialOperationalRevision(sourceInvestigation, knowledge);
assert.equal(initial.revisions.length, 1);
assert.equal(initial.currentRevisionId, "REV-0001");
assert.equal(initial.revisions[0]!.revisionNumber, 1);
assert.equal(resolveCurrentOperationalRevision(initial), initial.revisions[0]);
assert.equal(createOperationalGraphFingerprint(initial.revisions[0]!.manifold.graph), createOperationalGraphFingerprint(graph));
assert.deepEqual(materializeInitialOperationalRevision(investigation(), [...knowledge].reverse()), initial);
assert.equal(reconcileOperationalGraphRevision(initial, [...knowledge].reverse()), initial);
assert.equal(JSON.stringify(sourceInvestigation), investigationBefore);
assert.equal(JSON.stringify(knowledge), knowledgeBefore);
const mutableManifold = JSON.parse(JSON.stringify(initial.revisions[0]!.manifold));
const directlyCreated = createRevision(sourceInvestigation, mutableManifold, "verify", "clone before freeze");
assert.equal(Object.isFrozen(directlyCreated.manifold.graph), true);
assert.equal(Object.isFrozen(mutableManifold), false);
assert.equal(Object.isFrozen(mutableManifold.graph), false);

const current = resolveCurrentOperationalRevision(initial);
for (const value of [initial, initial.revisions, current, current.manifold, current.manifold.activeLayers, current.manifold.graph, current.manifold.graph.nodes, current.manifold.graph.edges, current.manifold.graph.statistics, ...current.manifold.graph.nodes, ...current.manifold.graph.edges]) {
  assert.equal(Object.isFrozen(value), true);
}
for (const node of current.manifold.graph.nodes) if (node.metadata) assert.equal(Object.isFrozen(node.metadata), true);
for (const edge of current.manifold.graph.edges) {
  assert.equal(Object.isFrozen(edge.rationale), true);
  if (edge.metrics) assert.equal(Object.isFrozen(edge.metrics), true);
}
assert.throws(() => current.manifold.graph.nodes.push(current.manifold.graph.nodes[0]!));

assert.throws(() => validateOperationalRevisionInvestigation({ ...initial, currentRevisionId: undefined }));
assert.throws(() => validateOperationalRevisionInvestigation({ ...initial, currentRevisionId: "REV-UNKNOWN" }));
const second = prepareNextOperationalRevision(initial, knowledge.map((object, index) => index === 0 ? { ...object, metadata: { ...object.metadata, description: `${object.metadata.description} changed` } } : object), { recordedAt: "2004-11-15T00:00:00Z" });
assert.ok(second);
assert.equal(second!.revisionNumber, 2);
assert.equal(second!.parentRevisionId, "REV-0001");
assert.equal(initial.revisions.length, 1);

const duplicateId = deepFreeze({ ...second!, id: "REV-0001", manifold: { ...second!.manifold, id: `operational:${encodeURIComponent(initial.id)}:REV-0001` } });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [current, duplicateId], "REV-0001")));
const duplicateNumber = deepFreeze({ ...second!, revisionNumber: 1 });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [current, duplicateNumber], second!.id)));
const zeroNumber = deepFreeze({ ...current, revisionNumber: 0 });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [zeroNumber], zeroNumber.id)));
const skippedNumber = deepFreeze({ ...second!, revisionNumber: 3 });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [current, skippedNumber], skippedNumber.id)));
const brokenParent = deepFreeze({ ...second!, parentRevisionId: "REV-UNKNOWN" });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [current, brokenParent], brokenParent.id)));
const wrongOwner = deepFreeze({ ...current, manifold: { ...current.manifold, id: "operational:INV-OTHER:REV-0001" } });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [wrongOwner], wrongOwner.id)));

const duplicateNodeGraph = deepFreeze({ ...current.manifold.graph, nodes: [...current.manifold.graph.nodes, current.manifold.graph.nodes[0]] });
const duplicateNodeRevision = deepFreeze({ ...current, manifold: { ...current.manifold, graph: duplicateNodeGraph } });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [duplicateNodeRevision], duplicateNodeRevision.id)));
const duplicateEdgeGraph = deepFreeze({ ...current.manifold.graph, edges: [...current.manifold.graph.edges, current.manifold.graph.edges[0]] });
const duplicateEdgeRevision = deepFreeze({ ...current, manifold: { ...current.manifold, graph: duplicateEdgeGraph } });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [duplicateEdgeRevision], duplicateEdgeRevision.id)));
const missingEndpointGraph = deepFreeze({ ...current.manifold.graph, nodes: current.manifold.graph.nodes.slice(1) });
const missingEndpointRevision = deepFreeze({ ...current, manifold: { ...current.manifold, graph: missingEndpointGraph } });
assert.throws(() => validateOperationalRevisionInvestigation(frozenVariant(initial, [missingEndpointRevision], missingEndpointRevision.id)));

assert.equal(prepareNextOperationalRevision(initial, knowledge), undefined);
const changedKnowledge = knowledge.map((object, index) => index === 0 ? { ...object, metadata: { ...object.metadata, description: `${object.metadata.description} changed` } } : object);
const changed = reconcileOperationalGraphRevision(initial, changedKnowledge, { recordedAt: "2004-11-15T00:00:00Z" });
assert.equal(changed.revisions.length, 2);
assert.equal(changed.currentRevisionId, "REV-0002");
assert.deepEqual(initial.revisions, [current]);

const presentationGraph = deepFreeze({
  ...current.manifold.graph,
  centerNodeId: current.manifold.graph.nodes[0]!.id,
  selectedNodeId: current.manifold.graph.nodes[0]!.id,
  nodes: current.manifold.graph.nodes.map((node, index) => deepFreeze({ ...node, x: index, y: index })),
});
assert.equal(createOperationalGraphFingerprint(presentationGraph), createOperationalGraphFingerprint(current.manifold.graph));
assert.equal(prepareNextOperationalRevision(initial, knowledge, { activeLayers: ["TEMPORAL"] }), undefined);

const serviceSource = readFileSync("src/investigation/revision/OperationalGraphRevision.ts", "utf8");
assert.doesNotMatch(serviceSource, /randomUUID|Math\.random|Date\.now|new Date/);
assert.doesNotMatch(serviceSource, /node\.label\s*===|title\s*===|prose|temporal/);
assert.match(serviceSource, /buildCanonicalInvestigationGraph/);

console.log("PASS VerifyOperationalGraphRevision — deterministic REV-0001 materialization, immutable canonical graph, validation, reconciliation, and next-revision preparation verified");
