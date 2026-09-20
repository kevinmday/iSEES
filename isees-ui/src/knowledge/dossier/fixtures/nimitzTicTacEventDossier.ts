import { createEntityDossierRevision, createGovernedEntityDossier, entityDossierSha256 } from "../EntityDossierCanonicalization.ts";
import { ENTITY_DOSSIER_SCHEMA_VERSION, type EntityDossierFact, type EntityDossierFactSourceLink, type EntityDossierSourceRecord } from "../EntityDossierTypes.ts";

export const NIMITZ_TIC_TAC_EVENT_ID = "system:event:E-TICTAC-2004" as const;
export const NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_ID = "dossier-revision:system:event:E-TICTAC-2004:1" as const;
const DOSSIER_ID = `dossier:${NIMITZ_TIC_TAC_EVENT_ID}` as const;
const SOURCE_ID = "source:system-canon:canonical-registry:E-TICTAC-2004" as const;
const UNSPECIFIED_TIME = "1970-01-01T00:00:00.000Z" as const;

const reviewedLocalCanon = Object.freeze({
  event_id: "E-TICTAC-2004",
  event_name: "Nimitz Tic Tac Encounter",
  classification: "multi_sensor_naval_event",
  year: 2004,
  location: "Pacific Ocean",
  observability_profile: "multi_sensor",
  canonical_status: "ACTIVE",
});

const fact = (id: string, predicate: string, label: string, value: EntityDossierFact["value"], category: NonNullable<EntityDossierFact["category"]>): EntityDossierFact => ({
  factId: `fact:nimitz-tic-tac:event:${id}`,
  subjectEntityId: NIMITZ_TIC_TAC_EVENT_ID,
  predicate,
  displayLabel: label,
  value,
  category,
  scope: "GLOBAL_BASE",
  applicability: "EVENT_SPECIFIC",
  temporalQualification: { kind: "UNSPECIFIED", effectiveTime: UNSPECIFIED_TIME },
  geographicQualification: category === "GEOGRAPHY" ? { state: "AVAILABLE", placeId: "system:location:pacific-ocean" } : { state: "UNAVAILABLE" },
  derivation: "DIRECT_SOURCE",
  epistemicClassification: "ESTABLISHED",
  reviewStatus: "ACCEPTED",
  canonEffect: "GLOBAL_BASE",
  conflictState: "NONE",
  uncertainty: [],
  limitationIds: ["limitation:reviewed-local-system-canon-only"],
  governingDossierRevisionId: NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_ID,
});

const facts = Object.freeze([
  fact("display-name", "event_name", "Event name", { valueType: "STRING", value: reviewedLocalCanon.event_name }, "IDENTITY"),
  fact("semantic-type", "canonical_semantic_type", "Canonical semantic type", { valueType: "STRING", value: "EVENT" }, "CLASSIFICATION"),
  fact("classification", "event_classification", "Event classification", { valueType: "STRING", value: reviewedLocalCanon.classification }, "CLASSIFICATION"),
  fact("year", "event_year", "Canonical event year", { valueType: "INTEGER", value: reviewedLocalCanon.year }, "TEMPORAL_CONTEXT"),
  fact("location", "event_location", "Canonical event location", { valueType: "STRING", value: reviewedLocalCanon.location }, "GEOGRAPHY"),
  fact("observability-profile", "observability_profile", "Canonical observability profile", { valueType: "STRING", value: reviewedLocalCanon.observability_profile }, "SYSTEM"),
  fact("canonical-status", "canonical_status", "Canonical status", { valueType: "STRING", value: reviewedLocalCanon.canonical_status }, "OPERATIONAL_HISTORY"),
]);

