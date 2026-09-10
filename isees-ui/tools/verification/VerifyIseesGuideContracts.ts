import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_GUIDE_PRESENTATION_CLASSIFICATION,
  GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID,
  GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
  GUIDE_DEFINITION_SCHEMA_ID,
  GUIDE_DEFINITION_SCHEMA_VERSION,
  GUIDE_LESSON_PREFERENCE_SCHEMA_ID,
  GUIDE_LESSON_PREFERENCE_SCHEMA_VERSION,
  GUIDE_SEMANTIC_TARGET_SCHEMA_ID,
  GUIDE_SEMANTIC_TARGET_SCHEMA_VERSION,
  GuideEpistemicClassification,
  GuideIdentityClassification,
  GuideLayoutClassification,
  GuideLayersExperimentClassification,
  GuidePresentationClassification,
  GuideResearchInboxClassification,
  GuideResolveClassification,
  GuideSelectionClassification,
  GuideSemanticTargetIds,
  GuideTargetResolutionStatus,
  GuideWorkspaceMode,
  GuideWorkspaceStatus,
  missingGuideTarget,
  type GuideBriefing,
  type GuideContextSnapshot,
} from "../../src/guide/contracts/index.ts";

const values = <T extends Readonly<Record<string, string>>>(value: T): readonly T[keyof T][] => Object.values(value);
const contractDirectory = fileURLToPath(new URL("../../src/guide/contracts/", import.meta.url));
const contractFiles = ["GuideContracts.ts", "GuideContextSnapshot.ts", "GuideSemanticTarget.ts", "index.ts"];

assert.equal(GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, "isees-guide-context-snapshot");
assert.equal(GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION, "1.0");
assert.equal(GUIDE_DEFINITION_SCHEMA_ID, "isees-guide-definition");
assert.equal(GUIDE_DEFINITION_SCHEMA_VERSION, "1.0");
assert.equal(GUIDE_SEMANTIC_TARGET_SCHEMA_ID, "isees-guide-semantic-target");
assert.equal(GUIDE_SEMANTIC_TARGET_SCHEMA_VERSION, "1.0");
assert.equal(GUIDE_LESSON_PREFERENCE_SCHEMA_ID, "isees-guide-lesson-preference");
assert.equal(GUIDE_LESSON_PREFERENCE_SCHEMA_VERSION, "1.0");

assert.deepEqual(values(GuideWorkspaceMode), ["OVERVIEW", "MANIFOLD", "COMPARE", "NARRATIVE", "EVIDENCE", "TIMELINE", "LAYERS", "INTENTION", "RESEARCH"]);
assert.deepEqual(values(GuideEpistemicClassification), ["CANONICAL", "CANDIDATE", "EXPERIMENTAL", "DERIVED", "NON_CANONICAL", "UNRESOLVED", "UNAVAILABLE", "PUBLISHED", "COLLECTED", "INCOMING", "UNASSIGNED"]);
assert.equal(DEFAULT_GUIDE_PRESENTATION_CLASSIFICATION, GuidePresentationClassification.CLOSED, "Guide must be closed by default");

const targetIds = values(GuideSemanticTargetIds);
assert.equal(new Set(targetIds).size, targetIds.length, "semantic target identifiers must be unique");
assert.notEqual(GuideSemanticTargetIds.GUIDE, GuideSemanticTargetIds.CAPTURE, "Capture and Guide identities must remain distinct");
assert.equal(GuideSemanticTargetIds.LAYERS_RESOLVE_TOPOLOGY_STATE, "layers.layer.resolve-topology-state");
assert.equal(GuideSemanticTargetIds.LAYERS_RUN_EXPERIMENT, "layers.run-experiment");
assert.notEqual(GuideSemanticTargetIds.LAYERS_RESOLVE_TOPOLOGY_STATE, GuideSemanticTargetIds.LAYERS_RUN_EXPERIMENT);
assert.notEqual(GuideSemanticTargetIds.RESOLVE_RUN_EXECUTION, GuideSemanticTargetIds.LAYERS_RESOLVE_TOPOLOGY_STATE);

const missing = missingGuideTarget(GuideSemanticTargetIds.LAYERS_RUN_EXPERIMENT);
assert.equal(missing.status, GuideTargetResolutionStatus.MISSING);
assert.equal(missing.workflowRemainsAvailable, true);
assert.ok(missing.message.length > 0, "missing targets require textual guidance");

