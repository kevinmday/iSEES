import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CanonicalLayerCatalog, CanonicalLayerOperationalStatus } from "../../src/layers/catalog/index.ts";
import {
  CanonicalLayerEvaluatorRegistry, enumerateCanonicalLayerEvaluators, getCanonicalLayerEvaluator,
  validateCanonicalLayerEvaluatorRegistry,
} from "../../src/layers/evaluators/index.ts";
import type { CanonicalLayerEvaluatorRegistration } from "../../src/layers/evaluators/index.ts";
import { CanonicalCandidateEvaluationDimensionStatus } from "../../src/resolve/evaluation/CanonicalSimilarityCandidateEvaluationTypes.ts";
import { CanonicalFeatureDimension } from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes.ts";
import { projectCanonicalLayerEvaluatorInput } from "../../src/layers/evaluators/CanonicalLayerEvaluatorInputProjection.ts";

let count=0; const pass=(text:string)=>console.log(`PASS ${++count} — ${text}`);
const throws=(fn:()=>unknown, text:string)=>assert.throws(fn, new RegExp(text));
const expected=["OBSERVABILITY","NARRATIVE","GEOGRAPHY","INFRASTRUCTURE"];
assert.equal(CanonicalLayerEvaluatorRegistry.length,4); pass("registry contains exactly four evaluators");
assert.deepEqual(CanonicalLayerEvaluatorRegistry.map(x=>x.layerId),expected); pass("registered IDs are exactly the four proven operational layers");
assert.deepEqual(CanonicalLayerEvaluatorRegistry.map(x=>x.layerId),CanonicalLayerCatalog.filter(x=>x.operationalStatus===CanonicalLayerOperationalStatus.OPERATIONAL).map(x=>x.id)); pass("registry follows authoritative catalog order");
assert(CanonicalLayerEvaluatorRegistry.every(x=>CanonicalLayerCatalog.some(c=>c.id===x.layerId))); pass("every registered ID is canonical");
assert(CanonicalLayerEvaluatorRegistry.every(x=>CanonicalLayerCatalog.find(c=>c.id===x.layerId)?.operationalStatus==="OPERATIONAL")); pass("every registered layer is operational");
assert(CanonicalLayerEvaluatorRegistry.every(x=>CanonicalLayerCatalog.find(c=>c.id===x.layerId)?.researcherSelectable)); pass("every registered layer is researcher-selectable");
assert(CanonicalLayerEvaluatorRegistry.every(x=>CanonicalLayerCatalog.find(c=>c.id===x.layerId)?.evaluatorKey===x.evaluatorKey)); pass("evaluator keys match catalog metadata");
assert(CanonicalLayerEvaluatorRegistry.every(x=>CanonicalLayerCatalog.find(c=>c.id===x.layerId)?.evaluatorVersion===x.evaluatorVersion)); pass("evaluator versions match catalog metadata");
assert(CanonicalLayerCatalog.filter(x=>x.operationalStatus==="OPERATIONAL").every(x=>getCanonicalLayerEvaluator(x.id))); pass("every operational catalog layer is registered");
assert(CanonicalLayerCatalog.filter(x=>x.operationalStatus==="UNAVAILABLE").every(x=>!getCanonicalLayerEvaluator(x.id))); pass("no unavailable catalog layer is registered");
for(const id of ["TEMPORAL","TOPOLOGY","GLOBAL_ANXIETY_INDEX"]){assert.equal(getCanonicalLayerEvaluator(id),undefined);pass(`${id} is not registered`);}
assert.equal(getCanonicalLayerEvaluator("UNKNOWN_LAYER"),undefined); pass("unknown lookup fails closed");
assert.equal(getCanonicalLayerEvaluator("TEMPORAL"),undefined); pass("unavailable lookup fails closed");
const first=CanonicalLayerEvaluatorRegistry[0]!;
throws(()=>validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,[...CanonicalLayerEvaluatorRegistry,first]),"Duplicate evaluator registration"); pass("duplicate registration validation fails");
const orphan={...first,layerId:"ORPHAN",evaluatorKey:"ORPHAN"}; throws(()=>validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,[...CanonicalLayerEvaluatorRegistry,orphan]),"Orphan evaluator"); pass("orphan registration validation fails");
throws(()=>validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,CanonicalLayerEvaluatorRegistry.slice(1)),"disagree"); pass("missing operational registration validation fails");
const badKey={...first,evaluatorKey:"WRONG"}; throws(()=>validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,[badKey,...CanonicalLayerEvaluatorRegistry.slice(1)]),"key mismatch"); pass("key mismatch validation fails");
const badVersion={...first,evaluatorVersion:"wrong/v0"}; throws(()=>validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,[badVersion,...CanonicalLayerEvaluatorRegistry.slice(1)]),"version mismatch"); pass("version mismatch validation fails");
assert.deepEqual(enumerateCanonicalLayerEvaluators().map(x=>x.layerId),enumerateCanonicalLayerEvaluators().map(x=>x.layerId)); pass("repeated enumeration is deterministic");
assert(Object.isFrozen(CanonicalLayerEvaluatorRegistry)&&CanonicalLayerEvaluatorRegistry.every(Object.isFrozen)); pass("registry structures are immutable");
const sources=[
 {availability:"AVAILABLE" as const,dimension:CanonicalFeatureDimension.OBSERVABILITY,similarity:0,weight:.2},
 {availability:"AVAILABLE" as const,dimension:CanonicalFeatureDimension.NARRATIVE,similarity:.8,weight:.3},
 {availability:"AVAILABLE" as const,dimension:CanonicalFeatureDimension.GEOGRAPHY,similarity:.2,weight:.1},
 {availability:"UNAVAILABLE" as const,dimension:CanonicalFeatureDimension.INFRASTRUCTURE,reason:"Infrastructure unavailable."},
];
const evaluation={identity:{evaluationId:"evaluation:candidate",candidateId:"candidate",leftKnowledgeObjectId:"knowledge:a",rightKnowledgeObjectId:"knowledge:b"},explanation:{dimensions:sources.map(source=>({dimension:source.dimension,status:source.availability===`AVAILABLE`?CanonicalCandidateEvaluationDimensionStatus.AVAILABLE:CanonicalCandidateEvaluationDimensionStatus.UNAVAILABLE,source}))}} as never;
const knowledge=(id:string)=>({identity:{id,createdAt:"fixed"},metadata:{title:id,version:"v1"},lifecycle:{status:"KNOWLEDGE",revision:1},type:"EVENT",status:"KNOWLEDGE",confidence:{value:0},provenance:{sourceId:id,sourceType:"TEST",sourceRevision:1,observedAt:"fixed",createdAt:"fixed",updatedAt:"fixed"},revision:{revision:1,timestamp:"fixed"},graph:[],relationships:[],tags:[],capabilities:{projectable:true,publishable:true,editable:false},payload:{}}) as never;
const inputProjection=projectCanonicalLayerEvaluatorInput({investigationId:"investigation",pairId:"pair",candidateId:"candidate",evaluationId:"evaluation:candidate",executionId:"execution",caseA:{subjectIdentity:"a",knowledgeObjectId:"knowledge:a"},caseB:{subjectIdentity:"b",knowledgeObjectId:"knowledge:b"},knowledgeObjects:[knowledge("knowledge:b"),knowledge("knowledge:a")]});
const before=JSON.stringify(evaluation); const zero=getCanonicalLayerEvaluator("OBSERVABILITY")!.evaluate({evaluation,inputProjection}); assert.equal(JSON.stringify(evaluation),before); pass("evaluator input is not mutated");
assert(Object.isFrozen(zero)&&Object.isFrozen(zero.lineage)&&Object.isFrozen(zero.lineage.sourceKnowledgeObjectIds)); pass("evaluator result is immutable");
assert(zero.availability==="AVAILABLE"&&zero.similarity===0); pass("AVAILABLE zero remains available and participating input");
const missing=getCanonicalLayerEvaluator("INFRASTRUCTURE")!.evaluate({evaluation,inputProjection}); assert(missing.availability==="UNAVAILABLE"&&!("similarity" in missing)); pass("UNAVAILABLE remains distinct from zero");
throws(()=>getCanonicalLayerEvaluator("OBSERVABILITY")!.evaluate({evaluation,inputProjection:{...inputProjection,evaluationId:"evaluation:forged"}}),"ownership"); pass("frozen input and evaluation ownership mismatch rejects");
assert(CanonicalLayerEvaluatorRegistry.every(x=>x.acceptedInputContract==="FROZEN_CANONICAL_LAYER_EVALUATOR_INPUT_PROJECTION"&&x.outputContract==="CANONICAL_LAYER_EVALUATION")); pass("input and output contracts are explicit");
assert(CanonicalLayerEvaluatorRegistry.every(x=>x.requiredCanonicalDimension===x.layerId)); pass("exact proven canonical dimension mappings are preserved");
assert(CanonicalLayerCatalog.length===48&&new Set(CanonicalLayerCatalog.map(x=>x.familyId)).size===16&&CanonicalLayerCatalog.filter(x=>x.operationalStatus==="OPERATIONAL").length===4&&CanonicalLayerCatalog.filter(x=>x.operationalStatus==="UNAVAILABLE").length===44); pass("catalog matrix remains 48/16/4/44");
const projection=readFileSync("src/layers/projection/LayersExperimentalPairProjection.ts","utf8"); assert(projection.includes("getCanonicalLayerEvaluator")&&!projection.includes("const mapping:")); pass("projection dispatches through registry without a duplicate mapping");
assert(!projection.includes("KnowledgeObjectRuntime")&&!projection.includes("active_layers")&&!projection.includes("Workspace.active_layers")); pass("projection cannot mutate canonical Knowledge or Workspace layers");
const changedUI=["src/layers/components/LayerCatalogMatrix.tsx","src/layers/components/LayersLaboratoryWorkspace.tsx"]; assert(changedUI.every(path=>readFileSync(path,"utf8").length>0)); pass("UI composition remains present and outside registry scope");
validateCanonicalLayerEvaluatorRegistry(CanonicalLayerCatalog,CanonicalLayerEvaluatorRegistry as readonly CanonicalLayerEvaluatorRegistration[]); pass("production registry validates loudly and completely");
console.log(`\nAll ${count} Canonical Layer Evaluator Registry invariants passed.`);
