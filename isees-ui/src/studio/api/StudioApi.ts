export const STUDIO_API_BASE_URL = (import.meta.env.VITE_STUDIO_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? "http://127.0.0.1:8001";

export type StudioLifecycle = "DRAFT" | "CANDIDATE_KNOWLEDGE_ARTIFACT" | "MANIFOLD_CANDIDATE_NODE" | "REVIEW_TEST" | "ACCEPTED_KNOWLEDGE" | "RETURNED" | "REJECTED";
export type ProjectionFormat = "HTML" | "PDF" | "DOCX";

export interface StudioScope { readonly investigationId: string; readonly principalId: string }
export interface StudioProjectionRecord { projectionId: string; artifactVersionId: string; projectionFormat: ProjectionFormat; readinessState: "READY" | "READY_WITH_WARNINGS" | "NOT_READY"; validationWarnings: string[]; materializationState: "NOT_MATERIALIZED" | "MATERIALIZED" | "FAILED"; validatorVersion: string; validatedAt: string; outputIdentity?: string; outputLocation?: string; outputHash?: string; materializedAt?: string }
export interface StudioArtifactProjection {
  artifact: { artifactId: string; investigationId: string; ownerPrincipalId: string; revision: number; lifecycleState: StudioLifecycle; currentVersionNumber: number; currentVersionId: string; createdAt: string; updatedAt: string; candidateArtifactId?: string; manifoldCandidateNodeId?: string };
  currentVersion: { versionId: string; versionNumber: number; authorSchemaVersion: string; document: unknown; sourceSnapshotIds: string[]; claims: Array<{ claimId: string; claimText?: string; lineageState: "SUPPORTED" | "UNRESOLVED" | "CONTRADICTED" | "ORPHANED" }>; citations: Array<{ citationId: string; sourceSnapshotId: string }>; claimSourceMappings: Array<{ mappingId: string; claimId: string; sourceSnapshotId: string; relationshipType: string; citationId?: string }>; createdAt: string; comparisonContext?: { focusedEventId?: string; comparisonEventId?: string } };
  sourceSnapshots: Array<{ snapshotId: string; sourceIdentity: string; sourceWorkspace: string; sourceKind: string; sourceInvestigationId: string; resolutionStatus: "AVAILABLE" | "STALE" | "MISSING" | "REDACTED" | "UNAVAILABLE" | "UNKNOWN" }>;
  candidateArtifacts: Array<{ candidateArtifactId: string; readinessState: string; validationWarnings: string[] }>;
  projections: StudioProjectionRecord[];
}

export class StudioApiError extends Error {
  readonly kind: "CONFLICT" | "STALE_REVISION" | "FORBIDDEN" | "UNAVAILABLE_BACKEND" | "ERROR";
  readonly code?: string;
  constructor(kind: "CONFLICT" | "STALE_REVISION" | "FORBIDDEN" | "UNAVAILABLE_BACKEND" | "ERROR", message: string, code?: string) { super(message); this.kind = kind; this.code = code; }
}

function safeMessage(value: unknown): string {
  if (typeof value !== "string") return "The STUDIO operation could not be completed.";
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 240);
}

async function request<T>(scope: StudioScope, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${STUDIO_API_BASE_URL}/api/v1/investigations/${encodeURIComponent(scope.investigationId)}/studio-artifacts${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", "X-ISEES-Principal-Id": scope.principalId, ...init?.headers },
    });
  } catch {
    throw new StudioApiError("UNAVAILABLE_BACKEND", "The STUDIO backend is unavailable. No change was claimed.");
  }
  const body = await response.json().catch(() => undefined) as { error?: { code?: string; message?: string }; detail?: unknown } | undefined;
  if (!response.ok) {
    const code = body?.error?.code;
    const message = safeMessage(body?.error?.message ?? (typeof body?.detail === "string" ? body.detail : undefined));
    const kind = response.status === 403 ? "FORBIDDEN" : code === "REVISION_CONFLICT" ? "STALE_REVISION" : response.status === 409 ? "CONFLICT" : response.status >= 500 ? "UNAVAILABLE_BACKEND" : "ERROR";
    throw new StudioApiError(kind, message, code);
  }
  return body as T;
}

export const studioApi = {
  list: (scope: StudioScope) => request<{ investigationId: string; items: StudioArtifactProjection[] }>(scope, ""),
  get: (scope: StudioScope, artifactId: string) => request<StudioArtifactProjection>(scope, `/${encodeURIComponent(artifactId)}`),
  post: <T>(scope: StudioScope, path: string, command: object) => request<T>(scope, path, { method: "POST", body: JSON.stringify(command) }),
};
