import type { ResearchAnchor } from "./researchBridgeTypes";
import { sha256Canonical } from "../studio/drafting/StudioDraftingContext";
import { StudioApiError } from "../studio/api/StudioApi";

const API_BASE = (import.meta.env.VITE_STUDIO_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function canonicalGraphPublication(anchor: ResearchAnchor) {
  if (anchor.kind !== "GRAPH") throw new Error("Only MANIFOLD graph anchors have a canonical publication route.");
  const unhashed = { schemaVersion: "research-source-publication/v1" as const, anchorId: anchor.anchorId,
    investigationId: anchor.investigationId, sourceWorkspace: "MANIFOLD" as const, sourceKind: "GRAPH" as const,
    sourceIdentity: anchor.sourceIdentity, sourceRevisionId: anchor.sourceRevisionId!, graphIdentity: `${anchor.graph.type}:${anchor.graph.id}`,
    graphType: anchor.graph.type, graphId: anchor.graph.id, graphRevision: anchor.graphRevision,
    classification: "CANONICAL" as const, insertionState: "INSERTABLE" as const,
    insertionReason: anchor.insertability.reason, displayTitle: anchor.display.title, displaySummary: anchor.display.summary,
    representationSchemaVersion: anchor.capturedRepresentation.schemaVersion, mediaType: anchor.capturedRepresentation.mediaType,
    capturedRepresentation: anchor.capturedRepresentation.value, collectedAt: anchor.collectedAt.toISOString(), createdAt: anchor.createdAt.toISOString() };
  return { ...unhashed, immutableSourceHash: await sha256Canonical(unhashed) };
}

export async function publishCanonicalGraphSource(anchor: ResearchAnchor, principalId: string): Promise<string> {
  const publication = await canonicalGraphPublication(anchor);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(anchor.investigationId)}/research-sources`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-ISEES-Principal-Id": principalId }, body: JSON.stringify(publication),
    });
  } catch {
    throw new StudioApiError("UNAVAILABLE_BACKEND", "Canonical Research source authority is temporarily unavailable.", "RESEARCH_SOURCE_AUTHORITY_UNAVAILABLE");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { detail?: string; error?: { code?: string; message?: string; requestId?: string } } | undefined;
    const code = body?.error?.code ?? "RESEARCH_SOURCE_PUBLICATION_FAILED";
    const message = body?.error?.message ?? body?.detail ?? "Canonical Research source authority is unavailable.";
    throw new StudioApiError(response.status >= 500 ? "UNAVAILABLE_BACKEND" : "ERROR", message, code, body?.error?.requestId);
  }
  return publication.immutableSourceHash;
}
