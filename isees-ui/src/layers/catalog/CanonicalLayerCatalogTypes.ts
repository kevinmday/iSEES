export const CANONICAL_LAYER_CATALOG_VERSION = "layers-catalog/v1" as const;
export const LAYERS_EXPERIMENT_SCHEMA_VERSION = "layers-experiment/v1" as const;
export const CANONICAL_LAYER_DEFAULT_PROFILE_VERSION = "layers-default-profiles/v1" as const;

export const CanonicalLayerFamilyId = {
  OBSERVATIONAL: "OBSERVATIONAL", SENSOR: "SENSOR", NARRATIVE: "NARRATIVE",
  HISTORICAL: "HISTORICAL", LINGUISTIC: "LINGUISTIC", TEMPORAL: "TEMPORAL",
  GEOSPATIAL: "GEOSPATIAL", PHYSICAL: "PHYSICAL", INFRASTRUCTURE: "INFRASTRUCTURE",
  TECHNOLOGY: "TECHNOLOGY", COMPUTATIONAL: "COMPUTATIONAL", EVIDENCE: "EVIDENCE",
  MYTHIC_SYMBOLIC: "MYTHIC_SYMBOLIC", CULTURAL: "CULTURAL", RELIGIOUS: "RELIGIOUS",
  SOCIETAL_GLOBAL_CONTEXT: "SOCIETAL_GLOBAL_CONTEXT",
} as const;
export type CanonicalLayerFamilyId = typeof CanonicalLayerFamilyId[keyof typeof CanonicalLayerFamilyId];

export const CanonicalLayerLifecycleStatus = { CURRENT: "CURRENT", RETIRED: "RETIRED" } as const;
export type CanonicalLayerLifecycleStatus = typeof CanonicalLayerLifecycleStatus[keyof typeof CanonicalLayerLifecycleStatus];
export const CanonicalLayerAvailability = {
  OPERATIONAL: "OPERATIONAL", ADAPTER_REQUIRED: "ADAPTER_REQUIRED",
  MISSING_CANONICAL_DATA: "MISSING_CANONICAL_DATA", EXTERNAL_PROVIDER_REQUIRED: "EXTERNAL_PROVIDER_REQUIRED",
  CONCEPT_METHODOLOGY_UNAVAILABLE: "CONCEPT_METHODOLOGY_UNAVAILABLE",
} as const;
export type CanonicalLayerAvailability = typeof CanonicalLayerAvailability[keyof typeof CanonicalLayerAvailability];
export const CanonicalLayerOperationalStatus = { OPERATIONAL: "OPERATIONAL", UNAVAILABLE: "UNAVAILABLE" } as const;
export type CanonicalLayerOperationalStatus = typeof CanonicalLayerOperationalStatus[keyof typeof CanonicalLayerOperationalStatus];

export const CanonicalLayerProfileId = {
  CANONICAL_BASELINE: "CANONICAL_BASELINE", EMPTY_EXPERIMENT: "EMPTY_EXPERIMENT",
  ALL_OPERATIONAL: "ALL_OPERATIONAL",
} as const;
export type CanonicalLayerProfileId = typeof CanonicalLayerProfileId[keyof typeof CanonicalLayerProfileId];

export interface CanonicalLayerFamilyDefinition {
  readonly id: CanonicalLayerFamilyId;
  readonly label: string;
  readonly description: string;
  readonly displayOrder: number;
}

export interface CanonicalLayerDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly familyId: CanonicalLayerFamilyId;
  readonly displayOrder: number;
  readonly familyMemberOrder: number;
  readonly catalogVersion: typeof CANONICAL_LAYER_CATALOG_VERSION;
  readonly lifecycleStatus: CanonicalLayerLifecycleStatus;
  readonly availability: CanonicalLayerAvailability;
  readonly operationalStatus: CanonicalLayerOperationalStatus;
  readonly requiredCanonicalInputs: readonly string[];
  readonly evaluatorKey?: string;
  readonly evaluatorVersion?: string;
  readonly outputKinds: readonly string[];
  readonly provenancePolicy: string;
  readonly missingDataBehavior: string;
  readonly defaultProfileMembership: readonly CanonicalLayerProfileId[];
  readonly researcherSelectable: boolean;
  readonly unavailableReason?: string;
}

export interface CanonicalLayerDefaultProfile {
  readonly id: CanonicalLayerProfileId;
  readonly version: typeof CANONICAL_LAYER_DEFAULT_PROFILE_VERSION;
  readonly description: string;
  readonly layerIds: readonly string[];
}
