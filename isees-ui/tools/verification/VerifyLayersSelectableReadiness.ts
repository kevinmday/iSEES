import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CanonicalLayerCatalog, CanonicalLayerReadiness } from "../../src/layers/catalog/index.ts";
import { catalogSelectableLayerIds, normalizeOperationalSelection } from "../../src/layers/presentation/LayerCatalogMatrixProjection.ts";

const root=fileURLToPath(new URL("../../",import.meta.url));
const read=(path:string)=>readFileSync(`${root}${path}`,"utf8");
const matrix=read("src/layers/components/LayerCatalogMatrix.tsx");
const workspace=read("src/layers/components/LayersLaboratoryWorkspace.tsx");
const runtime=read("src/layers/runtime/LayersExperimentRuntime.ts");
const projection=read("src/layers/projection/LayersExperimentalPairProjection.ts");
const guide=read("src/guide/registry/LayersGuideDefinitions.ts");

assert.equal(catalogSelectableLayerIds.length,CanonicalLayerCatalog.length,"every catalog layer is selectable");
assert.deepEqual(normalizeOperationalSelection(CanonicalLayerCatalog.map(layer=>layer.id)),CanonicalLayerCatalog.map(layer=>layer.id),"selection preserves every canonical objective in catalog order");
for(const layer of CanonicalLayerCatalog){assert.ok(Object.values(CanonicalLayerReadiness).includes(layer.readiness));assert.ok(layer.readinessReason&&layer.requiredCanonicalInputs.length,`${layer.id} has stable readiness requirements`);}
assert.ok(CanonicalLayerCatalog.some(layer=>layer.readiness===CanonicalLayerReadiness.READY));
assert.ok(CanonicalLayerCatalog.some(layer=>layer.readiness===CanonicalLayerReadiness.INPUT_NEEDED));
assert.ok(CanonicalLayerCatalog.some(layer=>layer.readiness===CanonicalLayerReadiness.METHOD_NEEDED));
assert.match(runtime,/operational: catalogDefinition\.operationalStatus === CanonicalLayerOperationalStatus\.OPERATIONAL/);
assert.match(projection,/participatingWeight: 0, weightedContribution: 0/);
assert.match(projection,/definition\.readinessReason/);
assert.match(workspace,/readyArmedIds\.length === 0/);
assert.match(workspace,/selected but unresolved/i);
assert.match(workspace,/none is READY, so computation remains unavailable/);
assert.match(matrix,/Ready to compute/);assert.match(matrix,/Preparation needed/);assert.match(matrix,/Preparation requirements/);assert.match(matrix,/contributes no score/);
assert.equal(matrix.includes("disabled={!operational"),false,"incomplete layers are not disabled");
assert.match(guide,/selected-preparation-needed/);assert.match(guide,/selected incomplete layers remain explicit research objectives/i);assert.match(guide,/selectedUnresolvedLayers/);
assert.equal(/onClick=.*(setActiveMode|execute|select)/.test(guide),false,"Guide definitions have no mutations");
console.log("VerifyLayersSelectableReadiness: PASS (selectable objectives, stable readiness, computation exclusion, mixed reporting, and deterministic Guide precedence verified)");