const sourceRecord: EntityDossierSourceRecord = Object.freeze({
  sourceRecordId: SOURCE_ID,
  authority: "System Canon",
  publisher: "System Canon",
  repositoryIdentity: "src/canonical/canonicalRegistry.ts#E-TICTAC-2004",
  retrievalState: "NOT_APPLICABLE_LOCAL_CANON",
  retrievedAt: UNSPECIFIED_TIME,
  effectiveTime: UNSPECIFIED_TIME,
  snapshotIdentity: "SYSTEM_CANON/CANONICAL_REGISTRY/E-TICTAC-2004",
  contentHash: entityDossierSha256(reviewedLocalCanon),
  accessState: "LOCAL_CANON",
  retentionState: "SOURCE_CONTROLLED",
  sourceTitle: "System Canon canonical registry — E-TICTAC-2004",
  sourceType: "LOCAL_CANON",
  sourceRevisionLabel: "repository checkpoint 98f8da9c9c72b8259d13b1bebc3bfcb949f2ac46",
  mediaType: "application/typescript",
  authoritativeScope: Object.freeze(["Canonical event identity, classification, year, location label, observability profile, and canonical status only"]),
  freshnessPolicy: "STABLE_REFERENCE",
});

const sourceLinks: readonly EntityDossierFactSourceLink[] = Object.freeze(facts.map(item => Object.freeze({
  sourceLinkId: `link:${item.factId}:system-canon-registry`,
  factId: item.factId,
  sourceRecordId: SOURCE_ID,
  relationship: "SUPPORTS" as const,
  citationLocator: "CANONICAL_REGISTRY entry E-TICTAC-2004",
  extractedFragmentHash: entityDossierSha256(reviewedLocalCanon),
  governingDossierRevisionId: NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_ID,
})));

export const NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_1 = createEntityDossierRevision({
  dossierRevisionId: NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_ID,
  dossierId: DOSSIER_ID,
  revisionNumber: 1,
  schemaVersion: ENTITY_DOSSIER_SCHEMA_VERSION,
  entityIdentity: {
    canonicalEntityId: NIMITZ_TIC_TAC_EVENT_ID,
    displayName: "Nimitz Tic Tac Encounter",
    aliases: [],
    canonicalKnowledgeObjectId: NIMITZ_TIC_TAC_EVENT_ID,
    canonicalType: "EVENT",
    entityType: "EVENT",
    entitySubtype: "EVENT",
    identifiers: [{ identifierId: "identifier:nimitz-tic-tac:system-canon-event", scheme: "SYSTEM_CANON_EVENT_ID", value: "E-TICTAC-2004" }],
  },
  scope: "GLOBAL_BASE",
  facts,
  relationshipFacts: [],
  sourceRecords: [sourceRecord],
  sourceLinks,
  fieldAvailability: [
    { field: "authoritativeConfidence", state: "UNAVAILABLE" },
    { field: "contradictingEvidence", state: "NOT_RESEARCHED" },
    { field: "documentedRestrictions", state: "NO_LIMITATION_DOCUMENTED" },
    { field: "eventDayAndTime", state: "NOT_ESTABLISHED" },
    { field: "exactGeographicCoordinates", state: "NOT_ESTABLISHED" },
    { field: "participants", state: "NOT_RESEARCHED" },
    { field: "relationships", state: "NOT_ESTABLISHED" },
    { field: "specificSensorObservations", state: "NOT_ESTABLISHED" },
    { field: "supportingEvidence", state: "NOT_ESTABLISHED" },
  ],
  limitations: [{ limitationId: "limitation:reviewed-local-system-canon-only", code: "ONLY_REVIEWED_LOCAL_SYSTEM_CANON_FIELDS_ADMITTED" }],
  immutableState: "IMMUTABLE",
});

export const NIMITZ_TIC_TAC_EVENT_GOVERNED_DOSSIER = createGovernedEntityDossier({
  dossierId: DOSSIER_ID,
  schemaVersion: ENTITY_DOSSIER_SCHEMA_VERSION,
  canonicalEntityId: NIMITZ_TIC_TAC_EVENT_ID,
  scope: "GLOBAL_BASE",
  revisions: [NIMITZ_TIC_TAC_EVENT_DOSSIER_REVISION_1],
});
