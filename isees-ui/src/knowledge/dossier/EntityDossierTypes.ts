export const ENTITY_DOSSIER_SCHEMA_VERSION = "entity-dossier/v1" as const;

export type EntityDossierScope = "GLOBAL_BASE" | "INVESTIGATION_OVERLAY";
export type EntityDossierAvailabilityState =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "NOT_RESEARCHED"
  | "NOT_ESTABLISHED"
  | "NO_LIMITATION_DOCUMENTED";
export type EntityDossierFactCategory =
  | "IDENTITY"
  | "CLASSIFICATION"
  | "IDENTIFIER"
  | "ORGANIZATION"
  | "COMMAND_MEMBERSHIP"
  | "LIFECYCLE"
  | "SPECIFICATION"
  | "SYSTEM"
  | "SENSOR"
  | "WEAPON"
  | "INSTRUMENT"
  | "CAPABILITY"
  | "LIMITATION"
  | "OPERATIONAL_HISTORY"
  | "EVENT_ROLE"
  | "ENCOUNTER_NARRATIVE"
  | "GEOGRAPHY"
  | "TEMPORAL_CONTEXT"
  | "PERSONNEL_ASSOCIATION"
  | "EXTERNAL_REFERENCE";
export type EntityDossierConflictState = "NONE" | "CONTESTED" | "UNRESOLVED" | "SUPERSEDED";
export type EntityDossierFactApplicability =
  | "SHIP_SPECIFIC"
  | "CLASS_LEVEL"
  | "SYSTEM_LEVEL"
  | "EVENT_SPECIFIC"
  | "ENTITY_SPECIFIC"
  | "TYPE_CANON";
export type EntityDossierEpistemicClassification =
  | "OBSERVED"
  | "ESTABLISHED"
  | "CORROBORATED"
  | "INTERPRETED"
  | "CANDIDATE"
  | "UNRESOLVED";
export type EntityDossierDerivation =
  | "DIRECT_SOURCE"
  | "RESEARCHER_AUTHORED"
  | "INFERRED"
  | "GENERATED"
  | "PROVIDER_SUMMARY";
export type EntityDossierReviewStatus =
  | "ACCEPTED"
  | "REVIEW_REQUIRED"
  | "REJECTED";
export type EntityDossierCanonEffect =
  | "GLOBAL_BASE"
  | "INVESTIGATION_OVERLAY"
  | "NONE";
export type EntityDossierSourceLinkRelationship =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "CONTEXT_ONLY"
  | "REQUIRES_RESOLUTION";
export type EntityDossierSourceAccessState =
  | "LOCAL_CANON"
  | "PUBLIC"
  | "RESTRICTED"
  | "UNAVAILABLE";
export type EntityDossierSourceRetentionState =
  | "SOURCE_CONTROLLED"
  | "SNAPSHOT_RETAINED"
  | "REFERENCE_ONLY";
export type EntityDossierSourceRetrievalState =
  | "NOT_APPLICABLE_LOCAL_CANON"
  | "RETRIEVED"
  | "RETRIEVAL_FAILED";

export interface EntityDossierIdentifier {
  readonly identifierId: string;
  readonly scheme: string;
  readonly value: string;
}

export interface EntityDossierIdentity {
  readonly canonicalEntityId: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly canonicalKnowledgeObjectId: string;
  readonly canonicalType: string;
  readonly entityType: string;
  readonly entitySubtype?: string;
  readonly identifiers: readonly EntityDossierIdentifier[];
}

export type EntityDossierTypedFactValue =
  | { readonly valueType: "STRING"; readonly value: string }
  | { readonly valueType: "IDENTIFIER"; readonly value: string; readonly scheme: string }
  | { readonly valueType: "INTEGER"; readonly value: number }
  | { readonly valueType: "NUMBER"; readonly value: number; readonly unit?: string }
  | { readonly valueType: "BOOLEAN"; readonly value: boolean }
  | { readonly valueType: "DATE"; readonly value: string; readonly precision: "DAY" | "MONTH" | "YEAR" }
  | { readonly valueType: "ENTITY_REFERENCE"; readonly value: string; readonly entityId: string; readonly displayName: string }
  | { readonly valueType: "URL_REFERENCE"; readonly value: string; readonly url: string; readonly displayName: string };

export type EntityDossierTemporalQualification =
  | { readonly kind: "UNSPECIFIED"; readonly effectiveTime: string }
  | { readonly kind: "AT_TIME"; readonly effectiveTime: string }
  | { readonly kind: "DURING_EVENT"; readonly eventId: string; readonly effectiveTime: string }
  | { readonly kind: "RANGE"; readonly effectiveFrom: string; readonly effectiveTo: string };

export type EntityDossierGeographicQualification =
  | { readonly state: "UNAVAILABLE" }
  | {
      readonly state: "AVAILABLE";
      readonly placeId?: string;
      readonly latitude?: number;
      readonly longitude?: number;
    };

export interface EntityDossierUncertainty {
  readonly code: string;
  readonly detail?: string;
}

