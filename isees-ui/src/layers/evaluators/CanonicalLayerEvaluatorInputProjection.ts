import { CANONICAL_LAYER_CATALOG_VERSION, LAYERS_EXPERIMENT_SCHEMA_VERSION } from "../catalog/CanonicalLayerCatalogTypes.ts";
import type { KnowledgeObject } from "../../knowledge/model/KnowledgeObject.ts";
import { extractCanonicalKnowledgeFeatureCollection } from "../../resolve/features/CanonicalKnowledgeFeatureExtractor.ts";
import { CanonicalFeatureDimension, type CanonicalFeatureLineage, type CanonicalFeatureValue, type CanonicalKnowledgeFeatureSet } from "../../resolve/features/CanonicalKnowledgeFeatureTypes.ts";

export const CANONICAL_LAYER_EVALUATOR_INPUT_SCHEMA_VERSION = "layer-evaluator-input/v1" as const;

export interface CanonicalLayerEvaluatorInputSourceLineage {
  readonly source: CanonicalFeatureLineage["source"];
  readonly sourceKnowledgeObjectIds: readonly string[];
  readonly relationshipIds?: readonly string[];
  readonly sources: readonly { readonly knowledgeObjectId: string; readonly sourceIdentity: string; readonly sourceVersion?: string; readonly sourceRevision?: string }[];
}
export interface AvailableCanonicalLayerEvaluatorComponent {
  readonly availability: "AVAILABLE";
  readonly subjectKnowledgeObjectId: string;
  readonly componentIdentity: string;
  readonly rawValue: unknown;
  readonly lineage: CanonicalLayerEvaluatorInputSourceLineage;
}
export interface UnavailableCanonicalLayerEvaluatorComponent {
  readonly availability: "UNAVAILABLE";
  readonly subjectKnowledgeObjectId?: string;
  readonly componentIdentity: string;
  readonly code: "CANONICAL_FEATURE_UNAVAILABLE";
  readonly reason: string;
}
export type CanonicalLayerEvaluatorComponent = AvailableCanonicalLayerEvaluatorComponent | UnavailableCanonicalLayerEvaluatorComponent;
export interface CanonicalLayerEvaluatorEndpointSnapshot {
  readonly subjectRole: "CASE_A" | "CASE_B";
  readonly subjectIdentity: string;
  readonly knowledgeObjectId: string;
  readonly endpointSnapshotId: string;
  readonly components: readonly CanonicalLayerEvaluatorComponent[];
}
export interface CanonicalLayerEvaluatorInputProjection {
  readonly kind: "CANONICAL_LAYER_EVALUATOR_INPUT_PROJECTION";
  readonly inputSchemaVersion: typeof CANONICAL_LAYER_EVALUATOR_INPUT_SCHEMA_VERSION;
  readonly experimentSchemaVersion: typeof LAYERS_EXPERIMENT_SCHEMA_VERSION;
  readonly catalogVersion: typeof CANONICAL_LAYER_CATALOG_VERSION;
  readonly inputProjectionId: string;
  readonly investigationId: string;
  readonly pairId: string;
  readonly candidateId: string;
  readonly evaluationId: string;
  readonly executionId: string;
  readonly endpoints: readonly [CanonicalLayerEvaluatorEndpointSnapshot, CanonicalLayerEvaluatorEndpointSnapshot];
  readonly canonicalRepresentation: string;
}
export interface ProjectCanonicalLayerEvaluatorInput {
  readonly investigationId: string;
  readonly pairId: string;
  readonly candidateId: string;
  readonly evaluationId: string;
  readonly executionId: string;
  readonly caseA: { readonly subjectIdentity: string; readonly knowledgeObjectId: string };
  readonly caseB: { readonly subjectIdentity: string; readonly knowledgeObjectId: string };
  readonly knowledgeObjects: readonly KnowledgeObject[];
}

function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value as object).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
function hash(text: string): string { let value=0xcbf29ce484222325n; for(const c of text){value^=BigInt(c.codePointAt(0)??0);value=BigInt.asUintN(64,value*0x100000001b3n);} return value.toString(16).padStart(16,"0"); }
function immutable<T>(value: T): T { if(value&&typeof value==="object"&&!Object.isFrozen(value)){for(const child of Object.values(value as object))immutable(child);Object.freeze(value);} return value; }
function required(value: string, label: string): string { if(!value?.trim()) throw new Error(`${label} is missing.`); return value.trim(); }

