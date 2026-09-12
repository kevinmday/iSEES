import assert from "node:assert/strict";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope, unknownEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake.ts";
import { buildKnowledgeBootstrapPopulation } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts";
import { composeGuestOperationalKnowledgeObjects } from "../../src/knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";
import { ResolveRuntime } from "../../src/resolve/runtime/ResolveRuntime.ts";
import { resolveCandidateIntelligenceCollection } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver.ts";
import { createWorkspaceCandidateSelection } from "../../src/resolve/intelligence/ResolveCandidateSelection.ts";
import { resolveComparePairProjection } from "../../src/compare/projection/ComparePairProjectionResolver.ts";
import { WorkspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { createGuestWorkspaceSnapshotFromRuntimeState } from "../../src/workspace/persistence/GuestWorkspaceSessionSnapshotFactory.ts";
import { restoreGuestWorkspaceSessionIntoRuntimes } from "../../src/workspace/persistence/GuestWorkspaceSessionRestorer.ts";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime.ts";
import { AuthorDocumentRuntime } from "../../src/author/runtime/AuthorDocumentRuntime.ts";
import { projectLayersExperimentalPair } from "../../src/layers/projection/LayersExperimentalPairProjection.ts";
import { ArmedLayerClassification } from "../../src/layers/runtime/LayersExperimentRuntimeTypes.ts";
import { LayersExperimentRuntime } from "../../src/layers/runtime/LayersExperimentRuntime.ts";
import { isActiveOperationalGraphFocused, resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import { readFileSync } from "node:fs";

const at = "2026-09-12T12:00:00.000Z";
const identity = { status: "READY" as const, identity: { kind: "GUEST" as const, operatorId: "guest:bridge", establishedAt: at }, persistence: "SESSION" as const, revision: 1 };
const blank = restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
const form = Object.freeze({ ...blank, workingTitle: suppliedEnvelope("Case 37 Medford Observation"), observationNarrative: suppliedEnvelope("lights"), objectShape: suppliedEnvelope("sphere_orb"), observationLocation: suppliedEnvelope("Medford, Oregon"), environmentalConditions: unknownEnvelope() });
const canonical = buildKnowledgeBootstrapPopulation();
const first = createGuestCandidateInvestigation(form, identity, at, "stable-candidate", canonical);
const repeated = createGuestCandidateInvestigation(form, identity, at, "stable-candidate", canonical);
assert.equal(first.status, "CREATED");
assert.deepEqual(first, repeated, "same candidate identity and content is idempotent");
if (first.status !== "CREATED") throw new Error("unreachable");

const candidate = first.candidate;
const graph = first.investigation.revisions[0]!.manifold.graph;
assert.equal(candidate.knowledgeObject.identity.id, candidate.candidateId);
assert.equal(candidate.knowledgeObject.type, "EVENT");
assert.deepEqual(candidate.knowledgeObject.relationships, []);
assert.deepEqual(candidate.knowledgeObject.graph, []);
assert.equal(graph.nodes.length, canonical.length + 1);
assert.equal(graph.edges.length, canonical.flatMap(object => object.relationships).length);
assert.deepEqual(graph.statistics, { nodeCount: 17, edgeCount: 13, eventCount: 4, facilityCount: 10, artifactCount: 0, personCount: 0, organizationCount: 0, locationCount: 3, narrativeCount: 0, hypothesisCount: 0 });
assert.equal(graph.nodes.filter(node => node.id === candidate.candidateId && node.label === "Case 37 Medford Observation").length, 1);
assert.equal(resolveActiveOperationalGraphProjection(first.investigation).centerNodeId, candidate.candidateId);
assert.equal(isActiveOperationalGraphFocused(first.investigation), true);
assert.equal(isActiveOperationalGraphFocused({ ...first.investigation, workspace: { ...first.investigation.workspace, focused_event_id: "missing-focused-event" } }), false, "synchronization cannot succeed when the focused candidate is absent");
assert.equal(first.investigation.currentRevisionId, "REV-0001");
assert.equal(candidate.operationalMaterialization, "INITIAL_REVISION_ACTIVE");
const payload = candidate.knowledgeObject.payload as { nativeCaseDraftContent: unknown; operationalFeatures: Record<string, unknown> };
assert.deepEqual(payload.nativeCaseDraftContent, candidate.content);
assert.deepEqual(payload.operationalFeatures, { observationLocation: "Medford, Oregon", observationNarrative: "lights", objectShape: "sphere_orb", workingTitle: "Case 37 Medford Observation" });
assert.equal(payload.operationalFeatures.observationLocation, "Medford, Oregon");
assert.equal(Object.hasOwn(payload.operationalFeatures, "environmentalConditions"), false);
assert.equal(graph.nodes.some(node => node.label === "Medford, Oregon"), false, "no unsupported Medford LOCATION materialization is invented");

const target = canonical.find(object => object.type === "EVENT" && object.provenance.sourceType === "SYSTEM_CANON")!;
assert.ok(graph.nodes.some(node => node.id === target.identity.id), "selected Canon comparison context is present in the active revision");
const knowledge = composeGuestOperationalKnowledgeObjects(first.investigation.workspace, canonical);
assert.equal(knowledge.filter(object => object.identity.id === candidate.candidateId).length, 1);

const sourceWorkspace = new WorkspaceRuntime();
sourceWorkspace.activateGuestCandidateInvestigation(first.investigation);
sourceWorkspace.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: target.provenance.sourceId, knowledgeObjectId: target.identity.id });
const research = new ResearchBridgeRuntime();
const author = new AuthorDocumentRuntime();
const snapshot = createGuestWorkspaceSnapshotFromRuntimeState({ identity, workspace: sourceWorkspace.getState(), researchDesk: research.getDesk(), authoring: author.getState(), createdAt: at, updatedAt: at });
const restoredWorkspace = new WorkspaceRuntime();
restoreGuestWorkspaceSessionIntoRuntimes({ snapshot: JSON.parse(JSON.stringify(snapshot)), identity, workspaceRuntime: restoredWorkspace, researchBridgeRuntime: new ResearchBridgeRuntime(), authorDocumentRuntime: new AuthorDocumentRuntime() });
assert.deepEqual(restoredWorkspace.getSelection(), sourceWorkspace.getSelection(), "Canon target survives session restoration");
assert.equal(restoredWorkspace.getActiveInvestigation()?.id, first.investigation.id);
assert.equal(restoredWorkspace.getActiveInvestigation()?.currentRevisionId, first.investigation.currentRevisionId);
assert.equal(restoredWorkspace.getWorkspace()?.focused_event_id, candidate.candidateId);

