import { CanonicalLayerCatalog, CanonicalLayerFamilies, type CanonicalLayerId } from "./CanonicalLayerCatalog.ts";
import { CanonicalLayerLifecycleStatus, type CanonicalLayerDefinition } from "./CanonicalLayerCatalogTypes.ts";

export type LayerIdentityDiagnostic = Readonly<{ input:string; normalized:string; classification:"KNOWN"|"ALIASED"|"RETIRED"|"UNKNOWN"; resolvedId?:CanonicalLayerId; message:string }>;
export type DecodedLayerSelection = Readonly<{ known:readonly CanonicalLayerId[]; unsupported:readonly string[]; diagnostics:readonly LayerIdentityDiagnostic[] }>;
const byId = new Map(CanonicalLayerCatalog.map(x=>[x.id,x]));
export const CanonicalLayerAliases: Readonly<Record<string,CanonicalLayerId>> = Object.freeze({});
export const RetiredCanonicalLayerIds: readonly string[] = Object.freeze([]);
const valid = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export function isCanonicalLayerId(value: unknown): value is CanonicalLayerId { return typeof value === "string" && byId.has(value); }
export function getCanonicalLayerDefinition(value: unknown): CanonicalLayerDefinition | undefined { return isCanonicalLayerId(value) ? byId.get(value) : undefined; }
export function enumerateCanonicalLayers(): readonly CanonicalLayerDefinition[] {
 const familyOrder = new Map(CanonicalLayerFamilies.map(x=>[x.id,x.displayOrder]));
 return Object.freeze([...CanonicalLayerCatalog].sort((a,b)=>(familyOrder.get(a.familyId)!-familyOrder.get(b.familyId)!) || a.familyMemberOrder-b.familyMemberOrder || a.displayOrder-b.displayOrder || a.id.localeCompare(b.id)));
}
export function decodeCanonicalLayerSelection(values: readonly unknown[], retiredIds: readonly string[] = RetiredCanonicalLayerIds): DecodedLayerSelection {
 if (!Array.isArray(values)) throw new Error("Serialized layer selection must be an array.");
 const retired = new Set(retiredIds); const seen = new Set<string>(); const diagnostics:LayerIdentityDiagnostic[]=[]; const known:CanonicalLayerId[]=[]; const unsupported:string[]=[];
 for (const raw of values) {
  if (typeof raw !== "string") throw new Error("Serialized layer identities must be strings.");
  const id=raw.trim(); if(!id||!valid.test(id)) throw new Error("Serialized layer identity is missing or malformed."); if(seen.has(id)) continue; seen.add(id);
  if(isCanonicalLayerId(id)){known.push(id);diagnostics.push({input:raw,normalized:id,classification:"KNOWN",resolvedId:id,message:"Current canonical layer identity."});continue;}
  const alias=CanonicalLayerAliases[id]; if(alias){known.push(alias);diagnostics.push({input:raw,normalized:id,classification:"ALIASED",resolvedId:alias,message:`Alias resolves to ${alias}.`});continue;}
  const classification=retired.has(id)?"RETIRED":"UNKNOWN"; unsupported.push(id); diagnostics.push({input:raw,normalized:id,classification,message:classification==="RETIRED"?"Retired historical identity retained as unsupported.":"Unknown future identity retained as unsupported."});
 }
 const order=new Map(CanonicalLayerCatalog.map(x=>[x.id,x.displayOrder])); known.sort((a,b)=>order.get(a)!-order.get(b)!); unsupported.sort(); diagnostics.sort((a,b)=>a.normalized.localeCompare(b.normalized));
 return Object.freeze({known:Object.freeze(known),unsupported:Object.freeze(unsupported),diagnostics:Object.freeze(diagnostics.map((item) => Object.freeze(item)))});
}

export function isRetiredCanonicalLayer(definition: CanonicalLayerDefinition): boolean { return definition.lifecycleStatus === CanonicalLayerLifecycleStatus.RETIRED; }
