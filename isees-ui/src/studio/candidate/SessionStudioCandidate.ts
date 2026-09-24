import { useEffect, useState } from "react";
import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";
import type { AuthorNode, ReferenceNode } from "../../author/model/AuthorNodeTypes";

export const SESSION_STUDIO_CANDIDATE_SCHEMA_VERSION = 1 as const;

export interface SessionStudioCandidateSourceAnchor { readonly anchorId: string; readonly sourceIdentity: string; readonly sourceHash?: string; }
export interface SessionStudioCandidateKnowledge {
  readonly schemaVersion: typeof SESSION_STUDIO_CANDIDATE_SCHEMA_VERSION;
  readonly candidateId: string; readonly investigationId: string; readonly sourceDocumentId: string;
  readonly documentRevision: number; readonly contentHash: string; readonly title: string; readonly summary: string;
  readonly sourceAnchors: readonly SessionStudioCandidateSourceAnchor[];
  readonly principal: Readonly<{ kind: "GUEST"; operatorId: string }>;
  readonly createdAt: string; readonly lifecycleClassification: "CANDIDATE_KNOWLEDGE";
  readonly epistemicClassification: "CANDIDATE"; readonly durability: "SESSION";
  readonly canonicality: "NON_CANONICAL"; readonly canonicalEffect: "NONE"; readonly acceptanceState: "UNACCEPTED";
  readonly provenance: Readonly<{ action: "EXPLICIT_STUDIO_PUBLICATION"; source: "STUDIO"; authoredBlockIds: readonly string[] }>;
}

function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
export function isSessionStudioCandidateKnowledge(value: unknown): value is SessionStudioCandidateKnowledge {
  if (!isRecord(value) || !isRecord(value.principal) || !isRecord(value.provenance) || !Array.isArray(value.sourceAnchors)) return false;
  const strings = ["candidateId", "investigationId", "sourceDocumentId", "contentHash", "title", "summary", "createdAt"] as const;
  return value.schemaVersion === 1 && strings.every(key => typeof value[key] === "string" && (value[key] as string).length > 0) &&
    typeof value.documentRevision === "number" && Number.isInteger(value.documentRevision) && value.documentRevision >= 0 &&
    value.lifecycleClassification === "CANDIDATE_KNOWLEDGE" && value.epistemicClassification === "CANDIDATE" && value.durability === "SESSION" &&
    value.canonicality === "NON_CANONICAL" && value.canonicalEffect === "NONE" && value.acceptanceState === "UNACCEPTED" && value.principal.kind === "GUEST" &&
    typeof value.principal.operatorId === "string" && value.principal.operatorId.length > 0 &&
    value.provenance.action === "EXPLICIT_STUDIO_PUBLICATION" && value.provenance.source === "STUDIO" && Array.isArray(value.provenance.authoredBlockIds) &&
    value.provenance.authoredBlockIds.every(item => typeof item === "string") && value.sourceAnchors.every(item => isRecord(item) &&
      typeof item.anchorId === "string" && item.anchorId.length > 0 && typeof item.sourceIdentity === "string" && item.sourceIdentity.length > 0 &&
      (item.sourceHash === undefined || typeof item.sourceHash === "string"));
}

