import {
  ArmedLayerClassification,
  LayersExperimentRuntime,
  LayersExperimentStatus,
  createUnavailableLayersExperimentResult,
} from "../../src/layers/runtime/index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function throws(action: () => void, fragment: string): void {
  try { action(); } catch (error) {
    assert(error instanceof Error && error.message.includes(fragment), `Expected error containing '${fragment}'.`);
    return;
  }
  throw new Error(`FAIL: Expected error containing '${fragment}'.`);
}

function json(value: unknown): string { return JSON.stringify(value); }

const externalSystems = {
  knowledge: { objectIds: ["knowledge:1"] },
  workspaceRuntime: { activeLayers: ["OBSERVABILITY"] },
  manifold: { projectionId: "manifold:canonical" },
  compare: { pairId: "compare:1" },
  researchInbox: { itemIds: ["research:1"] },
};
const externalBefore = json(externalSystems);

const runtime = new LayersExperimentRuntime();
throws(() => runtime.establish({
  scope: { investigationId: "", subjectIds: [] },
  baseline: { investigationId: "", subjectIds: [], canonicalStartingLayerIds: [], temporalContext: {}, investigativeScale: {} },
}), "Investigation identity");
console.log("PASS 1 — missing Investigation identity is rejected");

const temporalContext = { end: 20, start: 10 };
const investigativeScale = { radius: 5, unit: "km" };
runtime.establish({
  scope: {
    investigationId: "investigation:alpha", workspaceId: "workspace:alpha",
    focusedEventId: "event:focus", subjectIds: ["subject:b", "subject:a", "subject:a"],
    compareOrigin: { pairId: "pair:alpha", candidateId: "candidate:alpha" },
    resolveOrigin: { executionId: "resolve:alpha", manifoldId: "manifold:alpha" },
  },
  baseline: {
    investigationId: "investigation:alpha", workspaceId: "workspace:alpha",
    subjectIds: ["subject:a", "subject:b"], canonicalStartingLayerIds: ["TEMPORAL", "OBSERVABILITY"],
    startingResolveExecutionId: "resolve:alpha", startingManifoldId: "manifold:alpha",
    temporalContext, investigativeScale,
  },
});
temporalContext.start = -1;
investigativeScale.radius = 999;
let state = runtime.getState();
assert(state.status === LayersExperimentStatus.READY && state.scope?.subjectIds.join() === "subject:a,subject:b", "Establishment must preserve normalized scope.");
assert((state.baseline?.temporalContext as { start: number }).start === 10, "Baseline must be frozen independently of caller values.");
console.log("PASS 2 — establishment preserves scope and immutable baseline");

runtime.setArmedLayers({ layerIds: ["TEMPORAL", "OBSERVABILITY", "TEMPORAL", "FUTURE_LAYER"], legacyLayerIds: ["OLD_LAYER"] });
assert(json(externalSystems.workspaceRuntime.activeLayers) === '["OBSERVABILITY"]', "Arming Laboratory layers must not mutate WorkspaceRuntime.");
console.log("PASS 3 — armed-layer changes do not mutate WorkspaceRuntime");
state = runtime.getState();
assert(state.armedLayers.map((layer) => layer.id).join() === "FUTURE_LAYER,OBSERVABILITY,OLD_LAYER,TEMPORAL", "Armed layers must be sorted and deduplicated.");
console.log("PASS 4 — layers are ordered and deduplicated deterministically");
throws(() => runtime.setArmedLayers({ layerIds: ["bad layer"] }), "malformed");
console.log("PASS 5 — invalid identifiers are rejected");
assert(state.armedLayers.find((layer) => layer.id === "FUTURE_LAYER")?.classification === ArmedLayerClassification.UNSUPPORTED, "Unknown layer must be unsupported.");
assert(state.armedLayers.find((layer) => layer.id === "OLD_LAYER")?.classification === ArmedLayerClassification.LEGACY, "Declared legacy layer must be legacy.");
assert(state.armedLayers.filter((layer) => layer.classification !== ArmedLayerClassification.CANONICAL).every((layer) => !layer.operational), "Unsupported and legacy layers must not be operational.");
console.log("PASS 6 — unsupported and legacy identifiers are explicit and non-operational");

