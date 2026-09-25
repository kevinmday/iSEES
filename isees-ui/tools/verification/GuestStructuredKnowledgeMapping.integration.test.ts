import { createElement, useEffect, type ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, suppliedEnvelope } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import type { NativeCaseDraftFormState } from "../../src/nativeCaseDraft/NativeCaseDraftFieldState.ts";
import { createGuestCandidateInvestigation } from "../../src/workspace/guestCase/GuestCaseIntake.ts";
import { buildKnowledgeBootstrapPopulation, bootstrapKnowledgeRuntime } from "../../src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts";
import { composeGuestOperationalKnowledgeObjects, GUEST_CANDIDATE_ADAPTER_VERSION, GUEST_CANDIDATE_SOURCE_TYPE, type GuestCandidateKnowledgePayload } from "../../src/knowledge/ingestion/GuestCandidateKnowledgeAdapter.ts";
import { buildKnowledgeTopology } from "../../src/knowledge/topology/KnowledgeTopologyBuilder.ts";
import { adaptKnowledgeTopology } from "../../src/knowledge/topology/KnowledgeTopologyAdapter.ts";
import { createOperationalGraphFingerprint, resolveActiveOperationalGraphProjection } from "../../src/investigation/revision/OperationalGraphRevision.ts";
import { WorkspaceRuntimeProvider } from "../../src/workspace/runtime/WorkspaceRuntimeContext.tsx";
import { workspaceRuntime } from "../../src/workspace/runtime/WorkspaceRuntime.ts";
import { WorkspaceMode, WorkspaceSelectionKind } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import { KnowledgeObjectRuntimeProvider } from "../../src/knowledge/runtime/KnowledgeObjectRuntimeContext.tsx";
import { ResolveRuntimeProvider, useResolveRuntimeState } from "../../src/resolve/runtime/ResolveRuntimeContext.tsx";
import { ResolveRuntime } from "../../src/resolve/runtime/ResolveRuntime.ts";
import type { ResolveRuntimeState } from "../../src/resolve/runtime/ResolveRuntimeTypes.ts";
import ManifoldToolbar from "../../src/manifold/components/ManifoldToolbar.tsx";
import ManifoldProjectionStatus from "../../src/components/workspace/ManifoldProjectionStatus.tsx";
import { resolveComparePairProjection } from "../../src/compare/projection/ComparePairProjectionResolver.ts";
import { resolveCandidateIntelligenceCollection } from "../../src/resolve/intelligence/ResolveCandidateIntelligenceResolver.ts";
import { LayersExperimentRuntime } from "../../src/layers/runtime/LayersExperimentRuntime.ts";
import { projectLayersExperimentalPair } from "../../src/layers/projection/LayersExperimentalPairProjection.ts";

const recordedAt = "2026-09-11T04:35:00.000Z";
const candidateId = "guest-candidate:case-39-structured-mapping";
const comparisonEventId = "E-TICTAC-2004";
const identity = { status: "READY" as const, identity: { kind: "GUEST" as const, operatorId: "guest:case-39-researcher", establishedAt: recordedAt }, persistence: "SESSION" as const, revision: 1 };

const supplied = Object.freeze({
  title: "Case #39 Medford Geomagnetic Observation",
  location: "Medford, Oregon, United States",
  localDate: "2026-09-10",
  localTime: "21:35",
  timezone: "America/Los_Angeles",
  narrative: "Eight witnesses observed a bright white oval northeast of Medford. It remained stationary for approximately four minutes, then departed rapidly westward. No sound was reported. A possible relationship to elevated geomagnetic activity is an unverified working hypothesis only.",
  appearance: "Bright white oval or oblong; sharply defined; no visible wings, rotors, exhaust, or navigation lights.",
  motion: "Stationary, followed by smooth rapid westward acceleration without visible banking or a conventional climb.",
  sound: "None reported.",
  lightingVisibility: "Clear night with good visibility. Object appeared self-luminous and brighter than surrounding stars.",
  observerContext: "Eight adults; two reported aviation or military experience.",
  witnessCount: 8,
  environmentalConditions: "Clear, light wind, approximately 58 degrees F, no precipitation. Elevated geomagnetic activity is a hypothesis, not an established fact.",
  durationSeconds: 240,
  evidence: "Two phone videos, three photographs, contemporaneous notes, approximate coordinates, and timestamps reported available.",
  sensorContext: "Unaided visual observation and phone cameras. Nearby aviation, weather, radar, and geomagnetic records have not been collected.",
  provenance: "Researcher-created fictional guest acceptance case. External claims are unverified.",
  privacyClassification: "Research use; witness identities withheld.",
  rightsRestrictions: "Do not publish names, precise residential coordinates, original metadata, or media without permission. Derived non-identifying results may be used.",
  comparisonTarget: "Nimitz Tic Tac Encounter, E-TICTAC-2004",
});

