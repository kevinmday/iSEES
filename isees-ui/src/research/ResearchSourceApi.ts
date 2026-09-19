import type { ResearchAnchor } from "./researchBridgeTypes";
import { sha256Canonical } from "../studio/drafting/StudioDraftingContext";
import { StudioApiError } from "../studio/api/StudioApi";
import { resolveApiBaseUrl } from "../api/ApiOrigin.ts";
import { createTypedResearchAnchor } from "./ResearchAnchorContract.ts";

const API_BASE = resolveApiBaseUrl(import.meta.env.VITE_STUDIO_API_BASE_URL as string | undefined);

interface CandidateEvidenceResearchSource { readonly anchorId:string; readonly investigationId:string; readonly candidateId:string; readonly displayTitle:string; readonly displaySummary:string; readonly source:Readonly<Record<string, unknown>>; readonly collectedAt:string; readonly createdAt:string }

export async function listCandidateEvidenceResearchAnchors(investigationId:string, principalId:string, signal?:AbortSignal):Promise<readonly ResearchAnchor[]> {
  const response=await fetch(`${API_BASE}/api/v1/investigations/${encodeURIComponent(investigationId)}/research-sources/candidate-evidence`,{credentials:"include",headers:{"X-ISEES-Principal-Id":principalId},signal});
  if(!response.ok) throw new Error(`Research Inbox refresh failed (${response.status}).`);
  const body=await response.json() as {schemaVersion?:unknown;items?:unknown};
  if(body.schemaVersion!=="research-candidate-evidence-list/v1"||!Array.isArray(body.items)) throw new Error("Research Inbox returned malformed Candidate Evidence anchors.");
  return body.items.map((raw,index)=>{
    if(raw===null||typeof raw!=="object"||Array.isArray(raw)) throw new Error(`Malformed Candidate Evidence anchor ${index}.`);
    const item=raw as CandidateEvidenceResearchSource;
    for(const value of [item.anchorId,item.investigationId,item.candidateId,item.displayTitle,item.displaySummary,item.collectedAt,item.createdAt]) if(typeof value!=="string") throw new Error(`Malformed Candidate Evidence anchor ${index}.`);
    if(item.investigationId!==investigationId||item.source===null||typeof item.source!=="object"||Array.isArray(item.source)) throw new Error(`Candidate Evidence anchor ${index} is outside the active Investigation.`);
    const anchor=createTypedResearchAnchor({investigationId:item.investigationId,kind:"EVIDENCE_RECORD",sourceWorkspace:"EVIDENCE",sourceIdentity:item.candidateId,collectedAt:new Date(item.collectedAt),classification:"UNDETERMINED",display:{title:item.displayTitle,summary:item.displaySummary},insertability:{state:"INSPECTION_ONLY",reason:"Candidate Evidence remains review-only and is not canonical Investigation Evidence."},capturedRepresentation:{schemaVersion:"candidate-evidence-research-reference/v1",mediaType:"application/json",value:{candidateId:item.candidateId,source:item.source}}});
    if(anchor.anchorId!==item.anchorId) throw new Error(`Candidate Evidence anchor ${index} has inconsistent identity.`);
    return anchor;
  });
}

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
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-ISEES-Principal-Id": principalId }, body: JSON.stringify(publication),
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
