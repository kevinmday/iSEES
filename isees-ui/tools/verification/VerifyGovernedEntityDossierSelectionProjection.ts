import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANONICAL_EVENTS } from "../../src/canonical/runtimeCorpus.ts";
import { adaptSystemCanonToKnowledge } from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter.ts";
import { USS_PRINCETON_DOSSIER_REVISION_1, USS_PRINCETON_DOSSIER_REVISION_2 } from "../../src/knowledge/dossier/SystemCanonEntityDossierRegistry.ts";
import { buildCanonicalOperationalGraph, createOperationalGraphFingerprint, materializeInitialOperationalRevision, resolveCurrentOperationalRevision } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import type { InvestigationGraph } from "../../src/manifold/graphTypes.ts";
import { resolveSelectionIntelligence } from "../../src/manifold/selection/selectionIntelligenceResolver.ts";
import type { Investigation } from "../../src/investigation/investigationTypes.ts";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { restoreGuestWorkspaceSessionIntoRuntimes } from "../../src/workspace/persistence/GuestWorkspaceSessionRestorer.ts";
import type { GuestWorkspaceSessionSnapshot } from "../../src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes.ts";
import { resolveCoherentInvestigationSelection } from "../../src/intelligence/selection/InvestigationSelectionCoherence.ts";
import { resolveCanonicalSelectionIntelligence } from "../../src/intelligence/selection/CanonicalSelectionIntelligence.ts";

const graph = buildCanonicalOperationalGraph(adaptSystemCanonToKnowledge(CANONICAL_EVENTS));
const graphBefore = JSON.stringify(graph);
const node = graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!;
const reference = node.metadata?.dossierReference as Record<string, unknown>;
const revision = USS_PRINCETON_DOSSIER_REVISION_2;
assert.deepEqual(Object.keys(reference).sort(), ["effectiveDossierHash", "entityId", "globalDossierRevisionId", "schemaVersion"]);
assert.equal(JSON.stringify(reference).includes("facts"), false);
assert.equal(JSON.stringify(reference).includes("sourceRecords"), false);
assert.equal(JSON.stringify(reference).includes("narrative"), false);
assert.equal(reference.globalDossierRevisionId, revision.dossierRevisionId);
assert.equal(reference.effectiveDossierHash, revision.contentHash);
assert.equal(Object.isFrozen(reference), true);

const graphWith = (dossierReference: unknown | undefined): InvestigationGraph => ({
  ...graph,
  nodes: graph.nodes.map(candidate => candidate.id !== node.id ? candidate : {
    ...candidate,
    metadata: Object.fromEntries(Object.entries(candidate.metadata ?? {}).filter(([key]) => key !== "dossierReference").concat(dossierReference === undefined ? [] : [["dossierReference", dossierReference]])),
  }),
});
const changed = graphWith({ ...reference, effectiveDossierHash: `sha256:${"0".repeat(64)}` });
assert.notEqual(createOperationalGraphFingerprint(changed), createOperationalGraphFingerprint(graph));

const context = { investigationId: "INV-I3B", manifoldRevisionId: "operational:INV-I3B:REV-0001" };
const selection = { kind: "NODE", nodeId: node.id, nodeType: node.type } as const;
const resolved = resolveSelectionIntelligence(selection, graph, context);
assert.equal(resolved.kind, "NODE");
if (resolved.kind !== "NODE") throw new Error("unreachable");
const dossier = resolved.intelligence.entitySpecific.governedDossier;
assert.equal(dossier.availability, "AVAILABLE");
if (dossier.availability !== "AVAILABLE") throw new Error("unreachable");
assert.equal(dossier.dossierRevisionId, revision.dossierRevisionId);
assert.equal(dossier.binding.investigationId, context.investigationId);
assert.equal(dossier.binding.manifoldRevisionId, context.manifoldRevisionId);
assert.equal(dossier.binding.nodeId, node.id);
assert.equal(dossier.binding.entityId, node.id);
assert.equal(dossier.binding.globalDossierRevisionId, revision.dossierRevisionId);