const logicalFieldNames = Object.freeze(Object.keys(supplied));
const notes = `Evidence: ${supplied.evidence}\nSensor context: ${supplied.sensorContext}\nPrivacy classification: ${supplied.privacyClassification}`;

function case39Form(): NativeCaseDraftFormState {
  const blank = restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent());
  return Object.freeze({
    ...blank,
    workingTitle: suppliedEnvelope(supplied.title), observationLocation: suppliedEnvelope(supplied.location),
    localObservationDate: suppliedEnvelope(supplied.localDate), localObservationTime: suppliedEnvelope(supplied.localTime), timezone: suppliedEnvelope(supplied.timezone),
    observationNarrative: suppliedEnvelope(supplied.narrative), objectShape: suppliedEnvelope(supplied.appearance), movementBehavior: suppliedEnvelope(supplied.motion),
    soundCharacteristics: suppliedEnvelope(supplied.sound), lightingVisibility: suppliedEnvelope(supplied.lightingVisibility), observerContext: suppliedEnvelope(supplied.observerContext),
    witnessCount: suppliedEnvelope(supplied.witnessCount), environmentalConditions: suppliedEnvelope(supplied.environmentalConditions), approximateDuration: suppliedEnvelope(supplied.durationSeconds),
    researcherNotes: suppliedEnvelope(notes), sourceProvenanceStatement: suppliedEnvelope(supplied.provenance), privacyClassification: suppliedEnvelope("RESTRICTED"),
    rightsPublicationRestriction: suppliedEnvelope(supplied.rightsRestrictions),
  }) as NativeCaseDraftFormState;
}

let observedResolveState: ResolveRuntimeState | undefined;
function ResolveStateProbe({ onState }: { onState: (state: ResolveRuntimeState) => void }): null {
  const state = useResolveRuntimeState();
  useEffect(() => onState(state), [onState, state]);
  return null;
}
function providers(children: ReactNode): ReactNode {
  return createElement(KnowledgeObjectRuntimeProvider, null,
    createElement(WorkspaceRuntimeProvider, null,
      createElement(ResolveRuntimeProvider, null, children)));
}

beforeEach(() => {
  workspaceRuntime.deactivate();
  bootstrapKnowledgeRuntime();
  observedResolveState = undefined;
});
afterEach(() => {
  cleanup();
  workspaceRuntime.deactivate();
  vi.restoreAllMocks();
});