export interface EntityDossierFact {
  readonly factId: string;
  readonly subjectEntityId: string;
  readonly predicate: string;
  readonly value: EntityDossierTypedFactValue;
  readonly temporalQualification: EntityDossierTemporalQualification;
  readonly geographicQualification: EntityDossierGeographicQualification;
  readonly derivation: EntityDossierDerivation;
  readonly epistemicClassification: EntityDossierEpistemicClassification;
  readonly reviewStatus: EntityDossierReviewStatus;
  readonly canonEffect: EntityDossierCanonEffect;
  readonly uncertainty: readonly EntityDossierUncertainty[];
  readonly limitationIds: readonly string[];
  readonly category?: EntityDossierFactCategory;
  readonly displayLabel?: string;
  readonly scope?: EntityDossierScope;
  readonly applicability?: EntityDossierFactApplicability;
  readonly conflictState?: EntityDossierConflictState;
  readonly governingDossierRevisionId?: string;
}

export interface EntityDossierRelationshipFact {
  readonly factId: string;
  readonly subjectEntityId: string;
  readonly relationshipType: string;
  readonly objectEntityId: string;
  readonly direction: "OUTBOUND" | "INBOUND";
  readonly temporalQualification: EntityDossierTemporalQualification;
  readonly geographicQualification: EntityDossierGeographicQualification;
  readonly derivation: EntityDossierDerivation;
  readonly epistemicClassification: EntityDossierEpistemicClassification;
  readonly reviewStatus: EntityDossierReviewStatus;
  readonly canonEffect: EntityDossierCanonEffect;
  readonly uncertainty: readonly EntityDossierUncertainty[];
  readonly limitationIds: readonly string[];
  readonly category?: EntityDossierFactCategory;
  readonly displayLabel?: string;
  readonly scope?: EntityDossierScope;
  readonly applicability?: EntityDossierFactApplicability;
  readonly conflictState?: EntityDossierConflictState;
  readonly governingDossierRevisionId?: string;
}

export interface EntityDossierSourceRecord {
  readonly sourceRecordId: string;
  readonly authority: string;
  readonly publisher: string;
  readonly locator?: string;
  readonly repositoryIdentity?: string;
  readonly retrievalState: EntityDossierSourceRetrievalState;
  readonly retrievedAt: string;
  readonly publicationTime?: string;
  readonly effectiveTime?: string;
  readonly snapshotIdentity: string;
  readonly contentHash: string;
  readonly accessState: EntityDossierSourceAccessState;
  readonly retentionState: EntityDossierSourceRetentionState;
  readonly sourceTitle?: string;
  readonly sourceType?: "LOCAL_CANON" | "OFFICIAL_ENTITY_PAGE" | "OFFICIAL_REGISTRY" | "OFFICIAL_HISTORY" | "OFFICIAL_REPORT" | "OFFICIAL_NEWS" | "OFFICIAL_FACT_FILE" | "RESEARCHER_SUBMISSION";
  readonly sourceRevisionLabel?: string;
  readonly mediaType?: string;
  readonly authoritativeScope?: readonly string[];
  readonly lastVerifiedAt?: string;
  readonly freshnessPolicy?: "STABLE_REFERENCE" | "TIME_SENSITIVE";
}

export interface EntityDossierFactSourceLink {
  readonly sourceLinkId: string;
  readonly factId: string;
  readonly sourceRecordId: string;
  readonly relationship: EntityDossierSourceLinkRelationship;
  readonly citationLocator?: string;
  readonly extractedFragmentHash?: string;
  readonly governingDossierRevisionId?: string;
}

export interface EntityDossierFieldAvailability {
  readonly field: string;
  readonly state: EntityDossierAvailabilityState;
}

export interface EntityDossierRevision {
  readonly dossierRevisionId: string;
  readonly dossierId: string;
  readonly revisionNumber: number;
  readonly parentRevisionId?: string;
  readonly schemaVersion: typeof ENTITY_DOSSIER_SCHEMA_VERSION;
  readonly entityIdentity: EntityDossierIdentity;
  readonly scope: EntityDossierScope;
  readonly investigationId?: string;
  readonly facts: readonly EntityDossierFact[];
  readonly relationshipFacts: readonly EntityDossierRelationshipFact[];
  readonly sourceRecords: readonly EntityDossierSourceRecord[];
  readonly sourceLinks: readonly EntityDossierFactSourceLink[];
  readonly fieldAvailability: readonly EntityDossierFieldAvailability[];
  readonly limitations: readonly { readonly limitationId: string; readonly code: string }[];
  readonly contentHash: string;
  readonly immutableState: "IMMUTABLE";
}

export interface GovernedEntityDossier {
  readonly dossierId: string;
  readonly schemaVersion: typeof ENTITY_DOSSIER_SCHEMA_VERSION;
  readonly canonicalEntityId: string;
  readonly scope: EntityDossierScope;
  readonly investigationId?: string;
  readonly revisions: readonly EntityDossierRevision[];
}

export interface GovernedEntityDossierRegistryEntry {
  readonly canonicalEntityId: string;
  readonly dossier: GovernedEntityDossier;
  readonly pinnedHeadRevisionId: string;
}

export interface EntityDossierProjectionBinding {
  readonly bindingId: string;
  readonly investigationId: string;
  readonly manifoldRevisionId: string;
  readonly graphRevisionId: string;
  readonly canonicalEntityId: string;
  readonly dossierId: string;
  readonly dossierRevisionId: string;
  readonly dossierContentHash: string;
}

export type EntityDossierRevisionInput = Omit<EntityDossierRevision, "contentHash">;
