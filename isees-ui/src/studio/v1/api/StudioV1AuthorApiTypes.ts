import type { ArtifactIdentity, AuthorRevision, FrozenResearchSourceSnapshot, ManifoldArtifactManifest, PROJECTION_FORMATS, PROJECTION_STATES, SemanticDocument } from "../../contracts/StudioV1Contract.ts";

export type StudioV1AuthorOperation = "createArtifact" | "saveRevision" | "discoverArtifacts" | "getArtifact" | "listRevisions" | "getRevision" | "getSourceSnapshot" | "listProjectionStatuses" | "createExport" | "getExport" | "downloadExport" | "materializeManifoldArtifact" | "getManifoldArtifact" | "downloadManifoldArtifact" | "exportCurrentDraftPdf" | "exportCurrentDraftDocx";
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
export interface MaterializeManifoldArtifactRequest { readonly schemaVersion:"studio-manifold-artifact-manifest/v1"; readonly rendererVersion:"studio-v1-manifold-artifact/1"; readonly configurationIdentity:"manifold-artifact-default"; readonly configurationVersion:"1"; readonly configurationHash:string; readonly idempotencyKey:string }
export interface ManifoldArtifactStatus { readonly projectionId:string; readonly artifactId:string; readonly revisionId:string; readonly revisionNumber:number; readonly parentContentHash:string; readonly format:"MANIFOLD_ARTIFACT"; readonly state:typeof PROJECTION_STATES[number]; readonly schemaVersion:"studio-manifold-artifact-manifest/v1"; readonly rendererVersion:string; readonly configurationIdentity:string; readonly configurationVersion:string; readonly configurationHash:string; readonly outputHash:string|null; readonly mediaType:string|null; readonly filename:string|null; readonly byteLength:number|null; readonly failureCategory:string|null; readonly failureMessage:string|null; readonly downloadAvailable:boolean }
export interface ManifoldArtifactDownload { readonly blob:Blob; readonly filename:string; readonly outputHash:string; readonly manifest:ManifoldArtifactManifest }
export type CreateExportRequest = { readonly format:"PDF"; readonly templateProfileVersion:"investigation-report-pdf/1"; readonly rendererVersion:"studio-v1-reportlab-pdf/1"; readonly configurationHash:string; readonly idempotencyKey:string } | { readonly format:"DOCX"; readonly templateProfileVersion:"investigation-report-docx/1"; readonly rendererVersion:"studio-v1-python-docx/1"; readonly configurationHash:string; readonly idempotencyKey:string };
export interface ExportStatus { readonly exportId:string; readonly projectionId:string; readonly artifactId:string; readonly revisionId:string; readonly revisionNumber:number; readonly sourceHash:string; readonly format:"PDF"|"DOCX"; readonly state:"QUEUED"|"REBUILDING"|"CURRENT"|"FAILED"; readonly rendererVersion:string; readonly templateProfileVersion:string; readonly configurationHash:string; readonly exportedAt:string; readonly outputHash:string|null; readonly mediaType:string|null; readonly filename:string|null; readonly byteLength:number|null; readonly failureCode:string|null; readonly failureMessage:string|null; readonly downloadAvailable:boolean }
export interface CurrentDraftPdfRequest { readonly sourceKind:"CURRENT_DRAFT"; readonly documentId:string; readonly investigationId?:string; readonly semanticContent:SemanticDocument; readonly sourceSnapshots:readonly FrozenResearchSourceSnapshot[]; readonly sourceHash:string; readonly exportedAt:string; readonly profile:"INVESTIGATION_REPORT"; readonly profileVersion:"investigation-report/v1"; readonly templateProfileVersion:"investigation-report-pdf/1"; readonly rendererVersion:"studio-v1-reportlab-pdf/1"; readonly configurationHash:string }
export interface CurrentDraftPdfDownload { readonly blob:Blob; readonly filename:string; readonly sourceHash:string }
export interface CurrentDraftDocxRequest { readonly sourceKind:"CURRENT_DRAFT"; readonly documentId:string; readonly investigationId?:string; readonly semanticContent:SemanticDocument; readonly sourceSnapshots:readonly FrozenResearchSourceSnapshot[]; readonly sourceHash:string; readonly exportedAt:string; readonly profile:"INVESTIGATION_REPORT"; readonly profileVersion:"investigation-report/v1"; readonly templateProfileVersion:"investigation-report-docx/1"; readonly rendererVersion:"studio-v1-python-docx/1"; readonly configurationHash:string }
export interface CurrentDraftDocxDownload { readonly blob:Blob; readonly filename:string; readonly sourceHash:string }