const resolve = new ResolveRuntime();
resolve.initialize();
const result = resolve.execute({ investigation: first.investigation, knowledgeObjects: knowledge, activeLayers: [], temporalContext: undefined, investigativeScale: undefined });
const evaluation = result.candidateEvaluations.evaluations.find(item => {
  const endpoints = [item.identity.leftKnowledgeObjectId, item.identity.rightKnowledgeObjectId];
  return endpoints.includes(candidate.candidateId) && endpoints.includes(target.identity.id);
});
assert.ok(evaluation, "existing Resolve path qualifies the exact guest/Canon pair");
const intelligence = resolveCandidateIntelligenceCollection([evaluation!]).intelligence[0]!;
const pairSelection = createWorkspaceCandidateSelection(intelligence);
sourceWorkspace.setSelection(pairSelection);
const pair = resolveComparePairProjection(candidate.candidateId, knowledge, pairSelection, [intelligence]);
assert.equal(pair.status, "READY");
if (pair.status !== "READY") throw new Error("unreachable");
assert.equal(pair.focusedEventKnowledgeObjectId, candidate.candidateId);
assert.equal(pair.comparisonEventKnowledgeObjectId, target.identity.id);
assert.equal(graph.edges.filter(edge => [edge.source, edge.target].includes(candidate.candidateId) && [edge.source, edge.target].includes(target.identity.id)).length, 0, "selection and Resolve evaluation create no candidate-to-Canon edge");
assert.equal(candidate.knowledgeObject.relationships.length, 0, "explicit acceptance remains required");

