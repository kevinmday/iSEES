import type { EntityDossierFact,EntityDossierFieldAvailability,EntityDossierRelationshipFact,EntityDossierRevision } from "../../../knowledge/dossier/EntityDossierTypes.ts";
import { resolveOperationalDossierProfile } from "./OperationalDossierProfileRegistry.ts";
import type { OperationalDossierProfileProjection,OperationalDossierSectionId,OperationalDossierSectionProjection,OperationalDossierSectionState } from "./OperationalDossierProfileTypes.ts";

const categories:Partial<Record<OperationalDossierSectionId,readonly string[]>>={IDENTITY:["IDENTITY","CLASSIFICATION","IDENTIFIER"],EVENT_ROLE:["EVENT_ROLE"],CHRONOLOGY:["LIFECYCLE","OPERATIONAL_HISTORY","TEMPORAL_CONTEXT"],PARTICIPANTS:["PERSONNEL_ASSOCIATION"],ORGANIZATION:["ORGANIZATION","COMMAND_MEMBERSHIP"],SPECIFICATIONS:["SPECIFICATION"],SYSTEMS:["SYSTEM","SENSOR","WEAPON","INSTRUMENT"],CAPABILITIES:["CAPABILITY"],LIMITATIONS:["LIMITATION"],LOCATION:["GEOGRAPHY"],PERSONNEL:["PERSONNEL_ASSOCIATION"],EVIDENCE:[],CONFLICTS:[],RELATIONSHIPS:[],RESTRICTIONS:["LIMITATION"],EXTERNAL_REFERENCES:["EXTERNAL_REFERENCE"]};
const availabilityKeys:Partial<Record<OperationalDossierSectionId,readonly string[]>>={EVENT_ROLE:["encounterNarrativeNovember2004","encounterRadarTracksNovember2004","encounterSensorPerformanceNovember2004","specificCrewActionsNovember2004"],PARTICIPANTS:["participants"],SYSTEMS:["specificSensorObservations"],EVIDENCE:["supportingEvidence"],CONFLICTS:["contradictingEvidence"],RELATIONSHIPS:["relationships"],RESTRICTIONS:["documentedRestrictions"],LIMITATIONS:["documentedLimitations","encounterRadarTracksNovember2004","encounterSensorPerformanceNovember2004"],ORGANIZATION:["carrierStrikeGroupMembershipCurrent","currentCommandAssignment"],CHRONOLOGY:["laidDownDate","launchedDate","decommissionedDate","eventDayAndTime"],LOCATION:["exactGeographicCoordinates"],EXTERNAL_REFERENCES:["currentContactDetails"],INTELLIGENCE_GAPS:[]};
const stateRank:Readonly<Record<string,number>>={CONFLICTING:7,STALE:6,NOT_ESTABLISHED:5,NOT_RESEARCHED:4,NO_LIMITATION_DOCUMENTED:3,UNAVAILABLE:2,AVAILABLE:1};
function missingState(fields:readonly EntityDossierFieldAvailability[]):OperationalDossierSectionState{if(fields.length===0)return "UNAVAILABLE";return [...fields].map(f=>f.state as OperationalDossierSectionState).sort((a,b)=>(stateRank[b]??0)-(stateRank[a]??0))[0]??"UNAVAILABLE";}
function section(sectionId:OperationalDossierSectionId,facts:readonly EntityDossierFact[],relationships:readonly EntityDossierRelationshipFact[],availability:readonly EntityDossierFieldAvailability[]):OperationalDossierSectionProjection{
 const wanted=categories[sectionId];
 let selected:readonly EntityDossierFact[]=wanted===undefined?[]:facts.filter(f=>f.category!==undefined&&wanted.includes(f.category));
 let rel:readonly EntityDossierRelationshipFact[]=sectionId==="EVENT_ROLE"?relationships.filter(f=>f.category==="EVENT_ROLE"):[];
 if(sectionId==="OPERATIONAL_SUMMARY")selected=facts.filter(f=>f.predicate==="documented_mission_roles"||f.predicate==="event_classification"||f.predicate==="canonical_status");
 if(sectionId==="RELATIONSHIPS")rel=relationships;
 if(sectionId==="CAPABILITIES")selected=selected.filter(f=>f.predicate!=="documented_mission_roles");
 if(sectionId==="FACT_LINEAGE")selected=facts;
 if(sectionId==="INTELLIGENCE_GAPS"){const gaps=availability.filter(f=>f.state!=="AVAILABLE");return Object.freeze({sectionId,state:gaps.length?missingState(gaps):"UNAVAILABLE",factIds:Object.freeze([]),relationshipFactIds:Object.freeze([]),availabilityFields:Object.freeze(gaps.map(f=>f.field).sort())});}
 if(sectionId==="GOVERNANCE")return Object.freeze({sectionId,state:"AVAILABLE",factIds:Object.freeze([]),relationshipFactIds:Object.freeze([]),availabilityFields:Object.freeze([])});
 const keys=availabilityKeys[sectionId]??[];const fields=availability.filter(f=>keys.includes(f.field));
 const conflicts=[...selected,...rel].some(f=>f.conflictState==="CONTESTED"||f.conflictState==="UNRESOLVED");
 const state:OperationalDossierSectionState=conflicts?"CONFLICTING":selected.length+rel.length>0?"AVAILABLE":fields.length?missingState(fields):"UNAVAILABLE";
 return Object.freeze({sectionId,state,factIds:Object.freeze(selected.map(f=>f.factId).sort()),relationshipFactIds:Object.freeze(rel.map(f=>f.factId).sort()),availabilityFields:Object.freeze(fields.map(f=>f.field).sort())});
}
export function projectOperationalDossierProfile(revision:EntityDossierRevision,graphNodeType:string):OperationalDossierProfileProjection{
 const resolved=resolveOperationalDossierProfile({canonicalEntityId:revision.entityIdentity.canonicalEntityId,identityDossierState:"VALID",governedEntitySubtype:revision.entityIdentity.entitySubtype,canonicalKnowledgeType:revision.entityIdentity.canonicalType,graphNodeType});
 const accepted=revision.facts.filter(f=>f.reviewStatus==="ACCEPTED"&&f.canonEffect!=="NONE");const relationships=revision.relationshipFacts.filter(f=>f.reviewStatus==="ACCEPTED"&&f.canonEffect!=="NONE");
 const sections=resolved.profile.sectionOrder.map(id=>section(id,accepted,relationships,revision.fieldAvailability));
 return Object.freeze({profileId:resolved.profile.profileId,resolutionBasis:resolved.basis,matchedKey:resolved.matchedKey,consideredCandidates:resolved.consideredCandidates,sectionOrder:resolved.profile.sectionOrder,sections:Object.freeze(sections)});
}
