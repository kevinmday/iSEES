import type { ComputationalAuthorDocument } from "../../author/model/AuthorDocument";
import type { ObservationNode, ReferenceNode } from "../../author/model/AuthorNodeTypes";
import type { StudioScope } from "./StudioApi";

const SOURCE_KINDS: Record<string, string> = { GRAPH: "EVENT_NODE", COMPARE_CANDIDATE: "CORRESPONDENCE_EDGE", LAYERS_EXPERIMENT: "OTHER", EVIDENCE_RECORD: "EVIDENCE", MEDIA: "MEDIA", NARRATIVE_PASSAGE: "NARRATIVE_PASSAGE", TIMELINE_MOMENT: "TIMELINE_MOMENT", TIMELINE_CORRESPONDENCE: "CORRESPONDENCE_EDGE", INTENTION_DERIVATION: "DERIVATION", INTENTION_HYPOTHESIS: "HYPOTHESIS", EVENT_NODE: "EVENT_NODE", EVIDENCE: "EVIDENCE", CORRESPONDENCE_EDGE: "CORRESPONDENCE_EDGE", HYPOTHESIS: "HYPOTHESIS", DERIVATION: "DERIVATION", OTHER: "OTHER" };

export function composeStudioVersionCommand(scope: StudioScope, document: ComputationalAuthorDocument) {
  const references = document.nodes.filter(node => node.type === "REFERENCE" && (node as ReferenceNode).researchSource?.classification !== "UNDETERMINED") as ReferenceNode[];
  const sourceSnapshots = references.flatMap(node => {
    const source = node.researchSource;
    const sourceKind = source && SOURCE_KINDS[source.sourceKind];
    if (!source || !sourceKind || Number.isNaN(node.insertedAt.getTime())) return [];
    const representation = source.capturedRepresentation as { schemaVersion?: unknown; mediaType?: unknown; value?: unknown } | undefined;
    if (!representation || typeof representation.schemaVersion !== "string" || typeof representation.mediaType !== "string") return [];
    const graphRevision = source.sourceKind === "GRAPH" && source.sourceRevisionId ? Number(source.sourceRevisionId) : undefined;
    return [{ snapshotId: `studio-source:${source.anchorId}`, anchorId: source.anchorId, sourceIdentity: source.sourceIdentity, sourceInvestigationId: source.sourceInvestigationId, sourceWorkspace: source.sourceWorkspace, sourceKind, classification: source.classification as "CANONICAL" | "RESEARCHER_GENERATED", sourceRevisionId: source.sourceRevisionId, sourceExecutionId: source.sourceExecutionId, sourceProjectionId: source.sourceProjectionId, capturedAt: node.insertedAt.toISOString(), representationSchemaVersion: representation.schemaVersion, mediaType: representation.mediaType, capturedRepresentation: representation.value, graphIdentity: source.sourceKind === "GRAPH" ? source.sourceIdentity : undefined, graphRevision: Number.isFinite(graphRevision) ? graphRevision : undefined, insertionState: source.insertability.state, insertionReason: source.insertability.reason }];
  });
  const claims = document.nodes.filter(node => node.type === "OBSERVATION" && (node as ObservationNode).text.trim().length > 0).map(node => ({ claimId: node.id, claimText: (node as ObservationNode).text, reviewState: "UNREVIEWED" as const }));
  return { schemaVersion: "studio-command/v1" as const, investigationId: scope.investigationId, principalId: scope.principalId, authorSchemaVersion: "computational-author-document/v1", document, sourceSnapshots, claims, citations: [], claimSourceMappings: [], comparisonContext: null };
}

export function sourceBackedBlockCount(document: ComputationalAuthorDocument | undefined): number { return document?.nodes.filter(node => node.type === "REFERENCE" && Boolean((node as ReferenceNode).researchSource)).length ?? 0; }
export function authoredBlockCount(document: ComputationalAuthorDocument | undefined): number { return document?.nodes.filter(node => node.type !== "REFERENCE").length ?? 0; }