const matrixPair = result.manifold.similarityMatrix.pairs.find(item => item.leftKnowledgeObjectId === pair.leftKnowledgeObjectId && item.rightKnowledgeObjectId === pair.rightKnowledgeObjectId)!;
const pairId = `canonical-pair:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`;
const subjectIds = [pair.leftKnowledgeObjectId, pair.rightKnowledgeObjectId].sort();
const laboratoryInput = {
  scope: { investigationId: first.investigation.id, workspaceId: first.investigation.workspace.id, focusedEventId: candidate.candidateId, comparisonEventId: target.provenance.sourceId, subjectIds, compareOrigin: { pairId, candidateId: pair.candidateId, evaluationId: pair.evaluationId }, resolveOrigin: { executionId: result.executionId } },
  baseline: { investigationId: first.investigation.id, workspaceId: first.investigation.workspace.id, subjectIds, canonicalStartingLayerIds: [], startingResolveExecutionId: result.executionId, temporalContext: undefined, investigativeScale: undefined },
  armedLayers: [], temporalContext: undefined, investigativeScale: undefined, researcherConfiguration: {},
};
const layers = projectLayersExperimentalPair({ executionId: "layers:guest-bridge", laboratoryInput, investigationId: first.investigation.id, sourceKnowledgeObjectId: pair.leftKnowledgeObjectId, targetKnowledgeObjectId: pair.rightKnowledgeObjectId, caseAKnowledgeObjectId: pair.caseAKnowledgeObjectId, caseBKnowledgeObjectId: pair.caseBKnowledgeObjectId, knowledgeObjects: knowledge, pair: matrixPair, evaluation: evaluation!, baselineLayers: [], experimentalLayers: [
  { id: "NARRATIVE", classification: ArmedLayerClassification.CANONICAL, operational: true },
  { id: "GEOMAGNETIC", classification: ArmedLayerClassification.UNSUPPORTED, operational: false },
] });
assert.equal(layers.experimentalManifoldSnapshot.evaluatorInput.endpoints.find(endpoint => endpoint.subjectRole === "CASE_A")?.knowledgeObjectId, candidate.candidateId);
assert.equal(layers.experimentalManifoldSnapshot.evaluatorInput.endpoints.find(endpoint => endpoint.subjectRole === "CASE_B")?.knowledgeObjectId, target.identity.id);
const unavailable = layers.experimentalManifoldSnapshot.layerContributions.find(item => item.layerId === "EXPERIMENTAL:GEOMAGNETIC")!;
assert.equal(unavailable.availability, "UNAVAILABLE");
assert.equal(unavailable.participatingWeight, 0);
assert.equal(unavailable.weightedContribution, 0);
assert.equal(layers.experimentalManifoldSnapshot.createsCanonicalKnowledgeRelationship, false);

const readyLayerIds = ["OBSERVABILITY", "NARRATIVE", "GEOGRAPHY", "INFRASTRUCTURE", "TOPOLOGY"] as const;
const experiment = new LayersExperimentRuntime();
experiment.establish({ scope: laboratoryInput.scope, baseline: laboratoryInput.baseline, armedLayers: { layerIds: readyLayerIds } });
let executingTransitions = 0;
experiment.subscribe(() => { if (experiment.getState().status === "EXECUTING") executingTransitions += 1; });
const executeOnce = () => {
  const executionId = experiment.beginExecution({ operatorAction: "RUN_RECOMPUTE" });
  const input = experiment.getState().currentExecution!.input;
  const projected = projectLayersExperimentalPair({ executionId, laboratoryInput: input, investigationId: first.investigation.id, sourceKnowledgeObjectId: pair.leftKnowledgeObjectId, targetKnowledgeObjectId: pair.rightKnowledgeObjectId, caseAKnowledgeObjectId: pair.caseAKnowledgeObjectId, caseBKnowledgeObjectId: pair.caseBKnowledgeObjectId, knowledgeObjects: knowledge, pair: matrixPair, evaluation: evaluation!, baselineLayers: [], experimentalLayers: input.armedLayers });
  experiment.completeExecution(executionId, first.investigation.id, projected);
  return experiment.getState().currentExecution!;
};
const firstExecution = executeOnce();
assert.equal(executingTransitions, 1, "one Run command starts exactly one existing runtime execution");
assert.equal(experiment.getState().status, "COMPLETE");
assert.deepEqual(firstExecution.input.scope.subjectIds, subjectIds);
assert.deepEqual(firstExecution.input.armedLayers.map(layer => layer.id), [...readyLayerIds].sort());
assert.equal(firstExecution.result?.experimentalManifoldSnapshot?.evaluatorInput.endpoints.find(endpoint => endpoint.subjectRole === "CASE_A")?.knowledgeObjectId, candidate.candidateId);
assert.equal(firstExecution.result?.experimentalManifoldSnapshot?.evaluatorInput.endpoints.find(endpoint => endpoint.subjectRole === "CASE_B")?.knowledgeObjectId, target.identity.id);
assert.ok(Object.isFrozen(firstExecution.result));
assert.ok(Object.isFrozen(firstExecution.result?.experimentalManifoldSnapshot));
assert.equal(firstExecution.result?.experimentalManifoldSnapshot?.createsCanonicalKnowledgeRelationship, false);
assert.deepEqual(candidate.knowledgeObject.relationships, []);
assert.equal(graph.edges.some(edge => [edge.source, edge.target].includes(candidate.candidateId) && [edge.source, edge.target].includes(target.identity.id)), false);
const firstCanonicalResult = firstExecution.result?.experimentalManifoldSnapshot?.provenance.canonicalRepresentation;
const recomputed = executeOnce();
assert.equal(executingTransitions, 2, "one explicit recompute starts exactly one additional execution");
assert.equal(recomputed.executionId, firstExecution.executionId, "identical inputs retain deterministic execution identity");
assert.equal(recomputed.result?.experimentalManifoldSnapshot?.provenance.canonicalRepresentation, firstCanonicalResult);
assert.equal(experiment.getState().history.length, 2);
const sessionSnapshot = createGuestWorkspaceSnapshotFromRuntimeState({ identity, workspace: sourceWorkspace.getState(), researchDesk: research.getDesk(), authoring: author.getState(), createdAt: at, updatedAt: at });
assert.equal(JSON.stringify(sessionSnapshot).includes(firstExecution.executionId), false, "guest experiment result remains outside session persistence");