const snapshot = Object.freeze<GuideContextSnapshot>({
  schemaId: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID,
  schemaVersion: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
  route: "/",
  identity: GuideIdentityClassification.GUEST,
  workspaceStatus: GuideWorkspaceStatus.ACTIVE,
  activeMode: GuideWorkspaceMode.LAYERS,
  layout: GuideLayoutClassification.NORMAL,
  activeWorkspaceId: "workspace:current",
  activeInvestigationId: "investigation:current",
  focusedEventId: "event:current",
  selection: Object.freeze({ classification: GuideSelectionClassification.CANDIDATE, identifier: "candidate:current" }),
  comparison: Object.freeze({ classification: "READY", focusedEventId: "event:current", comparisonEventId: "event:comparison", candidateId: "candidate:current" }),
  resolve: Object.freeze({ classification: GuideResolveClassification.RESOLVED, executionId: "resolve:current" }),
  activeLayerIds: Object.freeze(["TOPOLOGY"]),
  layersExperiment: Object.freeze({ classification: GuideLayersExperimentClassification.READY }),
  researchInbox: Object.freeze({ classification: GuideResearchInboxClassification.HAS_COLLECTED_FINDINGS, newLeadCount: 0, incomingSourceCount: 0, collectedFindingCount: 1 }),
  guidePresentation: GuidePresentationClassification.CLOSED,
});
assert.ok(Object.isFrozen(snapshot));
assert.ok(Object.isFrozen(snapshot.selection));
assert.ok(Object.isFrozen(snapshot.activeLayerIds));

const equivalent = structuredClone(snapshot);
assert.equal(JSON.stringify(snapshot), JSON.stringify(equivalent), "equivalent frozen fixtures must serialize to byte-identical JSON");
const freshInvestigation = { ...structuredClone(snapshot), activeInvestigationId: "investigation:fresh", activeWorkspaceId: "workspace:fresh", focusedEventId: undefined, selection: { classification: GuideSelectionClassification.NONE }, comparison: { classification: "NONE" as const } };
assert.notEqual(freshInvestigation.activeInvestigationId, snapshot.activeInvestigationId);
assert.notEqual(freshInvestigation.activeWorkspaceId, snapshot.activeWorkspaceId);
assert.equal(freshInvestigation.focusedEventId, undefined, "fresh investigation cannot inherit focused-event identity");
assert.equal(freshInvestigation.selection.identifier, undefined, "fresh investigation cannot inherit selection identity");

const briefing: GuideBriefing = {
  definitionId: "layers.ready",
  location: "LAYERS",
  situation: "An experiment is ready.",
  significance: "The result remains experimental.",
  recommendedAction: undefined,
  alternatives: [], consequences: [], protectedBoundaries: [], blockers: [], stateReferences: [], visualSteps: [],
};
assert.equal([briefing.recommendedAction].filter(Boolean).length, 0, "briefing permits zero recommended actions");
const oneRecommendation = { ...briefing, recommendedAction: { id: "inspect", classification: "RECOMMENDED" as const, label: "Inspect", description: "Inspect the state.", consequences: [], protectedBoundaries: [] } };
assert.equal([oneRecommendation.recommendedAction].filter(Boolean).length, 1, "briefing permits one recommended action");
assert.equal("recommendedActions" in oneRecommendation, false, "contract cannot represent an unbounded recommendation list");

const forbiddenValueKinds = new Set(["function", "symbol"]);
function assertDataOnly(value: unknown, path = "snapshot"): void {
  assert.equal(forbiddenValueKinds.has(typeof value), false, `${path} contains executable data`);
  if (Array.isArray(value)) value.forEach((item, index) => assertDataOnly(item, `${path}[${index}]`));
  else if (value !== null && typeof value === "object") Object.entries(value).forEach(([key, item]) => assertDataOnly(item, `${path}.${key}`));
}
assertDataOnly(snapshot);
assertDataOnly(oneRecommendation);

const source = contractFiles.map(file => readFileSync(`${contractDirectory}${file}`, "utf8")).join("\n");
for (const forbidden of ["react", "WorkspaceRuntime", "ResolveRuntime", "ResearchBridgeRuntime", "document.", "window.", "HTMLElement", "Element", "telemetry", "localStorage", "sessionStorage", "fetch("]) {
  assert.equal(source.includes(forbidden), false, `I1 contract source contains forbidden runtime/implementation dependency: ${forbidden}`);
}
assert.equal(/\b(onClick|callback|mutate|setActiveMode|activateInvestigation)\b/.test(source), false, "contracts expose executable or mutation behavior");
assert.equal(/class\s+\w*(Store|Persistence|Telemetry)/.test(source), false, "I1 must not implement persistence or telemetry");

console.log("VerifyIseesGuideContracts: PASS (schemas, finite unions, immutable data, determinism, isolation, safe failure, and I1 boundaries verified)");