const unavailable = resolveSelectionIntelligence(selection, graphWith(undefined), context);
assert(unavailable.kind === "NODE" && unavailable.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE" && unavailable.intelligence.entitySpecific.governedDossier.reason === "NOT_REFERENCED");
const expectedUnavailable = (candidate: unknown, reason: string) => {
  const result = resolveSelectionIntelligence(selection, graphWith(candidate), context);
  assert(result.kind === "NODE" && result.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE" && result.intelligence.entitySpecific.governedDossier.reason === reason, reason);
};
expectedUnavailable({ ...reference, globalDossierRevisionId: "dossier-revision:unknown" }, "REVISION_NOT_FOUND");
expectedUnavailable({ ...reference, entityId: "system:entity:wrong" }, "ENTITY_MISMATCH");
expectedUnavailable({ ...reference, schemaVersion: "entity-dossier/v0" }, "SCHEMA_MISMATCH");
expectedUnavailable({ ...reference, effectiveDossierHash: `sha256:${"0".repeat(64)}` }, "HASH_MISMATCH");
expectedUnavailable({ ...reference, globalDossierRevisionId: "latest" }, "MALFORMED_REFERENCE");
assert.deepEqual(resolveSelectionIntelligence(selection, graph, context), resolved);
assert.equal(JSON.stringify(graph), graphBefore);

const eventNode = graph.nodes.find(candidate => candidate.id === "system:event:E-TICTAC-2004")!;
const ordinary = resolveSelectionIntelligence({ kind: "NODE", nodeId: eventNode.id, nodeType: eventNode.type }, graph, context);
assert(ordinary.kind === "NODE" && ordinary.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE" && ordinary.intelligence.entitySpecific.governedDossier.reason === "NOT_REFERENCED");
const edge = graph.edges[0]!;
assert.equal(resolveSelectionIntelligence({ kind: "EDGE", edgeId: edge.id, sourceId: edge.source, targetId: edge.target }, graph, context).kind, "EDGE");
assert.equal(resolveSelectionIntelligence({ kind: "CLUSTER", clusterId: "cluster:one" }, graph, context).kind, "CLUSTER");
assert.equal(resolveSelectionIntelligence({ kind: "NONE" }, graph, context).kind, "NONE");

assert.equal(dossier.acceptedFacts.length, 20);
assert.equal(dossier.operationalProfile.profileId, "NAVAL_VESSEL");
assert.equal(dossier.operationalProfile.resolutionBasis, "ENTITY_SPECIFIC");
assert(dossier.acceptedFacts.every(fact => fact.reviewStatus === "ACCEPTED" && fact.canonEffect === "GLOBAL_BASE"));
assert.deepEqual(dossier.unavailableCategories, revision.fieldAvailability);
assert.deepEqual(dossier.sourceLinks, revision.sourceLinks);
assert.deepEqual(dossier.sourceRecords, revision.sourceRecords);
assert.equal(Object.isFrozen(dossier) && Object.isFrozen(dossier.binding) && Object.isFrozen(dossier.acceptedFacts), true);

const implementation = readFileSync("src/manifold/selection/selectionIntelligenceResolver.ts", "utf8");
for (const forbidden of ["fetch(", "XMLHttpRequest", "WebSocket", "Tavily", "WebDiscovery", "invokeRex", "CandidateEvidence", "ResearchBridgeRuntime", "setSelection("]) assert.equal(implementation.includes(forbidden), false, forbidden);

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};
const baseInvestigation: Investigation = {
  id: "INV-I3B1-LIVE",
  name: "Nimitz Tic Tac Encounter",
  description: "",
  createdAt: "2004-11-14T00:00:00.000Z",
  updatedAt: "2004-11-14T00:00:00.000Z",
  createdBy: "SYSTEM_CANON",
  status: "ACTIVE",
  workspace: {
    id: "WS-I3B1-LIVE", name: "Nimitz Tic Tac Encounter", description: "",
    imported_events: [{ event_id: "E-TICTAC-2004", source: "SYSTEM_CANON" }],
    focused_event_id: "E-TICTAC-2004", investigations: [], artifacts: [], active_layers: [], created_at: "2004-11-14T00:00:00.000Z",
  },
  revisions: [],
};
const currentInvestigation = materializeInitialOperationalRevision(baseInvestigation, adaptSystemCanonToKnowledge(CANONICAL_EVENTS));
const serializedPreI3b = JSON.parse(JSON.stringify(currentInvestigation)) as Investigation;
const staleRevision = serializedPreI3b.revisions[0]!;
staleRevision.manifold.graph.nodes = staleRevision.manifold.graph.nodes.map(candidate => {
  const metadata = candidate.metadata === undefined ? undefined : { ...candidate.metadata };
  if (metadata !== undefined) delete metadata.dossierReference;
  return {
    ...candidate,
    ...(candidate.type === "FACILITY" ? { iconType: "BUILDING" as const } : {}),
    ...(metadata === undefined ? {} : { metadata }),
  };
});
const preI3bInvestigation = deepFreeze(serializedPreI3b);
const historicalBefore = preI3bInvestigation.revisions[0];
const legacyPrinceton = historicalBefore.manifold.graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!;
assert.equal(legacyPrinceton.iconType, "BUILDING");
assert.equal(legacyPrinceton.metadata?.dossierReference, undefined);
const legacyFailure = resolveSelectionIntelligence(
  { kind: "NODE", nodeId: legacyPrinceton.id, nodeType: legacyPrinceton.type },
  historicalBefore.manifold.graph,
  { investigationId: preI3bInvestigation.id, manifoldRevisionId: historicalBefore.id },
);
assert(legacyFailure.kind === "NODE" && legacyFailure.intelligence.entitySpecific.governedDossier.availability === "UNAVAILABLE" && legacyFailure.intelligence.entitySpecific.governedDossier.reason === "NOT_REFERENCED");
const snapshot = (investigation: Investigation): GuestWorkspaceSessionSnapshot => ({
  schemaVersion: 1,
  ownership: { kind: "GUEST", operatorId: "guest:i3b1", establishedAt: "2026-09-19T00:00:00.000Z" },
  createdAt: "2026-09-19T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
  workspace: {
    workspace: investigation.workspace,
    investigation,
    operator: { activeMode: "MANIFOLD", layoutMode: "NORMAL" },
    computational: { activeLayers: [] },
  },
  research: { desk: { entries: [] } },
  authoring: {},
});
const identity = { status: "READY", identity: { operatorId: "guest:i3b1", kind: "GUEST", establishedAt: "2026-09-19T00:00:00.000Z" }, persistence: "SESSION", revision: 1 } as const;
const restore = (investigation: Investigation) => {
  const workspaceRuntime = new WorkspaceRuntime();
  restoreGuestWorkspaceSessionIntoRuntimes({ snapshot: snapshot(investigation), identity, workspaceRuntime, researchBridgeRuntime: new ResearchBridgeRuntime(), authorDocumentRuntime: new AuthorDocumentRuntime() });
  return { workspaceRuntime, investigation: workspaceRuntime.getActiveInvestigation()! };
};

const live = restore(preI3bInvestigation);
assert.equal(live.investigation.id, preI3bInvestigation.id);
assert.equal(live.investigation.workspace.focused_event_id, "E-TICTAC-2004");
assert.equal(live.workspaceRuntime.getOperatorState().activeMode, "MANIFOLD");
assert.equal(live.investigation.revisions.length, 2);
assert.deepEqual(live.investigation.revisions[0], historicalBefore);
assert.equal(live.investigation.revisions[1]!.parentRevisionId, live.investigation.revisions[0]!.id);
assert.equal(live.investigation.currentRevisionId, live.investigation.revisions[1]!.id);
const liveRevision = resolveCurrentOperationalRevision(live.investigation);
const livePrinceton = liveRevision.manifold.graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!;
assert.deepEqual(livePrinceton.metadata?.dossierReference, reference);
assert.equal(liveRevision.manifold.graph.nodes.find(candidate => candidate.id === "system:event:E-TICTAC-2004")!.metadata?.dossierReference, undefined);
const liveSelection = { kind: "NODE", nodeId: livePrinceton.id } as const;
const coherent = resolveCoherentInvestigationSelection(live.investigation, adaptSystemCanonToKnowledge(CANONICAL_EVENTS), liveSelection);
assert.deepEqual(coherent, liveSelection);
const liveIntelligence = resolveCanonicalSelectionIntelligence({ graph: liveRevision.manifold.graph, selection: coherent, investigationId: live.investigation.id, manifoldRevisionId: liveRevision.id });
assert(liveIntelligence.kind === "NODE" && liveIntelligence.intelligence.entitySpecific.governedDossier.availability === "AVAILABLE");
if (liveIntelligence.kind !== "NODE" || liveIntelligence.intelligence.entitySpecific.governedDossier.availability !== "AVAILABLE") throw new Error("unreachable");
assert.equal(liveIntelligence.intelligence.entitySpecific.governedDossier.dossierRevisionId, revision.dossierRevisionId);

const repeated = restore(live.investigation).investigation;
assert.equal(repeated.revisions.length, 2);
assert.equal(repeated.currentRevisionId, live.investigation.currentRevisionId);
assert.equal(createOperationalGraphFingerprint(resolveCurrentOperationalRevision(repeated).manifold.graph), createOperationalGraphFingerprint(liveRevision.manifold.graph));

const i3bRaw = JSON.parse(JSON.stringify(currentInvestigation)) as Investigation;
const i3bNode = i3bRaw.revisions[0]!.manifold.graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!;
i3bNode.metadata = { ...i3bNode.metadata, dossierReference: { schemaVersion: USS_PRINCETON_DOSSIER_REVISION_1.schemaVersion, entityId: i3bNode.id, globalDossierRevisionId: USS_PRINCETON_DOSSIER_REVISION_1.dossierRevisionId, effectiveDossierHash: USS_PRINCETON_DOSSIER_REVISION_1.contentHash } };
const i3bRestored = restore(deepFreeze(i3bRaw)).investigation;
assert.equal(i3bRestored.revisions.length, 2);
assert.deepEqual(resolveCurrentOperationalRevision(i3bRestored).manifold.graph.nodes.find(candidate => candidate.id === i3bNode.id)!.metadata?.dossierReference, reference);
assert.equal(restore(i3bRestored).investigation.revisions.length, 2);

const researcher = deepFreeze({ ...JSON.parse(JSON.stringify(preI3bInvestigation)) as Investigation, createdBy: "AUTHENTICATED_RESEARCHER" });
const researcherRestored = restore(researcher).investigation;
assert.equal(researcherRestored.revisions.length, 1);
assert.equal(researcherRestored.revisions[0]!.manifold.graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!.metadata?.dossierReference, undefined);

const unknownDeltaRaw = JSON.parse(JSON.stringify(preI3bInvestigation)) as Investigation;
const unknownNode = unknownDeltaRaw.revisions[0]!.manifold.graph.nodes.find(candidate => candidate.id === "system:entity:uss-princeton")!;
unknownNode.label = "Researcher-altered label";
const unknownDelta = deepFreeze(unknownDeltaRaw);
const unknownRestored = restore(unknownDelta).investigation;
assert.equal(unknownRestored.revisions.length, 1);
assert.equal(resolveCurrentOperationalRevision(unknownRestored).manifold.graph.nodes.find(candidate => candidate.id === unknownNode.id)!.label, "Researcher-altered label");

const rightPanel = readFileSync("src/components/RightPanel.tsx", "utf8");
assert(rightPanel.includes('<GovernedDossierInspector dossier={entity.governedDossier} />'));
assert(rightPanel.includes('title="GOVERNED ENTITY DOSSIER"'));
assert.equal(rightPanel.includes("SystemCanonEntityDossierRegistry"), false);
assert.equal(rightPanel.includes("USS_PRINCETON_GOVERNED_ENTITY_DOSSIER"), false);
const liveSources = `${readFileSync("src/workspace/persistence/GuestWorkspaceSessionRestorer.ts", "utf8")}\n${implementation}\n${rightPanel}`;
for (const forbidden of ["fetch(", "XMLHttpRequest", "WebSocket", "Tavily", "WebDiscovery", "invokeRex", "CandidateEvidence"]) assert.equal(liveSources.includes(forbidden), false, forbidden);

console.log("PASS VerifyGovernedEntityDossierSelectionProjection — 20 projection invariants plus live persisted-restoration reconciliation verified");
