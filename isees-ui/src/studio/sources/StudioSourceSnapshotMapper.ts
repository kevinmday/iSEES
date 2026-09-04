import type { ResearchAnchor } from "../../research/researchBridgeTypes.ts";

export type StudioSourceKind = "EVENT_NODE" | "EVIDENCE" | "NARRATIVE_PASSAGE" | "TIMELINE_MOMENT" | "MEDIA" | "CORRESPONDENCE_EDGE" | "HYPOTHESIS" | "DERIVATION" | "OTHER";
export interface StudioSourceSnapshotCommand { readonly snapshotId: string; readonly sourceIdentity: string; readonly sourceInvestigationId: string; readonly sourceWorkspace: string; readonly sourceKind: StudioSourceKind; readonly classification: "CANONICAL" | "RESEARCHER_GENERATED"; readonly sourceRevisionId?: string; readonly sourceExecutionId?: string; readonly sourceProjectionId?: string; readonly capturedAt: string; readonly representationSchemaVersion: string; readonly mediaType: string; readonly capturedRepresentation: unknown }
const kinds: Record<ResearchAnchor["kind"], StudioSourceKind> = { GRAPH: "EVENT_NODE", COMPARE_CANDIDATE: "CORRESPONDENCE_EDGE", LAYERS_EXPERIMENT: "OTHER", EVIDENCE_RECORD: "EVIDENCE", MEDIA: "MEDIA", NARRATIVE_PASSAGE: "NARRATIVE_PASSAGE", TIMELINE_MOMENT: "TIMELINE_MOMENT", TIMELINE_CORRESPONDENCE: "CORRESPONDENCE_EDGE", INTENTION_DERIVATION: "DERIVATION", INTENTION_HYPOTHESIS: "HYPOTHESIS" };

export function mapResearchAnchorToStudioSourceSnapshot(anchor: ResearchAnchor): StudioSourceSnapshotCommand {
  if (anchor.insertability.state !== "INSERTABLE") throw new Error(`Research anchor is inspection-only: ${anchor.insertability.reason}`);
  if (anchor.classification === "UNDETERMINED") throw new Error("Studio source snapshots require an established source classification.");
  if (!anchor.sourceIdentity || !anchor.investigationId || !anchor.capturedRepresentation.schemaVersion || !anchor.capturedRepresentation.mediaType) throw new Error("Research anchor is not qualified for immutable Studio capture.");
  if (Number.isNaN(anchor.collectedAt.getTime())) throw new Error("Research anchor has an invalid capture timestamp.");
  const sourceKind = anchor.kind === "GRAPH" && anchor.graph.type === "EDGE" ? "CORRESPONDENCE_EDGE" : kinds[anchor.kind];
  return { snapshotId: `studio-source:${anchor.anchorId}`, sourceIdentity: anchor.sourceIdentity, sourceInvestigationId: anchor.investigationId, sourceWorkspace: anchor.sourceWorkspace, sourceKind, classification: anchor.classification, sourceRevisionId: anchor.sourceRevisionId, sourceExecutionId: anchor.sourceExecutionId, sourceProjectionId: anchor.sourceProjectionId, capturedAt: anchor.collectedAt.toISOString(), representationSchemaVersion: anchor.capturedRepresentation.schemaVersion, mediaType: anchor.capturedRepresentation.mediaType, capturedRepresentation: anchor.capturedRepresentation.value };
}