const manifoldComponent = readFileSync("src/manifold/components/InvestigationGraph.tsx", "utf8");
const synchronizationStatus = readFileSync("src/components/workspace/ManifoldProjectionStatus.tsx", "utf8");
const layersWorkspace = readFileSync("src/layers/components/LayersLaboratoryWorkspace.tsx", "utf8");
const layersInspector = readFileSync("src/layers/components/LayersExperimentalIntelligence.tsx", "utf8");
const layersNavigator = readFileSync("src/layers/components/LayersLaboratoryNavigator.tsx", "utf8");
assert.ok(manifoldComponent.includes("resolveActiveOperationalGraphProjection(activeInvestigation)"), "MANIFOLD renders the active operational revision");
assert.ok(synchronizationStatus.includes("activeRevisionGraphFocused &&"), "synchronization success requires the focused EVENT in the active revision graph");
assert.ok(layersWorkspace.includes('role="alert"') && layersWorkspace.includes("Experiment could not run:"), "blocked pre-execution failures are visibly and accessibly reported");
assert.ok(layersWorkspace.includes("EXECUTION COMPLETED") && layersWorkspace.includes("immutable experimental, non-canonical result"), "completed status is obvious after execution");
assert.ok(layersInspector.includes("composeGuestOperationalKnowledgeObjects(workspace, canonicalKnowledge)"), "Delta inspector reconstructs authority from the same guest-aware Knowledge collection");
assert.ok(layersNavigator.includes("selectedComparisonEventId") && layersNavigator.includes("selectedComparisonEventId ?? state.scope?.comparisonEventId"), "navigator projects Case B from typed selection before stale experiment scope");
const resolveCommand = readFileSync("src/resolve/runtime/useResolveExecutionCommand.ts", "utf8");
const toolbar = readFileSync("src/manifold/components/ManifoldToolbar.tsx", "utf8");
const executionCoherence = readFileSync("src/intelligence/selection/InvestigationSelectionCoherence.ts", "utf8");
assert.ok(resolveCommand.includes("resolveRuntime.execute") && resolveCommand.includes("createWorkspaceCandidateSelection") && resolveCommand.includes("workspaceRuntime.setSelection"), "one governed command publishes the exact post-Resolve candidate selection");
assert.ok(executionCoherence.includes("execution.input.investigation.currentRevisionId === investigation.currentRevisionId"), "current operational revision qualifies authoritative execution consumption");
assert.ok(toolbar.includes('role={resolveCommand.feedback.phase === "RESOLVE_FAILED"') && toolbar.includes("Candidates produced:"), "MANIFOLD exposes persistent accessible completion and failure feedback");
assert.ok(layersWorkspace.includes("Comparison selected. Run Resolve on MANIFOLD"), "LAYERS distinguishes a selected unresolved pair from no comparison");

console.log("PASS VerifyGuestResolveOnManifoldBridge: guest projection, exact Resolve authority, five READY layers, one-click runtime execution, immutable inspector result, deterministic recompute, accessible failure feedback, navigator coherence, session-only persistence, unavailable-layer zero contribution, and no implicit Canon mutation or edge verified.");
