import type { ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot, PROJECTION_FORMATS, PROJECTION_STATES } from "../../contracts/StudioV1Contract.ts";

export type StudioV1AuthorOperation = "createArtifact" | "saveRevision" | "discoverArtifacts" | "getArtifact" | "listRevisions" | "getRevision" | "getSourceSnapshot" | "listProjectionStatuses";
export type StudioV1AuthorErrorCode = "UNAUTHENTICATED" | "CSRF_REJECTED" | "INVESTIGATION_NOT_FOUND" | "ARTIFACT_NOT_FOUND" | "REVISION_NOT_FOUND" | "STUDIO_V1_UNAVAILABLE" | "CONTRACT_INVALID" | "ROUTE_PAYLOAD_MISMATCH" | "HASH_MISMATCH" | "EXPECTED_HEAD_CONFLICT" | "IDEMPOTENCY_KEY_REUSE" | "PERSISTENCE_UNAVAILABLE" | "MALFORMED_RESPONSE" | "NETWORK_FAILURE" | "ABORTED" | "SAFE_INTERNAL_FAILURE";
export type StudioV1DecodeFailure = "DISCOVERY_DECODE_FAILED" | "REVISION_DECODE_FAILED" | "CONTENT_HASH_MISMATCH";

export class StudioV1AuthorClientError extends Error {
  readonly code: StudioV1AuthorErrorCode;
  readonly status?: number;
  readonly operation: StudioV1AuthorOperation;
  readonly retryable: boolean;
  readonly conflict: boolean;
  readonly decodeFailure?: StudioV1DecodeFailure;
  constructor(code: StudioV1AuthorErrorCode, message: string, operation: StudioV1AuthorOperation, options: { status?: number; retryable?: boolean; conflict?: boolean; decodeFailure?: StudioV1DecodeFailure } = {}) {
    super(message); this.name = "StudioV1AuthorClientError"; this.code = code; this.operation = operation;
    this.status = options.status; this.retryable = options.retryable ?? false; this.conflict = options.conflict ?? false;
    this.decodeFailure = options.decodeFailure;
  }
}

export type AuthorArtifactInput = Omit<ArtifactIdentity, "authorPrincipalId">;
export type AuthorRevisionInput = Omit<AuthorRevision, "authorPrincipalId">;
export interface ProjectionInput { readonly format: typeof PROJECTION_FORMATS[number]; readonly templateProfileVersion: string; readonly rendererVersion: string; readonly configurationHash: string; readonly priorSuccessfulProjectionId?: string }
export interface SaveAuthorRequest { readonly artifact: AuthorArtifactInput; readonly revision: AuthorRevisionInput; readonly snapshots: readonly FrozenResearchSourceSnapshot[]; readonly projections: readonly ProjectionInput[]; readonly expectedHeadRevisionId?: string; readonly idempotencyKey: string }
export interface SaveResult { readonly artifactId: string; readonly revisionId: string; readonly revisionNumber: number; readonly projectionIds: readonly string[]; readonly replayed: boolean }
export interface ArtifactHead { readonly artifactId: string; readonly currentRevisionId: string | null; readonly currentRevisionNumber: number | null; readonly contentHash: string | null; readonly savedAt: string | null }
export interface ArtifactDiscoveryItem { readonly artifactId:string; readonly investigationId:string; readonly ownerPrincipalId:string; readonly profile:string; readonly lifecycleClassification:string; readonly createdAt:string; readonly currentRevisionId:string|null; readonly currentRevisionNumber:number|null; readonly contentHash:string|null; readonly savedAt:string|null }
export interface ArtifactDiscoveryList { readonly items:readonly ArtifactDiscoveryItem[] }
export interface RevisionMetadata { readonly revisionId: string; readonly revisionNumber: number; readonly parentRevisionId: string | null; readonly contentHash: string; readonly savedAt: string; readonly sourceSnapshots: readonly { readonly snapshotId: string; readonly snapshotHash: string }[] }
export interface RevisionList { readonly artifactId: string; readonly items: readonly RevisionMetadata[] }
export interface RevisionDetail { readonly artifactId: string; readonly revision: AuthorRevision }
export interface ProjectionStatus { readonly projectionId: string; readonly format: typeof PROJECTION_FORMATS[number]; readonly parentRevisionId: string; readonly state: typeof PROJECTION_STATES[number]; readonly failureCategory: string | null; readonly outputHash: string | null }
export interface ProjectionStatusList { readonly artifactId: string; readonly revisionId: string; readonly items: readonly ProjectionStatus[] }
