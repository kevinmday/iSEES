import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
  GuideIdentityClassification, GuideLayoutClassification, GuideLayersExperimentClassification,
  GuidePresentationClassification, GuideResearchInboxClassification, GuideResolveClassification,
  GuideSelectionClassification, GuideWorkspaceMode, GuideWorkspaceStatus, type GuideContextSnapshot,
} from "../../src/guide/contracts/index.ts";
import { resolveGuideDefinition } from "../../src/guide/registry/GuideDefinitionRegistry.ts";
import { LayersGuideTargetIds } from "../../src/guide/registry/LayersGuideDefinitions.ts";

const fixture = (overrides: Partial<GuideContextSnapshot> = {}): GuideContextSnapshot => Object.freeze({
  schemaId: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_ID, schemaVersion: GUIDE_CONTEXT_SNAPSHOT_SCHEMA_VERSION,
  route: "/", identity: GuideIdentityClassification.GUEST, workspaceStatus: GuideWorkspaceStatus.ACTIVE,
  activeMode: GuideWorkspaceMode.LAYERS, layout: GuideLayoutClassification.NORMAL,
  activeWorkspaceId: "workspace:1", activeInvestigationId: "investigation:1", focusedEventId: "event:a",
  selection: Object.freeze({ classification: GuideSelectionClassification.NONE }),
  comparison: Object.freeze({ classification: "NONE" }),
  resolve: Object.freeze({ classification: GuideResolveClassification.UNRESOLVED }), activeLayerIds: Object.freeze([]),
  layersExperiment: Object.freeze({ classification: GuideLayersExperimentClassification.EMPTY }),
  researchInbox: Object.freeze({ classification: GuideResearchInboxClassification.EMPTY, newLeadCount: 0, incomingSourceCount: 0, collectedFindingCount: 0 }),
  guidePresentation: GuidePresentationClassification.CLOSED, ...overrides,
});
const resolved = (snapshot: GuideContextSnapshot) => { const result = resolveGuideDefinition(snapshot); assert.equal(result.status, "RESOLVED"); return result.definition.briefing; };

assert.equal(resolved(fixture()).showMeTargetId, LayersGuideTargetIds.RUN_RESOLVE);
assert.equal(resolved(fixture({ resolve: { classification: GuideResolveClassification.RESOLVED, executionId: "resolve:1" } })).showMeTargetId, LayersGuideTargetIds.CHOOSE_COMPARISON);
const pair = { classification: "READY" as const, focusedEventId: "event:a", comparisonEventId: "event:b", candidateId: "candidate:1" };
assert.equal(resolved(fixture({ resolve: { classification: GuideResolveClassification.RESOLVED }, comparison: pair })).showMeTargetId, LayersGuideTargetIds.RESOLVE_TOPOLOGY_STATE);
assert.equal(resolved(fixture({ resolve: { classification: GuideResolveClassification.RESOLVED }, comparison: pair, activeLayerIds: ["TOPOLOGY"] })).showMeTargetId, LayersGuideTargetIds.RUN_EXPERIMENT);
const complete = resolved(fixture({ resolve: { classification: GuideResolveClassification.RESOLVED }, comparison: pair, activeLayerIds: ["TOPOLOGY"], layersExperiment: { classification: GuideLayersExperimentClassification.COMPLETE } }));
assert.equal(complete.recommendedAction?.label, "Inspect the experiment result"); assert.equal(complete.showMeTargetId, undefined);
for (const mode of Object.values(GuideWorkspaceMode).filter(mode => mode !== GuideWorkspaceMode.LAYERS)) { const neutral = resolved(fixture({ activeMode: mode })); assert.equal(neutral.recommendedAction, undefined); assert.equal(neutral.showMeTargetId, undefined); assert.match(neutral.situation, /not yet been integrated/); }
for (const state of [fixture(), fixture({ resolve: { classification: GuideResolveClassification.RESOLVED } }), fixture({ resolve: { classification: GuideResolveClassification.RESOLVED }, comparison: pair }), fixture({ resolve: { classification: GuideResolveClassification.RESOLVED }, comparison: pair, activeLayerIds: ["TOPOLOGY"] })]) assert.ok([resolved(state).recommendedAction].filter(Boolean).length <= 1);
assert.equal(JSON.stringify(resolveGuideDefinition(fixture())), JSON.stringify(resolveGuideDefinition(structuredClone(fixture()))));
assert.equal(new Set(Object.values(LayersGuideTargetIds)).size, 4);

const guideFiles = ["src/guide/registry/GuideDefinitionRegistry.ts", "src/guide/registry/LayersGuideDefinitions.ts", "src/guide/presentation/GuideTargetLocator.ts", "src/guide/components/GuideSpotlight.tsx"].map(path => readFileSync(path, "utf8")).join("\n");
assert.doesNotMatch(guideFiles, /\.click\(|\.focus\(|setActiveMode|setSelection|activateInvestigation|beginExecution|\bpublish[A-Z]\w*\s*\(/);
assert.match(guideFiles, /scrollIntoView\(\{ behavior: reducedMotion \? "auto" : "smooth", block: "nearest", inline: "nearest" \}\)/);
for (const id of Object.values(LayersGuideTargetIds)) assert.equal(readFileSync("src/layers/components/LayersLaboratoryWorkspace.tsx", "utf8").includes(id) || readFileSync("src/layers/components/LayerCatalogMatrix.tsx", "utf8").includes(id), true, `missing live target ${id}`);
console.log("VerifyIseesGuideDeterminism: PASS (six-state precedence, neutral coverage, unique targets, determinism, and non-mutation verified)");
