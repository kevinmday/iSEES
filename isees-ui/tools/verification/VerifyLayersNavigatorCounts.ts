import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolveLayersNavigatorCounts } from "../../src/layers/components/LayersNavigatorCounts";
import { ArmedLayerClassification } from "../../src/layers/runtime/LayersExperimentRuntimeTypes";
import type { ArmedLayer } from "../../src/layers/runtime/LayersExperimentRuntimeTypes";
import { LayersOperationalMappingStatus, LayersPairAvailability } from "../../src/layers/projection/LayersExperimentalPairProjectionTypes";
import type { LayersExperimentalPairProjection, LayersLayerContribution } from "../../src/layers/projection/LayersExperimentalPairProjectionTypes";
import { SystemCanonLayers } from "../../src/manifold/layers/systemCanonLayers";

const canonical = (id: keyof typeof SystemCanonLayers): ArmedLayer => ({ id, classification: ArmedLayerClassification.CANONICAL, operational: true, canonicalDefinition: SystemCanonLayers[id] });
const contribution = (layerId: string, mapped: boolean, available: boolean): LayersLayerContribution => ({ layerId, classification: ArmedLayerClassification.CANONICAL, operationalMappingStatus: mapped ? LayersOperationalMappingStatus.MAPPED : LayersOperationalMappingStatus.UNAVAILABLE, availability: available ? LayersPairAvailability.AVAILABLE : LayersPairAvailability.UNAVAILABLE, participatingWeight: 0, weightedContribution: 0, sourceEvaluationId: "evaluation:test" });
const projection = (ids: readonly string[], contributions: readonly LayersLayerContribution[]) => ({
  provenance: { experimentalLayerIds: ids }, experimental: { contributions },
}) as LayersExperimentalPairProjection;

assert.deepEqual(resolveLayersNavigatorCounts([canonical("TEMPORAL")]), { armed: 1, mapped: 0, unavailable: 1 }, "TEMPORAL-only is armed but unavailable/unmapped before execution");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("NARRATIVE")]), { armed: 1, mapped: 1, unavailable: 0 }, "supported registered mapping counts before execution");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("NARRATIVE"), canonical("TEMPORAL")]), { armed: 2, mapped: 1, unavailable: 1 }, "mixed supported plus TEMPORAL counts only armed layers");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("NARRATIVE"), canonical("NARRATIVE")]), { armed: 1, mapped: 1, unavailable: 0 }, "duplicate identities cannot inflate armed or mapped counts");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("OBSERVABILITY")], projection(["OBSERVABILITY"], [contribution("OBSERVABILITY", true, false)])), { armed: 1, mapped: 1, unavailable: 1 }, "completed projection refines mapped evidence to unavailable without treating it as unmapped");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("OBSERVABILITY")], projection(["OBSERVABILITY"], [contribution("OBSERVABILITY", true, true)])), { armed: 1, mapped: 1, unavailable: 0 }, "completed available evidence participates");
assert.deepEqual(resolveLayersNavigatorCounts([canonical("TEMPORAL")], projection(["NARRATIVE"], [contribution("NARRATIVE", true, true)])), { armed: 1, mapped: 0, unavailable: 1 }, "stale projection cannot override current armed configuration");

const navigator = readFileSync("src/layers/components/LayersLaboratoryNavigator.tsx", "utf8");
const resolver = readFileSync("src/layers/components/LayersNavigatorCounts.ts", "utf8");
assert(navigator.includes("resolveLayersNavigatorCounts") && navigator.includes("Unavailable / unmapped"));
assert(!navigator.includes("filter(layer => layer.operational).length"), "registered operational status is not treated as computational mapping");
const changed = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
assert.deepEqual(changed.filter(path => /^src\/layers\/(runtime|projection|research|persistence)\//i.test(path)), [], "LAYERS-owned runtime, projection, Research, and persistence semantics are unchanged");
for (const path of ["src/manifold/layers/systemCanonLayers.ts", "src/resolve/engine/ResolveEngine.ts"]) assert(!changed.some(item => item.endsWith(path)), `${path} canonical semantics are unchanged`);
assert(!resolver.match(/similarity|\.score|score\s*[!=<>]/i), "availability is not inferred from a numeric score");
console.log("PASS VerifyLayersNavigatorCounts");
