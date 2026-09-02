import type { CandidateId, CandidateOriginLineage, CandidateSourceDescription, ExactCanonicalAssociation } from "./CandidateEvidenceTypes.ts";

export interface CandidateArtifactDraft {
  readonly title: string;
  readonly source: CandidateSourceDescription;
  readonly association?: ExactCanonicalAssociation;
}
export interface AdmitCandidateCommand {
  readonly candidateId: CandidateId;
  readonly investigationId: string;
  readonly expectedCandidateRevision: number;
  readonly expectedInvestigationRevision: number;
  readonly reviewerId: string;
  readonly decisionReason: string;
  readonly idempotencyKey: string;
  readonly artifactDraft: CandidateArtifactDraft;
}
export interface CandidateAdmissionReceipt {
  readonly receiptIdentity: string;
  readonly candidateId: CandidateId;
  readonly investigationId: string;
  readonly artifactId: string;
  readonly reviewerId: string;
  readonly decidedAt: string;
  readonly committedCandidateRevision: number;
  readonly committedInvestigationRevision: number;
  readonly idempotencyKey: string;
  readonly originLineage: CandidateOriginLineage;
  readonly admissionProvenance: readonly Readonly<Record<string, unknown>>[];
}
