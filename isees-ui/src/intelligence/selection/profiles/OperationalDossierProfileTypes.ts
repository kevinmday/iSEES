export const OPERATIONAL_DOSSIER_PROFILE_IDS = ["EVENT","PERSON","ORGANIZATION","NAVAL_VESSEL","AIRCRAFT","SENSOR_SYSTEM","LOCATION","ARTIFACT","DOCUMENT","MEDIA","NARRATIVE","HYPOTHESIS","GENERIC_ENTITY"] as const;
export type OperationalDossierProfileId = typeof OPERATIONAL_DOSSIER_PROFILE_IDS[number];

export const OPERATIONAL_DOSSIER_SECTION_IDS = ["IDENTITY","OPERATIONAL_SUMMARY","EVENT_ROLE","CHRONOLOGY","PARTICIPANTS","ORGANIZATION","SPECIFICATIONS","SYSTEMS","CAPABILITIES","LIMITATIONS","LOCATION","PERSONNEL","EVIDENCE","CONFLICTS","EXTERNAL_REFERENCES","FACT_LINEAGE","INTELLIGENCE_GAPS","GOVERNANCE"] as const;
export type OperationalDossierSectionId = typeof OPERATIONAL_DOSSIER_SECTION_IDS[number];
export type OperationalDossierSectionState = "AVAILABLE"|"UNAVAILABLE"|"NOT_RESEARCHED"|"NOT_ESTABLISHED"|"NO_LIMITATION_DOCUMENTED"|"NOT_APPLICABLE"|"CONFLICTING"|"STALE";
export type OperationalDossierProfileResolutionBasis = "EXPLICIT_GOVERNED_PROFILE"|"ENTITY_SPECIFIC"|"GOVERNED_ENTITY_SUBTYPE"|"CANONICAL_KNOWLEDGE_TYPE"|"GRAPH_NODE_TYPE"|"GENERIC_FALLBACK";

export interface OperationalDossierProfileDefinition { readonly profileId:OperationalDossierProfileId; readonly sectionOrder:readonly OperationalDossierSectionId[]; }
export interface OperationalDossierSectionProjection { readonly sectionId:OperationalDossierSectionId; readonly state:OperationalDossierSectionState; readonly factIds:readonly string[]; readonly relationshipFactIds:readonly string[]; readonly availabilityFields:readonly string[]; }
export interface OperationalDossierProfileProjection { readonly profileId:OperationalDossierProfileId; readonly resolutionBasis:OperationalDossierProfileResolutionBasis; readonly sectionOrder:readonly OperationalDossierSectionId[]; readonly sections:readonly OperationalDossierSectionProjection[]; }