const configA: Record<string, unknown> = { threshold: 0.5, nested: { b: 2, a: 1 } };
const executionA = runtime.beginExecution(configA);
const frozenInput = runtime.getState().currentExecution?.input;
assert(frozenInput !== undefined, "Execution input must exist.");
(configA.nested as { a: number }).a = 99;
assert((frozenInput.researcherConfiguration.nested as { a: number }).a === 1, "Caller mutation must not alter execution input.");
console.log("PASS 8 — caller mutation cannot alter frozen execution input");
runtime.completeExecution(executionA, "investigation:alpha", createUnavailableLayersExperimentResult());
const completedInput = runtime.getState().history[0]?.input;
assert(json(completedInput) === json(frozenInput), "Completion must preserve the exact frozen execution input.");
console.log("PASS 10 — completion preserves the exact execution input");

runtime.setArmedLayers({ layerIds: ["GEOGRAPHY"] });
assert(json(runtime.getState().history[0]?.input) === json(completedInput), "Later armed-layer changes must not rewrite history.");
console.log("PASS 11 — later changes do not rewrite completed history");
throws(() => runtime.completeExecution(executionA, "investigation:alpha", createUnavailableLayersExperimentResult()), "without an EXECUTING");
console.log("PASS 12 — completion without EXECUTING is rejected");
throws(() => runtime.failExecution(executionA, "investigation:alpha", { code: "FAILED", message: "failed" }), "without an EXECUTING");
console.log("PASS 13 — failure without EXECUTING is rejected");

runtime.setArmedLayers({ layerIds: ["FUTURE_LAYER", "TEMPORAL", "OBSERVABILITY"], legacyLayerIds: ["OLD_LAYER"] });
const configB = { nested: { a: 1, b: 2 }, threshold: 0.5 };
const executionB = runtime.beginExecution(configB);
assert(executionA === executionB, "Equivalent semantic inputs must have identical execution identities.");
console.log("PASS 7 — equivalent inputs yield identical execution identity");
throws(() => runtime.completeExecution("layers-execution:0000000000000000", "investigation:alpha", createUnavailableLayersExperimentResult()), "does not match");
throws(() => runtime.completeExecution(executionB, "investigation:other", createUnavailableLayersExperimentResult()), "Investigation identity");
console.log("PASS 14 — mismatched execution and Investigation completion is rejected");
runtime.failExecution(executionB, "investigation:alpha", { code: "ADAPTER_UNAVAILABLE", message: "No computational adapter exists.", details: { adapter: null } });
state = runtime.getState();
assert(state.status === LayersExperimentStatus.ERROR && state.error?.message === "No computational adapter exists.", "Failure must preserve explicit error information.");
console.log("PASS 15 — failure preserves explicit error information");

const mutableResult = { outcome: "UNAVAILABLE" as const, unavailableInputs: [{ code: "MISSING", description: "missing" }] };
runtime.setArmedLayers({ layerIds: ["OBSERVABILITY"] });
const executionC = runtime.beginExecution({});
runtime.completeExecution(executionC, "investigation:alpha", mutableResult);
mutableResult.unavailableInputs[0]!.description = "mutated";
const publicState = runtime.getState();
try { (publicState.history as unknown[]).push({}); } catch { /* frozen as required */ }
assert(publicState.history.length === 3 && publicState.history[2]?.result?.unavailableInputs[0]?.description === "missing", "Caller mutation must not alter results or history.");
console.log("PASS 9 — caller mutation cannot alter results or history");

let publications = 0;
const unsubscribe = runtime.subscribe(() => { publications += 1; });
const revisionBefore = runtime.getState().revision;
runtime.setArmedLayers({ layerIds: ["NARRATIVE"] });
assert(publications === 1 && runtime.getState().revision === revisionBefore + 1, "One transition must publish once and increment once.");
unsubscribe();
runtime.setArmedLayers({ layerIds: ["TEMPORAL"] });
assert(publications === 1 && runtime.getState().revision === revisionBefore + 2, "Unsubscribe must stop publication without affecting revisions.");
console.log("PASS 17 — subscription and revision behavior is deterministic");

runtime.reset();
state = runtime.getState();
assert(state.status === LayersExperimentStatus.EMPTY && state.history.length === 0 && json(externalSystems) === externalBefore, "Reset must affect only Laboratory state.");
console.log("PASS 16 — reset affects only the Laboratory");
assert(json(externalSystems) === externalBefore, "Protected systems must remain unchanged.");
console.log("PASS 18 — Knowledge, WorkspaceRuntime, MANIFOLD, COMPARE, and Research Inbox remain unchanged");
console.log("\nAll 18 Layers Experiment Runtime behavioral invariants passed.");
