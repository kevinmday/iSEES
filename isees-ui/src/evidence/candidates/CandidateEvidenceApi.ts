export type ApiCandidateOrigin = "DISCOVERY" | "SUBMISSION" | "CURATED_REPOSITORY";
export type ApiCandidateLifecycle = "DISCOVERED" | "SUBMITTED" | "REFERENCED" | "IN_REVIEW" | "DEFERRED" | "EXCLUDED";
export type ApiCandidateAvailability = "AVAILABLE" | "UNAVAILABLE" | "MISSING" | "REDACTED" | "UNKNOWN";
export interface ApiCandidateAssociation { readonly kind: "INVESTIGATION" | "NODE" | "EDGE"; readonly canonicalIdentity: string; readonly basis: "EXACT_CANONICAL_ID" }
export interface ApiCandidateRecord { readonly candidateId: string; readonly investigationId: string; readonly revision: number; readonly origin: ApiCandidateOrigin; readonly originIdentity: string; readonly lineage: Readonly<Record<string, unknown>>; readonly source: Readonly<Record<string, string | null | undefined>>; readonly association?: ApiCandidateAssociation; readonly lifecycleState: ApiCandidateLifecycle; readonly acquisitionState: string; readonly archiveState: string; readonly availability: ApiCandidateAvailability; readonly reviewDecision?: Readonly<Record<string, unknown>>; readonly provenanceEvents: readonly Readonly<Record<string, unknown>>[]; readonly createdAt: string; readonly updatedAt: string }
export interface CandidateEvidenceApiScope { readonly principalId: string; readonly investigationId: string }
export interface CandidateListResponse { readonly investigationId: string; readonly items: readonly ApiCandidateRecord[]; readonly nextCursor: string | null }
export interface SubmissionCommand { readonly schemaVersion: "candidate-evidence-command/v1"; readonly investigationId: string; readonly submissionIdentity: string; readonly submittedLocator?: string; readonly source: Readonly<Record<string, string>>; readonly idempotencyKey: string }
export interface LifecycleCommand { readonly schemaVersion: "candidate-evidence-command/v1"; readonly investigationId: string; readonly expectedRevision: number; readonly to: Exclude<ApiCandidateLifecycle, "DISCOVERED" | "SUBMITTED">; readonly reviewDecision?: { readonly decision: "DEFERRED" | "EXCLUDED"; readonly reason: string }; readonly idempotencyKey: string }
export class CandidateEvidenceHttpError extends Error { readonly status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export const CANDIDATE_EVIDENCE_API_BASE_URL = (import.meta.env.VITE_CANDIDATE_EVIDENCE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:8001";
async function request<T>(scope: CandidateEvidenceApiScope, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CANDIDATE_EVIDENCE_API_BASE_URL}/api/v1/investigations/${encodeURIComponent(scope.investigationId)}/candidate-evidence${path}`, { ...init, headers: { "Content-Type": "application/json", "X-ISEES-Principal-Id": scope.principalId, ...init?.headers } });
  if (!response.ok) { let message = `Candidate Evidence request failed (${response.status})`; try { const body = await response.json() as { error?: { message?: string }; detail?: string }; message = body.error?.message ?? body.detail ?? message; } catch { /* retain status message */ } throw new CandidateEvidenceHttpError(response.status, message); }
  return response.json() as Promise<T>;
}
export const candidateEvidenceApi = Object.freeze({
  list: (scope: CandidateEvidenceApiScope, signal?: AbortSignal) => request<CandidateListResponse>(scope, "?limit=100", { signal }),
  submit: (scope: CandidateEvidenceApiScope, command: SubmissionCommand) => request<ApiCandidateRecord>(scope, "/submissions", { method: "POST", body: JSON.stringify(command) }),
  transition: (scope: CandidateEvidenceApiScope, candidateId: string, command: LifecycleCommand) => request<ApiCandidateRecord>(scope, `/${encodeURIComponent(candidateId)}/lifecycle-transitions`, { method: "POST", body: JSON.stringify(command) }),
});