function component(subjectKnowledgeObjectId: string, identity: string, feature: CanonicalFeatureValue<unknown>, knowledgeIndex: ReadonlyMap<string,KnowledgeObject>): CanonicalLayerEvaluatorComponent {
  if (feature.availability === "UNAVAILABLE") return { availability:"UNAVAILABLE", subjectKnowledgeObjectId, componentIdentity:identity, code:"CANONICAL_FEATURE_UNAVAILABLE", reason:feature.reason };
  const sourceKnowledgeObjectIds=[...feature.lineage.sourceKnowledgeObjectIds].sort();
  const sources=sourceKnowledgeObjectIds.map(knowledgeObjectId=>{const sourceObject=knowledgeIndex.get(knowledgeObjectId);if(!sourceObject)throw new Error(`Feature lineage source ${knowledgeObjectId} is unavailable.`);return {knowledgeObjectId,sourceIdentity:sourceObject.provenance.sourceId,...(sourceObject.metadata.version?{sourceVersion:sourceObject.metadata.version}:{}),...(Number.isFinite(sourceObject.provenance.sourceRevision)?{sourceRevision:String(sourceObject.provenance.sourceRevision)}:{})};});
  return { availability:"AVAILABLE", subjectKnowledgeObjectId, componentIdentity:identity, rawValue:feature.value, lineage:{ source:feature.lineage.source, sourceKnowledgeObjectIds, ...(feature.lineage.relationshipIds?{relationshipIds:[...feature.lineage.relationshipIds].sort()}:{}), sources } };
}
function components(feature: CanonicalKnowledgeFeatureSet, knowledgeIndex: ReadonlyMap<string,KnowledgeObject>): CanonicalLayerEvaluatorComponent[] {
  const entries: readonly [string, CanonicalFeatureValue<unknown>][] = [
    [`${CanonicalFeatureDimension.GEOGRAPHY}.location`,feature.geography.location],
    [`${CanonicalFeatureDimension.INFRASTRUCTURE}.entities`,feature.infrastructure.entities],
    [`${CanonicalFeatureDimension.NARRATIVE}.traits`,feature.narrative.traits],
    [`${CanonicalFeatureDimension.OBSERVABILITY}.confidence`,feature.observability.confidence],
    [`${CanonicalFeatureDimension.OBSERVABILITY}.durationMinutes`,feature.observability.durationMinutes],
    [`${CanonicalFeatureDimension.OBSERVABILITY}.regime`,feature.observability.regime],
  ];
  const topology=feature.topology.state;
  const result=[...entries.map(([identity,value])=>component(feature.knowledgeObjectId,identity,value,knowledgeIndex))];
  for(const name of ["clusterFragmentation","contradictionDensity","entanglementScore","residualInstability"] as const){
    result.push(topology.availability==="AVAILABLE"?component(feature.knowledgeObjectId,`${CanonicalFeatureDimension.TOPOLOGY}.${name}`,{...topology,value:topology.value[name]},knowledgeIndex):component(feature.knowledgeObjectId,`${CanonicalFeatureDimension.TOPOLOGY}.${name}`,topology,knowledgeIndex));
  }
  return result.sort((a,b)=>a.componentIdentity.localeCompare(b.componentIdentity));
}

export function projectCanonicalLayerEvaluatorInput(input: ProjectCanonicalLayerEvaluatorInput): CanonicalLayerEvaluatorInputProjection {
  const identities={investigationId:required(input.investigationId,"Investigation identity"),pairId:required(input.pairId,"Pair identity"),candidateId:required(input.candidateId,"Candidate identity"),evaluationId:required(input.evaluationId,"Evaluation identity"),executionId:required(input.executionId,"Execution identity")};
  if(input.caseA.knowledgeObjectId===input.caseB.knowledgeObjectId) throw new Error("Evaluator input endpoints must be distinct.");
  const featureCollection=extractCanonicalKnowledgeFeatureCollection(input.knowledgeObjects);
  if(new Set(input.knowledgeObjects.map(value=>value.identity.id)).size!==input.knowledgeObjects.length) throw new Error("Duplicate Knowledge object identities are not permitted.");
  const byFeature=new Map(featureCollection.features.map(value=>[value.knowledgeObjectId,value]));
  const byObject=new Map(input.knowledgeObjects.map(value=>[value.identity.id,value]));
  const endpoint=(role:"CASE_A"|"CASE_B", subject:{readonly subjectIdentity:string;readonly knowledgeObjectId:string}):CanonicalLayerEvaluatorEndpointSnapshot=>{
    const feature=byFeature.get(subject.knowledgeObjectId), object=byObject.get(subject.knowledgeObjectId);
    if(!feature||!object) throw new Error(`${role} endpoint Knowledge object is unavailable.`);
    const semantic={subjectRole:role,subjectIdentity:required(subject.subjectIdentity,`${role} subject identity`),knowledgeObjectId:subject.knowledgeObjectId,components:components(feature,byObject)};
    return {...semantic,endpointSnapshotId:`layer-endpoint-input:${hash(canonical(semantic))}`};
  };
  const endpoints=[endpoint("CASE_A",input.caseA),endpoint("CASE_B",input.caseB)] as const;
  const semantic={kind:"CANONICAL_LAYER_EVALUATOR_INPUT_PROJECTION" as const,inputSchemaVersion:CANONICAL_LAYER_EVALUATOR_INPUT_SCHEMA_VERSION,experimentSchemaVersion:LAYERS_EXPERIMENT_SCHEMA_VERSION,catalogVersion:CANONICAL_LAYER_CATALOG_VERSION,...identities,endpoints};
  const canonicalRepresentation=canonical(semantic);
  return immutable({...semantic,inputProjectionId:`layer-evaluator-input:${hash(canonicalRepresentation)}`,canonicalRepresentation});
}
