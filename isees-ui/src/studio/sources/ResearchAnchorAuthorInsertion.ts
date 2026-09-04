import { AuthorNodeTypes, type ReferenceNode } from "../../author/model/AuthorNodeTypes.ts";
import type { ResearchAnchor } from "../../research/researchBridgeTypes";

export function createAuthorReferenceFromResearchAnchor(anchor: ResearchAnchor, nodeId: string, insertedAt = new Date()): ReferenceNode {
  if (anchor.insertability.state !== "INSERTABLE") throw new Error(`Research anchor is inspection-only: ${anchor.insertability.reason}`);
  if (!nodeId.trim()) throw new Error("Author REFERENCE identity is required.");
  const targetType: ReferenceNode["targetType"] = anchor.kind === "GRAPH" ? anchor.graph.type : "DOCUMENT";
  return { id: nodeId, type: AuthorNodeTypes.REFERENCE, targetType, targetId: anchor.sourceIdentity, title: anchor.display.title, summary: anchor.display.summary, source: "RESEARCH_BRIDGE", corpusId: anchor.anchorId, insertedAt, researchSource: { anchorId: anchor.anchorId, sourceKind: anchor.kind, sourceIdentity: anchor.sourceIdentity, sourceInvestigationId: anchor.investigationId, sourceWorkspace: anchor.sourceWorkspace, sourceRevisionId: anchor.sourceRevisionId, sourceExecutionId: anchor.sourceExecutionId, sourceProjectionId: anchor.sourceProjectionId, classification: anchor.classification, capturedRepresentation: anchor.capturedRepresentation } };
}
