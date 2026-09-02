import type { ArtifactRepository, ArtifactType } from "../../artifacts/artifactTypes";

export type EvidenceKnownValue<T> = Readonly<{ status: "KNOWN"; value: T }>;
export type EvidenceUnknownValue = Readonly<{ status: "UNKNOWN" }>;
export type EvidenceUnavailableValue = Readonly<{ status: "UNAVAILABLE"; reason: string }>;
export type EvidenceOptionalValue<T> = EvidenceKnownValue<T> | EvidenceUnknownValue;

export interface EvidenceWorkspaceRecord {
  readonly evidenceId: string;
  readonly investigationId: string;
  readonly sourceArtifactId: string;
  readonly title: string;
  readonly artifactType: ArtifactType;
  readonly provenance: Readonly<{ repository: ArtifactRepository; createdAt: string }>;
  readonly description: EvidenceOptionalValue<string>;
  readonly confidence: EvidenceOptionalValue<number>;
  readonly doi: EvidenceOptionalValue<string>;
  readonly url: EvidenceOptionalValue<string>;
  readonly tags: EvidenceOptionalValue<readonly string[]>;
  readonly sourceDerivationIdentifiers: EvidenceOptionalValue<readonly string[]>;
  readonly payload: EvidenceUnavailableValue;
}

export interface EvidenceWorkspaceProjection {
  readonly kind: "EVIDENCE_WORKSPACE_PROJECTION";
  readonly investigation: Readonly<{ id: string; name: string }>;
  readonly records: readonly EvidenceWorkspaceRecord[];
}

export interface EvidenceInspectionSelection {
  readonly investigationId: string;
  readonly evidenceId: string;
}
