export type CandidateId = string;
export type CandidateOrigin = "DISCOVERY" | "SUBMISSION";
export type CandidateLifecycleState =
  | "DISCOVERED"
  | "SUBMITTED"
  | "REFERENCED"
  | "ACQUIRED"
  | "IN_REVIEW"
  | "ADMITTED"
  | "DEFERRED"
  | "EXCLUDED";
export type CandidateAcquisitionState = "NOT_REQUESTED" | "QUEUED" | "ACQUIRING" | "ACQUIRED" | "FAILED" | "BLOCKED";
export type CandidateArchiveState = "NOT_REQUESTED" | "QUEUED" | "ARCHIVED" | "FAILED" | "PROHIBITED";
export type CandidateAvailability = "AVAILABLE" | "UNAVAILABLE" | "MISSING" | "REDACTED" | "UNKNOWN";
export type CandidateActorKind = "HUMAN" | "AUTOMATION" | "SYSTEM";

export interface CandidateActor {
  readonly actorId: string;
  readonly kind: CandidateActorKind;
}

export interface ExactCanonicalAssociation {
  readonly kind: "NODE" | "EDGE";
  readonly canonicalIdentity: string;
  readonly basis: "EXACT_CANONICAL_ID";
}

export interface CandidateDigest {
  readonly algorithm: string;
  readonly contentHash: string;
}

export interface CandidateAcquiredContent {
  readonly objectIdentity: string;
  readonly archiveIdentity?: string;
  readonly byteLength: number;
  readonly detectedMimeType?: string;
  readonly digest: CandidateDigest;
}

export interface DiscoveryLineage {
  readonly kind: "DISCOVERY";
  readonly discoveredAt: string;
  readonly querySpecification: Readonly<Record<string, unknown>>;
  readonly connector: string;
  readonly connectorVersion: string;
}

export interface SubmissionLineage {
  readonly kind: "SUBMISSION";
  readonly submittedAt: string;
  readonly submitterId: string;
  readonly submittedLocator?: string;
  readonly submissionIdentity: string;
}

export type CandidateOriginLineage = DiscoveryLineage | SubmissionLineage;

export interface CandidateSourceDescription {
  readonly originalLocator?: string;
  readonly normalizedUrl?: string;
  readonly sourceDomain?: string;
  readonly repository?: string;
  readonly doi?: string;
  readonly citation?: string;
  readonly title?: string;
  readonly publisherOrCustodian?: string;
  readonly publicationOrCaptureDate?: string;
  readonly declaredMimeType?: string;
}

export interface CandidateReviewDecision {
  readonly decision: "ADMITTED" | "DEFERRED" | "EXCLUDED";
  readonly reviewerId: string;
  readonly decidedAt: string;
  readonly reason: string;
  readonly admissionReceiptIdentity?: string;
  readonly admittedArtifactId?: string;
}

export interface CandidateProvenanceEvent {
  readonly eventId: string;
  readonly candidateId: CandidateId;
  readonly investigationId: string;
  readonly actor: CandidateActor;
  readonly occurredAt: string;
  readonly action: string;
  readonly priorRevision: number;
  readonly resultingRevision: number;
  readonly priorLifecycleState: CandidateLifecycleState;
  readonly resultingLifecycleState: CandidateLifecycleState;
}

export interface CandidateEvidence {
  readonly candidateId: CandidateId;
  readonly investigationId: string;
  readonly revision: number;
  readonly origin: CandidateOrigin;
  readonly originIdentity: string;
  readonly lineage: CandidateOriginLineage;
  readonly source: CandidateSourceDescription;
  readonly association?: ExactCanonicalAssociation;
  readonly lifecycleState: CandidateLifecycleState;
  readonly acquisitionState: CandidateAcquisitionState;
  readonly archiveState: CandidateArchiveState;
  readonly availability: CandidateAvailability;
  readonly acquiredContent?: CandidateAcquiredContent;
  readonly reviewDecision?: CandidateReviewDecision;
  readonly provenanceEvents: readonly CandidateProvenanceEvent[];
}

export interface CreateCandidateEvidenceInput {
  readonly candidateId: string;
  readonly investigationId: string;
  readonly origin: CandidateOrigin;
  readonly originIdentity: string;
  readonly lineage: CandidateOriginLineage;
  readonly source?: CandidateSourceDescription;
  readonly association?: ExactCanonicalAssociation;
}