function stable(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
function hash(value: unknown): string { const input = stable(value); let result = 2166136261; for (let index = 0; index < input.length; index += 1) { result ^= input.charCodeAt(index); result = Math.imul(result, 16777619); } return `fnv1a32:${(result >>> 0).toString(16).padStart(8, "0")}`; }
function textFor(node: AuthorNode): string { const record = node as unknown as Record<string, unknown>; for (const key of ["text", "title", "summary", "citation"]) if (typeof record[key] === "string") return (record[key] as string).trim(); return ""; }

export function getSessionCandidatePublicationBlocker(document: ComputationalAuthorDocument | undefined, investigationId: string | undefined): string | undefined {
  if (!investigationId) return "Open an active Investigation before publishing Candidate Knowledge.";
  if (!document) return "Add at least one researcher-authored or source-backed block before publishing Candidate Knowledge.";
  const eligible = document.nodes.filter(node => node.type === "REFERENCE" ? Boolean((node as ReferenceNode).researchSource) : textFor(node).length > 0);
  if (eligible.length === 0) return "Add at least one researcher-authored or source-backed block before publishing Candidate Knowledge.";
  for (const node of document.nodes.filter(item => item.type === "REFERENCE") as ReferenceNode[]) {
    const source = node.researchSource; if (!source) continue;
    if (!source.anchorId || !source.sourceIdentity || source.sourceInvestigationId !== investigationId || source.insertability.state !== "INSERTABLE" || source.classification === "UNDETERMINED") return `Source lineage is not publishable for block ${node.id}.`;
  }
  return undefined;
}

export function createSessionStudioCandidate(input: { document: ComputationalAuthorDocument; investigationId: string; operatorId: string; createdAt?: string }): SessionStudioCandidateKnowledge {
  const blocker = getSessionCandidatePublicationBlocker(input.document, input.investigationId); if (blocker) throw new Error(blocker);
  const eligible = input.document.nodes.filter(node => node.type === "REFERENCE" ? Boolean((node as ReferenceNode).researchSource) : textFor(node).length > 0);
  const contentHash = hash({ documentId: input.document.identity.id, revision: input.document.metadata.version, nodes: eligible });
  const sourceAnchors = (input.document.nodes.filter(node => node.type === "REFERENCE") as ReferenceNode[]).flatMap(node => node.researchSource ? [{ anchorId: node.researchSource.anchorId, sourceIdentity: node.researchSource.sourceIdentity, sourceHash: hash(node.researchSource.capturedRepresentation) }] : []).sort((a, b) => a.anchorId.localeCompare(b.anchorId));
  const summary = eligible.map(textFor).filter(Boolean).join(" ").slice(0, 280) || `${eligible.length} source-backed block${eligible.length === 1 ? "" : "s"}`;
  return { schemaVersion: 1, candidateId: `studio-candidate:${hash({ investigationId: input.investigationId, documentId: input.document.identity.id, contentHash })}`, investigationId: input.investigationId,
    sourceDocumentId: input.document.identity.id, documentRevision: input.document.metadata.version, contentHash, title: input.document.metadata.title.trim() || "Untitled Studio candidate", summary, sourceAnchors,
    principal: { kind: "GUEST", operatorId: input.operatorId }, createdAt: input.createdAt ?? new Date().toISOString(), lifecycleClassification: "CANDIDATE_KNOWLEDGE", epistemicClassification: "CANDIDATE", durability: "SESSION", canonicality: "NON_CANONICAL", canonicalEffect: "NONE", acceptanceState: "UNACCEPTED",
    provenance: { action: "EXPLICIT_STUDIO_PUBLICATION", source: "STUDIO", authoredBlockIds: eligible.map(node => node.id) } };
}

type Listener = () => void;
export class SessionStudioCandidateRuntime {
  private candidates: SessionStudioCandidateKnowledge[] = []; private revision = 0; private readonly listeners = new Set<Listener>();
  getCandidates(investigationId?: string) { return investigationId ? this.candidates.filter(item => item.investigationId === investigationId) : [...this.candidates]; }
  getRevision() { return this.revision; }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  publish(candidate: SessionStudioCandidateKnowledge) { if (!isSessionStudioCandidateKnowledge(candidate)) throw new Error("Cannot publish malformed session Candidate Knowledge."); const unchanged = this.candidates.find(item => item.candidateId === candidate.candidateId); if (unchanged) return unchanged; this.candidates = [...this.candidates.filter(item => !(item.investigationId === candidate.investigationId && item.sourceDocumentId === candidate.sourceDocumentId)), candidate]; this.emit(); return candidate; }
  restore(candidates: readonly SessionStudioCandidateKnowledge[]) { if (!candidates.every(isSessionStudioCandidateKnowledge)) throw new Error("Cannot restore malformed session Candidate Knowledge."); this.candidates = [...candidates]; this.emit(); }
  clear() { if (this.candidates.length) { this.candidates = []; this.emit(); } }
  private emit() { this.revision += 1; this.listeners.forEach(listener => listener()); }
}
export const sessionStudioCandidateRuntime = new SessionStudioCandidateRuntime();
export function useSessionStudioCandidates(investigationId?: string) { const [revision, setRevision] = useState(() => sessionStudioCandidateRuntime.getRevision()); useEffect(() => sessionStudioCandidateRuntime.subscribe(() => setRevision(sessionStudioCandidateRuntime.getRevision())), []); void revision; return sessionStudioCandidateRuntime.getCandidates(investigationId); }
