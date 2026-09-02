import type { ApiCandidateLifecycle, ApiCandidateRecord, CandidateEvidenceApiScope } from "./CandidateEvidenceApi";
export type CandidateRequestStatus = "IDLE" | "LOADING" | "READY" | "UNAVAILABLE" | "FAILED";
export interface CandidateRequestState { readonly scope?: CandidateEvidenceApiScope; readonly status: CandidateRequestStatus; readonly records: readonly ApiCandidateRecord[]; readonly selectedCandidateId?: string; readonly error?: string }
export const EMPTY_CANDIDATE_REQUEST: CandidateRequestState = Object.freeze({ status: "IDLE", records: Object.freeze([]) });
export function beginCandidateRequest(scope: CandidateEvidenceApiScope): CandidateRequestState { return { scope, status: "LOADING", records: [], selectedCandidateId: undefined, error: undefined }; }
export function settleCandidateRequest(current: CandidateRequestState, scope: CandidateEvidenceApiScope, status: "READY" | "UNAVAILABLE" | "FAILED", records: readonly ApiCandidateRecord[] = [], error?: string): CandidateRequestState {
  if (current.scope?.investigationId !== scope.investigationId || current.scope.principalId !== scope.principalId) return current;
  const refreshed = [...records];
  const selected = current.records.find((record) => record.candidateId === current.selectedCandidateId);
  if (status === "READY" && selected) {
    const refreshedIndex = refreshed.findIndex((record) => record.candidateId === selected.candidateId);
    if (refreshedIndex < 0) refreshed.push(selected);
    else if (refreshed[refreshedIndex]!.revision < selected.revision) refreshed[refreshedIndex] = selected;
  }
  return { ...current, status, records: refreshed, error };
}
export function reconcileCandidateTransition(current: CandidateRequestState, scope: CandidateEvidenceApiScope, updated: ApiCandidateRecord): CandidateRequestState {
  if (current.scope?.investigationId !== scope.investigationId || current.scope.principalId !== scope.principalId || updated.investigationId !== scope.investigationId) return current;
  return { ...current, status: "READY", records: current.records.map((record) => record.candidateId === updated.candidateId ? updated : record), selectedCandidateId: updated.candidateId, error: undefined };
}
export function partitionCandidateEvidence(records: readonly ApiCandidateRecord[]) { return { candidate: records.filter((record) => record.origin === "DISCOVERY" || record.origin === "SUBMISSION"), curated: records.filter((record) => record.origin === "CURATED_REPOSITORY") } as const; }
const NEXT: Readonly<Record<ApiCandidateLifecycle, readonly ApiCandidateLifecycle[]>> = Object.freeze({ DISCOVERED: ["REFERENCED"], SUBMITTED: ["REFERENCED"], REFERENCED: ["IN_REVIEW"], IN_REVIEW: ["DEFERRED", "EXCLUDED"], DEFERRED: ["IN_REVIEW"], EXCLUDED: [] });
export function permittedReviewActions(record: ApiCandidateRecord): readonly ApiCandidateLifecycle[] { return NEXT[record.lifecycleState] ?? []; }
export function reviewActionLabel(record: ApiCandidateRecord, to: ApiCandidateLifecycle): string {
  if (record.lifecycleState === "DEFERRED" && to === "IN_REVIEW") return "Reopen Review";
  return ({ IN_REVIEW: "Begin Review", DEFERRED: "Defer", EXCLUDED: "Exclude", REFERENCED: "Reference" } as Partial<Record<ApiCandidateLifecycle, string>>)[to] ?? to;
}
