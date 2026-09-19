import type { OperationalDossierProfileDefinition,OperationalDossierProfileId,OperationalDossierProfileResolutionBasis,OperationalDossierSectionId } from "./OperationalDossierProfileTypes.ts";

const p=(profileId:OperationalDossierProfileId,sectionOrder:readonly OperationalDossierSectionId[]):OperationalDossierProfileDefinition=>Object.freeze({profileId,sectionOrder:Object.freeze([...sectionOrder])});
const governance=["FACT_LINEAGE","INTELLIGENCE_GAPS","GOVERNANCE"] as const;
export const OPERATIONAL_DOSSIER_PROFILE_REGISTRY:Readonly<Record<OperationalDossierProfileId,OperationalDossierProfileDefinition>>=Object.freeze({
 EVENT:p("EVENT",["IDENTITY","OPERATIONAL_SUMMARY","CHRONOLOGY","LOCATION","PARTICIPANTS","EVIDENCE","CONFLICTS",...governance]),
 PERSON:p("PERSON",["IDENTITY","OPERATIONAL_SUMMARY","ORGANIZATION","CHRONOLOGY","EVENT_ROLE","EVIDENCE","CONFLICTS",...governance]),
 ORGANIZATION:p("ORGANIZATION",["IDENTITY","OPERATIONAL_SUMMARY","ORGANIZATION","PERSONNEL","CHRONOLOGY","CAPABILITIES","EVIDENCE","CONFLICTS",...governance]),
 NAVAL_VESSEL:p("NAVAL_VESSEL",["IDENTITY","OPERATIONAL_SUMMARY","EVENT_ROLE","CAPABILITIES","LIMITATIONS","SPECIFICATIONS","SYSTEMS","ORGANIZATION","CHRONOLOGY","EXTERNAL_REFERENCES",...governance]),
 AIRCRAFT:p("AIRCRAFT",["IDENTITY","OPERATIONAL_SUMMARY","EVENT_ROLE","CAPABILITIES","LIMITATIONS","SPECIFICATIONS","SYSTEMS","ORGANIZATION","CHRONOLOGY","EXTERNAL_REFERENCES",...governance]),
 SENSOR_SYSTEM:p("SENSOR_SYSTEM",["IDENTITY","OPERATIONAL_SUMMARY","CAPABILITIES","LIMITATIONS","SPECIFICATIONS","SYSTEMS","EVENT_ROLE","EVIDENCE","CONFLICTS",...governance]),
 LOCATION:p("LOCATION",["IDENTITY","OPERATIONAL_SUMMARY","LOCATION","CHRONOLOGY","EVENT_ROLE","EVIDENCE","CONFLICTS",...governance]),
 ARTIFACT:p("ARTIFACT",["IDENTITY","OPERATIONAL_SUMMARY","CHRONOLOGY","ORGANIZATION","EVIDENCE","CONFLICTS","EXTERNAL_REFERENCES",...governance]),
 DOCUMENT:p("DOCUMENT",["IDENTITY","OPERATIONAL_SUMMARY","CHRONOLOGY","ORGANIZATION","EVIDENCE","CONFLICTS","EXTERNAL_REFERENCES",...governance]),
 MEDIA:p("MEDIA",["IDENTITY","OPERATIONAL_SUMMARY","CHRONOLOGY","LOCATION","EVIDENCE","CONFLICTS","EXTERNAL_REFERENCES",...governance]),
 NARRATIVE:p("NARRATIVE",["IDENTITY","OPERATIONAL_SUMMARY","CHRONOLOGY","PARTICIPANTS","EVIDENCE","CONFLICTS",...governance]),
 HYPOTHESIS:p("HYPOTHESIS",["IDENTITY","OPERATIONAL_SUMMARY","EVIDENCE","CONFLICTS","EVENT_ROLE",...governance]),
 GENERIC_ENTITY:p("GENERIC_ENTITY",["IDENTITY","OPERATIONAL_SUMMARY","EVENT_ROLE","ORGANIZATION","CHRONOLOGY","EVIDENCE","CONFLICTS","EXTERNAL_REFERENCES",...governance]),
});
const aliases:Readonly<Record<string,OperationalDossierProfileId>>=Object.freeze({EVENT:"EVENT",PERSON:"PERSON",ORGANIZATION:"ORGANIZATION",NAVAL_VESSEL:"NAVAL_VESSEL",AIRCRAFT:"AIRCRAFT",SENSOR:"SENSOR_SYSTEM",SENSOR_SYSTEM:"SENSOR_SYSTEM",LOCATION:"LOCATION",ARTIFACT:"ARTIFACT",DOCUMENT:"DOCUMENT",MEDIA:"MEDIA",NARRATIVE:"NARRATIVE",HYPOTHESIS:"HYPOTHESIS"});
const entitySpecificProfiles:Readonly<Record<string,OperationalDossierProfileId>>=Object.freeze({"system:entity:uss-princeton":"NAVAL_VESSEL"});
export function resolveOperationalDossierProfile(input:{readonly explicitGovernedProfile?:string;readonly canonicalEntityId?:string;readonly governedEntitySubtype?:string;readonly canonicalKnowledgeType?:string;readonly graphNodeType?:string}):Readonly<{profile:OperationalDossierProfileDefinition;basis:OperationalDossierProfileResolutionBasis}>{
 const explicit=input.explicitGovernedProfile===undefined?undefined:aliases[input.explicitGovernedProfile.trim().toUpperCase()];
 if(explicit!==undefined)return Object.freeze({profile:OPERATIONAL_DOSSIER_PROFILE_REGISTRY[explicit],basis:"EXPLICIT_GOVERNED_PROFILE"});
 const entitySpecific=input.canonicalEntityId===undefined?undefined:entitySpecificProfiles[input.canonicalEntityId];
 if(entitySpecific!==undefined)return Object.freeze({profile:OPERATIONAL_DOSSIER_PROFILE_REGISTRY[entitySpecific],basis:"ENTITY_SPECIFIC"});
 const candidates:[[string|undefined,OperationalDossierProfileResolutionBasis],[string|undefined,OperationalDossierProfileResolutionBasis],[string|undefined,OperationalDossierProfileResolutionBasis]]=[[input.governedEntitySubtype,"GOVERNED_ENTITY_SUBTYPE"],[input.canonicalKnowledgeType,"CANONICAL_KNOWLEDGE_TYPE"],[input.graphNodeType,"GRAPH_NODE_TYPE"]];
 for(const [raw,basis] of candidates){if(raw!==undefined){const id=aliases[raw.trim().toUpperCase()];if(id!==undefined)return Object.freeze({profile:OPERATIONAL_DOSSIER_PROFILE_REGISTRY[id],basis});}}
 return Object.freeze({profile:OPERATIONAL_DOSSIER_PROFILE_REGISTRY.GENERIC_ENTITY,basis:"GENERIC_FALLBACK"});
}
