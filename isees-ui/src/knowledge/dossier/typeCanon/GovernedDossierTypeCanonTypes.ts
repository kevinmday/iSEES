import type { OperationalDossierProfileId, OperationalDossierSectionId, OperationalDossierSectionState } from "../../../intelligence/selection/profiles/OperationalDossierProfileTypes.ts";

export const GOVERNED_DOSSIER_TYPE_CANON_VERSION = "governed-dossier-type-canon/v1" as const;

export type GovernedDossierTypeCanonCompleteness = "COMPLETE" | "GENERIC_FALLBACK";

export interface GovernedDossierTypeCanonFieldDefinition {
  readonly field: string;
  readonly sectionId: OperationalDossierSectionId;
  readonly required: boolean;
  readonly unavailableState: OperationalDossierSectionState;
}

export interface GovernedDossierTypeCanonDefinition {
  readonly typeCanonVersion: typeof GOVERNED_DOSSIER_TYPE_CANON_VERSION;
  readonly familyId: OperationalDossierProfileId;
  readonly canonicalSemanticTypes: readonly string[];
  readonly compatibilityProjectionTypes: readonly string[];
  readonly completeness: GovernedDossierTypeCanonCompleteness;
  readonly sectionOrder: readonly OperationalDossierSectionId[];
  readonly fields: readonly GovernedDossierTypeCanonFieldDefinition[];
  readonly confidencePolicy: "AUTHORITATIVELY_SUPPLIED_ONLY";
  readonly unavailableStates: readonly OperationalDossierSectionState[];
  readonly selectionBoundary: "SYNCHRONOUS_DETERMINISTIC_LOCAL_ZERO_COST";
}
