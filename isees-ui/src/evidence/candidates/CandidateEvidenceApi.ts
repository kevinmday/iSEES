import { resolveApiBaseUrl } from "../../api/ApiOrigin.ts";

export type ApiCandidateOrigin = "DISCOVERY" | "SUBMISSION" | "CURATED_REPOSITORY";
export type ApiCandidateLifecycle = "DISCOVERED" | "SUBMITTED" | "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED";
export type ApiCandidateAvailability = "AVAILABLE" | "UNAVAILABLE" | "MISSING" | "REDACTED" | "UNKNOWN";
export interface ApiCandidateAssociation { readonly kind: "INVESTIGATION" | "NODE" | "EDGE"; readonly canonicalIdentity: string; readonly basis: "EXACT_CANONICAL_ID" }
export interface ApiCandidateUpload { readonly originalFilename: string; readonly displayFilename: string; readonly byteSize: number; readonly detectedMediaType: string; readonly mediaCategory: string; readonly contentHash: Readonly<{ algorithm: "SHA-256"; digest: string }>; readonly storageIdentity: string }
export interface ApiCandidateRecord { readonly candidateId: string; readonly investigationId: string; readonly investigationAggregateRevision: number | null; readonly manifoldRevisionId: string | null; readonly principalOwnership: string; readonly intakePathway: "LEGACY" | "DIRECT_URL" | "RESEARCHER_NOTE" | "WEB_DISCOVERY" | "DIRECT_UPLOAD"; readonly publicationState: "NOT_REQUESTED"; readonly operationId: string | null; readonly normalizationVersion: string | null; readonly revision: number; readonly origin: ApiCandidateOrigin; readonly originIdentity: string; readonly lineage: Readonly<Record<string, unknown>>; readonly source: Readonly<Record<string, string | null | undefined>>; readonly association?: ApiCandidateAssociation; readonly lifecycleState: ApiCandidateLifecycle; readonly acquisitionState: string; readonly archiveState: string; readonly availability: ApiCandidateAvailability; readonly admitted: boolean; readonly canonicalMaterialization: null; readonly graphEffect: "NONE"; readonly researchInboxEffect: "NONE"; readonly upload?: ApiCandidateUpload; readonly reviewDecision?: Readonly<Record<string, unknown>>; readonly provenanceEvents: readonly Readonly<Record<string, unknown>>[]; readonly createdAt: string; readonly updatedAt: string }
export interface CandidateEvidenceApiScope { readonly principalId: string; readonly investigationId: string }
export interface CandidateListResponse { readonly investigationId: string; readonly investigationAggregateRevision: number; readonly manifoldRevisionId: string; readonly items: readonly ApiCandidateRecord[]; readonly nextCursor: string | null }
export interface SubmissionCommand { readonly schemaVersion: "candidate-evidence-command/v1"; readonly investigationId: string; readonly submissionIdentity: string; readonly submittedLocator?: string; readonly source: Readonly<Record<string, string>>; readonly idempotencyKey: string }
export interface ResearcherIntakeCommand { readonly schemaVersion: "candidate-evidence-intake/v1"; readonly investigationId: string; readonly expectedInvestigationRevision: number; readonly manifoldRevisionId: string; readonly pathway: "DIRECT_URL" | "RESEARCHER_NOTE" | "WEB_DISCOVERY"; readonly operationId: string; readonly submittedUrl?: string; readonly title?: string; readonly noteText?: string; readonly idempotencyKey: string }
export interface DirectUploadCommand { readonly schemaVersion: "candidate-evidence-upload/v1"; readonly investigationId: string; readonly expectedInvestigationRevision: number; readonly manifoldRevisionId: string; readonly operationId: string; readonly idempotencyKey: string; readonly title?: string; readonly noteText?: string; readonly file: File }
export interface LifecycleCommand { readonly schemaVersion: "candidate-evidence-command/v1"; readonly investigationId: string; readonly expectedRevision: number; readonly to: Exclude<ApiCandidateLifecycle, "DISCOVERED" | "SUBMITTED">; readonly reviewDecision?: { readonly decision: "DEFERRED" | "EXCLUDED"; readonly reason: string }; readonly idempotencyKey: string }
export interface CandidateEvidenceBackendError { readonly code: string; readonly message: string; readonly requestId?: string; readonly existingCandidateId?: string }
export class CandidateEvidenceHttpError extends Error {
  readonly status: number;
  readonly backendError?: CandidateEvidenceBackendError;
  constructor(status: number, message: string, backendError?: CandidateEvidenceBackendError) { super(message); this.status = status; this.backendError = backendError; }
}
export type CandidateEvidenceTransport = (input: string, init: RequestInit) => Promise<Response>;
export interface CandidateEvidenceRequestOptions { readonly baseUrl?: string; readonly transport?: CandidateEvidenceTransport; readonly cookieSource?: () => string }
const environment = (import.meta as ImportMeta & { readonly env?: Readonly<{ readonly VITE_CANDIDATE_EVIDENCE_API_BASE_URL?: string }> }).env;
export const CANDIDATE_EVIDENCE_API_BASE_URL = resolveApiBaseUrl(environment?.VITE_CANDIDATE_EVIDENCE_API_BASE_URL);
function csrfHeader(init: RequestInit | undefined, cookieSource: () => string): Readonly<Record<string, string>> {
  if (!init?.method || init.method === "GET") return {};
  const pair = cookieSource().split(";").map((part) => part.trim()).find((part) => part.startsWith("isees_csrf="));
  if (!pair) return {};
  try { const value = decodeURIComponent(pair.slice("isees_csrf=".length)); return value ? { "X-ISEES-CSRF": value } : {}; } catch { return {}; }
}
function backendError(value: unknown): CandidateEvidenceBackendError | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const envelope = (value as { readonly error?: unknown }).error;
  if (envelope === null || typeof envelope !== "object" || Array.isArray(envelope)) return undefined;
  const error = envelope as { readonly code?: unknown; readonly message?: unknown; readonly requestId?: unknown; readonly existingCandidateId?: unknown };
  if (typeof error.code !== "string" || typeof error.message !== "string") return undefined;
  return Object.freeze({ code: error.code, message: error.message, ...(typeof error.requestId === "string" ? { requestId: error.requestId } : {}), ...(typeof error.existingCandidateId === "string" ? { existingCandidateId: error.existingCandidateId } : {}) });
}
export function createCandidateEvidenceRequester(options: CandidateEvidenceRequestOptions = {}) {
  const baseUrl = (options.baseUrl ?? CANDIDATE_EVIDENCE_API_BASE_URL).replace(/\/$/, "");
  const transport = options.transport ?? ((input: string, init: RequestInit) => fetch(input, init));
  const cookieSource = options.cookieSource ?? (() => typeof document === "undefined" ? "" : document.cookie);
  return async function candidateEvidenceRequest<T>(scope: CandidateEvidenceApiScope, path: string, init?: RequestInit, decode?: (body: unknown) => T, acceptNonOk = false): Promise<T> {
    const response = await transport(`${baseUrl}/api/v1/investigations/${encodeURIComponent(scope.investigationId)}/candidate-evidence${path}`, { ...init, credentials: "include", headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), "X-ISEES-Principal-Id": scope.principalId, ...csrfHeader(init, cookieSource), ...init?.headers } });
    let body: unknown;
    try { body = await response.json(); } catch { throw new CandidateEvidenceHttpError(response.status, `Candidate Evidence returned malformed JSON (${response.status})`); }
    if (!response.ok && !acceptNonOk) {
      const structured = backendError(body);
      throw new CandidateEvidenceHttpError(response.status, structured?.message ?? `Candidate Evidence request failed (${response.status})`, structured);
    }
    return decode === undefined ? body as T : decode(body);
  };
}
export const candidateEvidenceRequest = createCandidateEvidenceRequester();
export const candidateEvidenceApi = Object.freeze({
  list: (scope: CandidateEvidenceApiScope, signal?: AbortSignal) => candidateEvidenceRequest<CandidateListResponse>(scope, "?limit=100", { signal }),
  submit: (scope: CandidateEvidenceApiScope, command: SubmissionCommand) => candidateEvidenceRequest<ApiCandidateRecord>(scope, "/submissions", { method: "POST", body: JSON.stringify(command) }),
  intake: (scope: CandidateEvidenceApiScope, command: ResearcherIntakeCommand) => candidateEvidenceRequest<ApiCandidateRecord>(scope, "/researcher-intake", { method: "POST", body: JSON.stringify(command) }),
  upload: (scope: CandidateEvidenceApiScope, command: DirectUploadCommand) => { const body = new FormData(); Object.entries(command).forEach(([key, value]) => body.append(key, value instanceof File ? value : String(value))); return candidateEvidenceRequest<ApiCandidateRecord>(scope, "/direct-uploads", { method: "POST", body }); },
  transition: (scope: CandidateEvidenceApiScope, candidateId: string, command: LifecycleCommand) => candidateEvidenceRequest<ApiCandidateRecord>(scope, `/${encodeURIComponent(candidateId)}/lifecycle-transitions`, { method: "POST", body: JSON.stringify(command) }),
});