describe("Case #39 structured Candidate Knowledge production mapping", () => {
  it("characterizes intake through MANIFOLD, COMPARE, Resolve, and LAYERS", async () => {
    const strict = process.env.ISEES_REQUIRE_STRUCTURED_MAPPING === "1";
    const canonical = buildKnowledgeBootstrapPopulation();
    const canonBefore = JSON.stringify(canonical);
    const created = createGuestCandidateInvestigation(case39Form(), identity, recordedAt, "case-39-structured-mapping");
    expect(created.status).toBe("CREATED");
    if (created.status !== "CREATED") throw new Error("Case #39 intake unexpectedly failed validation.");

    const content = created.candidate.content;
    expect(content.workingTitle.value).toBe(supplied.title);
    expect(content.observationLocation.value).toBe(supplied.location);
    expect(content.localObservationDate.value).toBe(supplied.localDate);
    expect(content.localObservationTime.value).toBe(supplied.localTime);
    expect(content.timezone.value).toBe(supplied.timezone);
    expect(content.observationNarrative.value).toBe(supplied.narrative);
    expect(content.objectShape.value).toBe(supplied.appearance);
    expect(content.movementBehavior.value).toBe(supplied.motion);
    expect(content.soundCharacteristics.value).toBe(supplied.sound);
    expect(content.lightingVisibility.value).toBe(supplied.lightingVisibility);
    expect(content.observerContext.value).toBe(supplied.observerContext);
    expect(content.witnessCount.value).toBe(supplied.witnessCount);
    expect(content.environmentalConditions.value).toBe(supplied.environmentalConditions);
    expect(content.approximateDuration.seconds).toBe(supplied.durationSeconds);
    expect(content.researcherNotes.value).toContain(supplied.evidence);
    expect(content.researcherNotes.value).toContain(supplied.sensorContext);
    expect(content.researcherNotes.value).toContain(supplied.privacyClassification);
    expect(content.sourceProvenanceStatement.value).toBe(supplied.provenance);
    expect(content.privacyClassification.value).toBe("RESTRICTED");
    expect(content.rightsPublicationRestriction.value).toBe(supplied.rightsRestrictions);
    expect(created.candidate.canonicalSerialization).toBe(JSON.stringify(JSON.parse(created.candidate.canonicalSerialization)));

    const operationalFeatures = (created.candidate.knowledgeObject.payload as { operationalFeatures: Record<string, unknown> }).operationalFeatures;
    expect(Object.keys(operationalFeatures).sort()).toEqual(Object.keys(content).filter(key => key !== "schemaVersion").sort());
    expect(JSON.stringify(operationalFeatures)).toContain(supplied.evidence);
    expect(JSON.stringify(operationalFeatures)).toContain(supplied.sensorContext);
    expect(JSON.stringify(operationalFeatures)).toContain(supplied.privacyClassification);

    const knowledge = composeGuestOperationalKnowledgeObjects(created.investigation.workspace, canonical);
    const guestObjects = knowledge.filter(object => object.provenance.sourceType === GUEST_CANDIDATE_SOURCE_TYPE);
    const topology = buildKnowledgeTopology([...guestObjects]);
    const adapted = adaptKnowledgeTopology(topology);
    const manifold = resolveActiveOperationalGraphProjection(created.investigation);
    expect(adapted.nodes).toEqual(manifold.nodes);
    expect(adapted.edges).toEqual(manifold.edges);
    expect(manifold.nodes).toHaveLength(9);
    expect(manifold.edges).toHaveLength(8);
    const canonicalIds = new Set(canonical.map(object => object.identity.id));
    expect(manifold.nodes.every(node => !canonicalIds.has(node.id))).toBe(true);
    expect(manifold.edges.every(edge => !canonicalIds.has(edge.source) && !canonicalIds.has(edge.target))).toBe(true);
    expect(guestObjects).toHaveLength(9);
    const guestEvent = guestObjects.find(object => object.identity.id === candidateId);
    expect(guestEvent?.type).toBe("EVENT");
    expect(guestEvent?.status).toBe("COLLECTED");
    expect(guestEvent?.metadata.author).toBe(identity.identity.operatorId);
    expect(guestObjects.every(object => object.provenance.sourceType === GUEST_CANDIDATE_SOURCE_TYPE && object.provenance.sourceId === candidateId)).toBe(true);
    expect(guestObjects.every(object => object.metadata.author === identity.identity.operatorId && object.capabilities.publishable === false)).toBe(true);
    expect(guestObjects.every(object => (object.payload as { source?: string; knowledgeClassification?: string; systemCanonIdentity?: unknown }).source === "RESEARCHER_SUPPLIED")).toBe(true);
    expect(guestObjects.every(object => (object.payload as { knowledgeClassification?: string }).knowledgeClassification === "CANDIDATE_KNOWLEDGE")).toBe(true);
    expect(guestObjects.every(object => (object.payload as { systemCanonIdentity?: unknown }).systemCanonIdentity === null)).toBe(true);
    expect(guestObjects.every(object => object.confidence.value === 0 && object.confidence.rationale?.includes("Truth confidence unavailable"))).toBe(true);
    expect(guestObjects.every(object => (object.payload as GuestCandidateKnowledgePayload).normalizationCertainty === 1 && (object.payload as GuestCandidateKnowledgePayload).truthConfidence === null)).toBe(true);
    expect(guestObjects.every(object => (object.payload as GuestCandidateKnowledgePayload).lineage.adapterVersion === GUEST_CANDIDATE_ADAPTER_VERSION)).toBe(true);
    expect(guestObjects.every(object => (object.payload as GuestCandidateKnowledgePayload).lineage.sourceSpans.every(span => span.text.length > 0 && span.end > span.start))).toBe(true);

    const location = guestObjects.find(object => object.type === "LOCATION");
    expect(location?.metadata.title).toBe(supplied.location);
    const artifacts = guestObjects.filter(object => object.type === "ARTIFACT");
    expect(artifacts).toHaveLength(5);
    expect(artifacts.map(object => (object.payload as { representation?: { category?: string } }).representation?.category).sort()).toEqual(["APPROXIMATE_COORDINATES", "CONTEMPORANEOUS_NOTES", "PHONE_VIDEO", "PHOTOGRAPH", "TIMESTAMPS"]);
    expect(artifacts.every(object => (object.payload as { representation?: { inspected?: boolean } }).representation?.inspected === false)).toBe(true);
    const hypothesis = guestObjects.find(object => object.type === "HYPOTHESIS");
    expect(hypothesis?.metadata.title).toBe("Possible relationship to elevated geomagnetic activity");
    expect(hypothesis?.status).toBe("HYPOTHESIS");
    expect((hypothesis?.payload as { representation?: { verified?: boolean } }).representation?.verified).toBe(false);
    const observers = guestObjects.filter(object => object.type === "PERSON");
    expect(observers).toHaveLength(0);
    expect((guestEvent?.payload as GuestCandidateKnowledgePayload).representation).toMatchObject({ aggregateObservation: { observerContext: supplied.observerContext, witnessCount: 8, individualPersonObjectsMaterialized: false } });
    expect(guestObjects.filter(object => object.type === "NARRATIVE")).toHaveLength(1);

    const reorderedTopology = buildKnowledgeTopology([...guestObjects].reverse());
    expect(JSON.stringify(reorderedTopology)).toBe(JSON.stringify(topology));
    workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: comparisonEventId, knowledgeObjectId: canonical[0]!.identity.id });
    const repeated = createGuestCandidateInvestigation(case39Form(), identity, recordedAt, "case-39-structured-mapping");
    expect(repeated.status).toBe("CREATED");
    if (repeated.status !== "CREATED") throw new Error("Repeated Case #39 intake failed.");
    expect(repeated.candidate.canonicalSerialization).toBe(created.candidate.canonicalSerialization);
    expect(JSON.stringify(resolveActiveOperationalGraphProjection(repeated.investigation))).toBe(JSON.stringify(manifold));
    expect(createOperationalGraphFingerprint(repeated.investigation.revisions[0]!.manifold.graph)).toBe(createOperationalGraphFingerprint(created.investigation.revisions[0]!.manifold.graph));
    expect(repeated.investigation.revisions[0]).toEqual(created.investigation.revisions[0]);

    const target = canonical.find(object => object.type === "EVENT" && object.provenance.sourceId === comparisonEventId);
    expect(target?.metadata.title).toBe("Nimitz Tic Tac Encounter");
    if (!target) throw new Error("System Canon comparison target E-TICTAC-2004 is unavailable.");
    workspaceRuntime.activateGuestCandidateInvestigation(created.investigation);
    expect(workspaceRuntime.getActiveMode()).toBe(WorkspaceMode.MANIFOLD);
    expect(workspaceRuntime.getSelection()).toBeUndefined();
    expect(manifold.centerNodeId).toBe(candidateId);
    workspaceRuntime.setSelection({ kind: WorkspaceSelectionKind.COMPARISON_TARGET, eventId: comparisonEventId, knowledgeObjectId: target.identity.id });

    const executeSpy = vi.spyOn(ResolveRuntime.prototype, "execute");
    render(providers(createElement("div", null,
      createElement(ResolveStateProbe, { onState: state => { observedResolveState = state; } }), createElement(ManifoldProjectionStatus), createElement(ManifoldToolbar, { onAction: () => undefined }))));
    await userEvent.click(screen.getByRole("button", { name: "COMPUTE RELATIONSHIPS" }));
    await waitFor(() => expect(screen.getAllByText("RESULT CURRENT").length).toBeGreaterThan(0));
    expect(executeSpy).toHaveBeenCalledTimes(1);
    const resolveResult = executeSpy.mock.results[0]?.value;
    if (!resolveResult) throw new Error("Production Resolve command returned no result.");
    expect(resolveResult.candidateEvaluations.evaluations).toHaveLength(6);
    expect(observedResolveState?.currentExecution?.result?.executionId).toBe(resolveResult.executionId);
    expect(screen.getByText(/EVENT MANIFOLD: GRAPH/)).toBeTruthy();

    const selected = workspaceRuntime.getSelection();
    expect(selected?.kind).toBe(WorkspaceSelectionKind.CANDIDATE);
    if (selected?.kind !== WorkspaceSelectionKind.CANDIDATE) throw new Error("Production Resolve command did not publish a candidate selection.");
    const intelligence = resolveCandidateIntelligenceCollection(resolveResult.candidateEvaluations.evaluations).intelligence;
    const pair = resolveComparePairProjection(created.candidate.candidateId, knowledge, selected, intelligence);
    expect(pair.status).toBe("READY");
    if (pair.status !== "READY") throw new Error(`COMPARE pair was not READY: ${pair.status}`);
    expect(pair.focusedEventKnowledgeObjectId).toBe(candidateId);
    expect(pair.comparisonEventId).toBe(comparisonEventId);
    expect(pair.comparisonEventKnowledgeObjectId).toBe(target.identity.id);

    const evaluation = resolveResult.candidateEvaluations.evaluations.find(item => item.identity.evaluationId === pair.evaluationId);
    const matrixPair = resolveResult.manifold.similarityMatrix.pairs.find(item => item.leftKnowledgeObjectId === pair.leftKnowledgeObjectId && item.rightKnowledgeObjectId === pair.rightKnowledgeObjectId);
    expect(evaluation).toBeTruthy();
    expect(matrixPair).toBeTruthy();
    if (!evaluation || !matrixPair) throw new Error("Exact Resolve pair lineage is unavailable to LAYERS.");
    const subjectIds = [pair.leftKnowledgeObjectId, pair.rightKnowledgeObjectId].sort();
    const pairId = `canonical-pair:${pair.leftKnowledgeObjectId}:${pair.rightKnowledgeObjectId}`;
    const laboratoryInput = {
      scope: { investigationId: created.investigation.id, workspaceId: created.investigation.workspace.id, focusedEventId: candidateId, comparisonEventId, subjectIds, compareOrigin: { pairId, candidateId: pair.candidateId, evaluationId: pair.evaluationId }, resolveOrigin: { executionId: resolveResult.executionId } },
      baseline: { investigationId: created.investigation.id, workspaceId: created.investigation.workspace.id, subjectIds, canonicalStartingLayerIds: [], startingResolveExecutionId: resolveResult.executionId, temporalContext: undefined, investigativeScale: undefined },
      armedLayers: [], temporalContext: undefined, investigativeScale: undefined, researcherConfiguration: {},
    };
    const layersRuntime = new LayersExperimentRuntime();
    layersRuntime.establish({ scope: laboratoryInput.scope, baseline: laboratoryInput.baseline, armedLayers: { layerIds: [] } });
    expect(layersRuntime.getState().status).toBe("READY");
    const layersResult = projectLayersExperimentalPair({ executionId: "layers:case-39", laboratoryInput, investigationId: created.investigation.id, sourceKnowledgeObjectId: pair.leftKnowledgeObjectId, targetKnowledgeObjectId: pair.rightKnowledgeObjectId, caseAKnowledgeObjectId: pair.caseAKnowledgeObjectId, caseBKnowledgeObjectId: pair.caseBKnowledgeObjectId, knowledgeObjects: knowledge, pair: matrixPair, evaluation, baselineLayers: [], experimentalLayers: [] });
    const layerEndpoints = layersResult.experimentalManifoldSnapshot.evaluatorInput.endpoints;
    expect(layerEndpoints.find(endpoint => endpoint.subjectRole === "CASE_A")?.knowledgeObjectId).toBe(candidateId);
    expect(layerEndpoints.find(endpoint => endpoint.subjectRole === "CASE_B")?.knowledgeObjectId).toBe(target.identity.id);
    expect(layersResult.experimentalManifoldSnapshot.createsCanonicalKnowledgeRelationship).toBe(false);

    const guestNodeTypes = [...new Set(guestObjects.map(object => object.type))].sort();
    const expectedGuestNodeTypes = ["ARTIFACT", "EVENT", "HYPOTHESIS", "LOCATION", "NARRATIVE"];
    const missingTypes = expectedGuestNodeTypes.filter(type => !guestNodeTypes.includes(type));
    const guestEdges = topology.edges.filter(edge => guestObjects.some(object => object.identity.id === edge.source || object.identity.id === edge.target));
    const mappedRelationships = guestEdges.map(edge => `${edge.source} -[${edge.relationshipType}]-> ${edge.target}`);
    const expectedRelationshipTypes = ["INVESTIGATES", "LOCATED_AT", "REFERENCES"];
    const missingRelationships = expectedRelationshipTypes.filter(type => !guestEdges.some(edge => edge.relationshipType === type));
    expect(guestEdges.some(edge => edge.source === candidateId && edge.target === location?.identity.id && edge.relationshipType === "LOCATED_AT")).toBe(true);
    expect(artifacts.every(artifact => guestEdges.some(edge => edge.source === candidateId && edge.target === artifact.identity.id && edge.relationshipType === "REFERENCES"))).toBe(true);
    expect(guestEdges.some(edge => edge.source === hypothesis?.identity.id && edge.target === candidateId && edge.relationshipType === "INVESTIGATES")).toBe(true);
    const relationshipLineage = guestObjects.flatMap(object => (object.payload as GuestCandidateKnowledgePayload).relationshipLineage);
    const relationshipIds = guestObjects.flatMap(object => object.relationships.map(relationship => relationship.id)).sort();
    const lineageRelationshipIds = relationshipLineage.map(item => item.relationshipId).sort();
    const missingLineageRequirements = [
      ...guestObjects.filter(object => (object.payload as GuestCandidateKnowledgePayload).lineage.sourceSpans.length === 0).map(object => `object:${object.identity.id}`),
      ...relationshipIds.filter(id => !lineageRelationshipIds.includes(id)).map(id => `relationship:${id}`),
    ];
    expect(lineageRelationshipIds).toEqual(relationshipIds);

    const contentRecord = content as unknown as Record<string, { state?: string; value?: unknown; seconds?: unknown } | string>;
    const suppliedContentFields = Object.entries(contentRecord).filter(([field, envelope]) => field !== "schemaVersion" && typeof envelope === "object" && envelope.state === "SUPPLIED").map(([field]) => field).sort();
    const topologyMaterializedFields = [...new Set(guestObjects.filter(object => object.identity.id !== candidateId).flatMap(object => (object.payload as GuestCandidateKnowledgePayload).sourceFields))].sort();
    const metadataOnlyFields = suppliedContentFields.filter(field => !topologyMaterializedFields.includes(field as keyof typeof content));
    const exactPreservedFields = suppliedContentFields.filter(field => field !== "privacyClassification");
    const normalizedFields = content.privacyClassification.state === "SUPPLIED" && content.privacyClassification.value !== supplied.privacyClassification ? ["privacyClassification"] : [];
    const unsupportedProjections = [
      ...(content.witnessCount.state === "SUPPLIED" && observers.length === 0 ? ["anonymous aggregate observers: EVENT metadata only"] : []),
      ...(supplied.sensorContext.includes("have not been collected") ? ["external sensor records"] : []),
      ...(artifacts.some(artifact => (artifact.payload as GuestCandidateKnowledgePayload).representation?.inspected === false) ? ["individual evidence-instance metadata"] : []),
      ...((hypothesis?.payload as GuestCandidateKnowledgePayload).truthConfidence === null ? ["validated hypothesis relationship"] : []),
    ];
    expect(JSON.stringify(canonical)).toBe(canonBefore);
    expect(created.candidate.knowledgeObject).toEqual(guestEvent);
    expect(created.candidate.knowledgeObject.relationships.length).toBeGreaterThan(0);
    expect(manifold.edges.some(edge => [edge.source, edge.target].includes(candidateId) && [edge.source, edge.target].includes(target.identity.id))).toBe(false);
    expect(topology.edges.some(edge => edge.source.startsWith("guest-candidate:") && edge.target.startsWith("system:"))).toBe(false);

    console.log("\n=== CASE #39 KNOWLEDGE OBJECT INVENTORY ===");
    guestObjects.forEach(object => console.log(JSON.stringify({ identifier: object.identity.id, type: object.type, label: object.metadata.title, provenanceClass: object.provenance.sourceType, epistemicStatus: object.status, source: object.provenance.sourceId, author: object.metadata.author ?? null })));
    console.log("=== CASE #39 EDGE INVENTORY ===");
    guestEdges.forEach(edge => console.log(JSON.stringify({ source: edge.source, predicate: edge.relationshipType, target: edge.target, provenance: edge.metadata })));
    if (guestEdges.length === 0) console.log("(none: the guest Candidate Knowledge EVENT owns no explicit relationships)");
    console.log("=== CASE #39 AUTOMATED MANIFOLD ACCEPTANCE ===");
    console.log(`supplied fields: ${logicalFieldNames.join(", ")}`);
    console.log(`preserved payload fields (${exactPreservedFields.length} exact): ${exactPreservedFields.join(", ")}`);
    console.log(`normalized fields (${normalizedFields.length}): ${normalizedFields.join(", ")}`);
    console.log(`topology-materialized fields (${topologyMaterializedFields.length}): ${topologyMaterializedFields.join(", ")}`);
    console.log(`metadata-only fields (${metadataOnlyFields.length}): ${metadataOnlyFields.join(", ")}`);
    console.log(`unsupported semantic projections: ${unsupportedProjections.join(", ")}`);
    console.log(`MANIFOLD node count: ${manifold.statistics.nodeCount}`);
    console.log(`MANIFOLD edge count: ${manifold.statistics.edgeCount}`);
    console.log(`node types: ${[...new Set(manifold.nodes.map(node => node.type))].sort().join(", ")}`);
    console.log(`missing expected node types: ${missingTypes.join(", ") || "none"}`);
    console.log(`mapped relationships: ${mappedRelationships.join(", ") || "none"}`);
    console.log(`missing expected relationships: ${missingRelationships.join("; ") || "none"}`);
    console.log(`missing lineage requirements: ${missingLineageRequirements.join("; ") || "none"}`);
    console.log(`guest node count: ${guestObjects.length}`);
    console.log(`guest edge count: ${guestEdges.length}`);
    console.log(`Resolve executions: ${executeSpy.mock.calls.length}`);
    console.log(`Resolve candidates: ${resolveResult.candidateEvaluations.evaluations.length}`);
    console.log(`Resolve synchronized: ${screen.getByText(/EVENT MANIFOLD: GRAPH/).textContent?.includes("SYNCHRONIZED") === true}`);
    console.log("LAYERS pair preserved: true");
    console.log("Canon mutations: 0");
    const strictViolations = [...missingTypes, ...missingRelationships, ...missingLineageRequirements];
    console.log(`final ${strict ? "acceptance" : "characterization"} result: ${strict && strictViolations.length > 0 ? "FAIL" : "PASS"}`);

    if (strict) {
      expect({ missingTypes, missingRelationships, missingLineageRequirements }, "Structured mapping gaps").toEqual({ missingTypes: [], missingRelationships: [], missingLineageRequirements: [] });
    }
  });
});
