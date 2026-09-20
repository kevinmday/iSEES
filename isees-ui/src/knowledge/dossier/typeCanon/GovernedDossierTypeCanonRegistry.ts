import type { KnowledgeObjectType } from "../../model/KnowledgeObjectTypes.ts";
import type { GraphNodeType } from "../../../manifold/graphTypes.ts";
import type { OperationalDossierProfileId, OperationalDossierSectionId, OperationalDossierSectionState } from "../../../intelligence/selection/profiles/OperationalDossierProfileTypes.ts";
import { GOVERNED_DOSSIER_TYPE_CANON_VERSION, type GovernedDossierTypeCanonDefinition } from "./GovernedDossierTypeCanonTypes.ts";

export const EVENT_GOVERNED_DOSSIER_SECTION_ORDER = Object.freeze([
  "IDENTITY", "OPERATIONAL_SUMMARY", "CHRONOLOGY", "LOCATION", "PARTICIPANTS", "SYSTEMS",
  "EVIDENCE", "CONFLICTS", "RELATIONSHIPS", "FACT_LINEAGE", "RESTRICTIONS", "INTELLIGENCE_GAPS", "GOVERNANCE",
] as const satisfies readonly OperationalDossierSectionId[]);

const unavailableStates = Object.freeze([
  "AVAILABLE", "UNAVAILABLE", "NOT_RESEARCHED", "NOT_ESTABLISHED", "NOT_APPLICABLE",
  "CONFLICTING", "STALE", "NO_LIMITATION_DOCUMENTED",
] as const satisfies readonly OperationalDossierSectionState[]);

const eventFields = Object.freeze([
  { field: "canonicalIdentity", sectionId: "IDENTITY", required: true, unavailableState: "UNAVAILABLE" },
  { field: "eventClassification", sectionId: "OPERATIONAL_SUMMARY", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "eventTime", sectionId: "CHRONOLOGY", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "eventLocation", sectionId: "LOCATION", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "participants", sectionId: "PARTICIPANTS", required: false, unavailableState: "NOT_RESEARCHED" },
  { field: "systemsSensors", sectionId: "SYSTEMS", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "supportingEvidence", sectionId: "EVIDENCE", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "contradictingEvidence", sectionId: "CONFLICTS", required: false, unavailableState: "NOT_RESEARCHED" },
  { field: "relationships", sectionId: "RELATIONSHIPS", required: false, unavailableState: "NOT_ESTABLISHED" },
  { field: "documentedRestrictions", sectionId: "RESTRICTIONS", required: false, unavailableState: "NO_LIMITATION_DOCUMENTED" },
  { field: "authoritativeConfidence", sectionId: "INTELLIGENCE_GAPS", required: false, unavailableState: "UNAVAILABLE" },
] as const);

const definition = (input: Omit<GovernedDossierTypeCanonDefinition, "typeCanonVersion" | "confidencePolicy" | "unavailableStates" | "selectionBoundary">): GovernedDossierTypeCanonDefinition => Object.freeze({
  ...input,
  typeCanonVersion: GOVERNED_DOSSIER_TYPE_CANON_VERSION,
  confidencePolicy: "AUTHORITATIVELY_SUPPLIED_ONLY",
  unavailableStates,
  selectionBoundary: "SYNCHRONOUS_DETERMINISTIC_LOCAL_ZERO_COST",
});

export const GOVERNED_DOSSIER_TYPE_CANON_REGISTRY = Object.freeze({
  EVENT: definition({ familyId: "EVENT", canonicalSemanticTypes: Object.freeze(["EVENT"]), compatibilityProjectionTypes: Object.freeze(["EVENT"]), completeness: "COMPLETE", sectionOrder: EVENT_GOVERNED_DOSSIER_SECTION_ORDER, fields: eventFields }),
  GENERIC_ENTITY: definition({ familyId: "GENERIC_ENTITY", canonicalSemanticTypes: Object.freeze([]), compatibilityProjectionTypes: Object.freeze([]), completeness: "GENERIC_FALLBACK", sectionOrder: Object.freeze(["IDENTITY", "OPERATIONAL_SUMMARY", "FACT_LINEAGE", "INTELLIGENCE_GAPS", "GOVERNANCE"]), fields: Object.freeze([]) }),
} satisfies Readonly<Record<"EVENT" | "GENERIC_ENTITY", GovernedDossierTypeCanonDefinition>>);

export const CANONICAL_SEMANTIC_FAMILY_MAP: Readonly<Record<KnowledgeObjectType, OperationalDossierProfileId>> = Object.freeze({
  OBSERVATION: "EVENT", EVIDENCE: "ARTIFACT", FACT: "GENERIC_ENTITY", HYPOTHESIS: "HYPOTHESIS",
  NARRATIVE: "NARRATIVE", EVENT: "EVENT", ENTITY: "GENERIC_ENTITY", LOCATION: "LOCATION",
  PERSON: "PERSON", ORGANIZATION: "ORGANIZATION", ARTIFACT: "ARTIFACT", RELATIONSHIP: "GENERIC_ENTITY",
  INTENTION: "GENERIC_ENTITY", MODEL: "ARTIFACT", DATASET: "ARTIFACT", DOCUMENT: "DOCUMENT",
  REFERENCE: "ARTIFACT", CUSTOM: "GENERIC_ENTITY",
});

export const COMPATIBILITY_PROJECTION_FAMILY_MAP: Readonly<Record<GraphNodeType, OperationalDossierProfileId>> = Object.freeze({
  EVENT: "EVENT", FACILITY: "GENERIC_ENTITY", ARTIFACT: "ARTIFACT", PERSON: "PERSON",
  ORGANIZATION: "ORGANIZATION", LOCATION: "LOCATION", NARRATIVE: "NARRATIVE", HYPOTHESIS: "HYPOTHESIS",
});

export function normalizeCanonicalSemanticFamily(value: string | undefined): OperationalDossierProfileId | undefined {
  if (value === undefined) return undefined;
  return CANONICAL_SEMANTIC_FAMILY_MAP[value.trim().toUpperCase() as KnowledgeObjectType];
}

export function normalizeCompatibilityProjectionFamily(value: string | undefined): OperationalDossierProfileId | undefined {
  if (value === undefined) return undefined;
  return COMPATIBILITY_PROJECTION_FAMILY_MAP[value.trim().toUpperCase() as GraphNodeType];
}
