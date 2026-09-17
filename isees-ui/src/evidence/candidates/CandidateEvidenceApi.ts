import { resolveApiBaseUrl } from "../../api/ApiOrigin";

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
export class CandidateEvidenceHttpError extends Error { readonly status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export const CANDIDATE_EVIDENCE_API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_CANDIDATE_EVIDENCE_API_BASE_URL as string | undefined);
function csrfHeader(init?: RequestInit): Readonly<Record<string, string>> {
  if (!init?.method || init.method === "GET" || typeof document === "undefined") return {};
  const pair = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("isees_csrf="));
  if (!pair) return {};
  try { const value = decodeURIComponent(pair.slice("isees_csrf=".length)); return value ? { "X-ISEES-CSRF": value } : {}; } catch { return {}; }
}
async function request<T>(scope: CandidateEvidenceApiScope, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CANDIDATE_EVIDENCE_API_BASE_URL}/api/v1/investigations/${encodeURIComponent(scope.investigationId)}/candidate-evidence${path}`, { ...init, credentials: "include", headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), "X-ISEES-Principal-Id": scope.principalId, ...csrfHeader(init), ...init?.headers } });
  if (!response.ok) { let message = `Candidate Evidence request failed (${response.status})`; try { const body = await response.json() as { error?: { message?: string }; detail?: string }; message = body.error?.message ?? body.detail ?? message; } catch { /* retain status message */ } throw new CandidateEvidenceHttpError(response.status, message); }
  return response.json() as Promise<T>;
}
export const candidateEvidenceApi = Object.freeze({
  list: (scope: CandidateEvidenceApiScope, signal?: AbortSignal) => request<CandidateListResponse>(scope, "?limit=100", { signal }),
  submit: (scope: CandidateEvidenceApiScope, command: SubmissionCommand) => request<ApiCandidateRecord>(scope, "/submissions", { method: "POST", body: JSON.stringify(command) }),
  intake: (scope: CandidateEvidenceApiScope, command: ResearcherIntakeCommand) => request<ApiCandidateRecord>(scope, "/researcher-intake", { method: "POST", body: JSON.stringify(command) }),
  upload: (scope: CandidateEvidenceApiScope, command: DirectUploadCommand) => { const body = new FormData(); Object.entries(command).forEach(([key, value]) => body.append(key, value instanceof File ? value : String(value))); return request<ApiCandidateRecord>(scope, "/direct-uploads", { method: "POST", body }); },
  transition: (scope: CandidateEvidenceApiScope, candidateId: string, command: LifecycleCommand) => request<ApiCandidateRecord>(scope, `/${encodeURIComponent(candidateId)}/lifecycle-transitions`, { method: "POST", body: JSON.stringify(command) }),
});
