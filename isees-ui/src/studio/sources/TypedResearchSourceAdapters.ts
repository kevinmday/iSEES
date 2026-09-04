import type { EvidenceWorkspaceRecord } from "../../evidence/projection/EvidenceWorkspaceProjectionTypes";
import type { IntentionHypothesis } from "../../intention/contracts/IntentionHypothesis";
import type { IntentionMetricDerivation } from "../../intention/contracts/IntentionMetricDerivation";
import type { SystemCanonNarrativeProjection } from "../../narrative/projection/NarrativeWorkspaceProjectionTypes";
import type { TimelineCorrespondence } from "../../timeline/projection/TimelineCorrespondenceProjection";
import type { TimelineTemporalItem } from "../../timeline/projection/TimelineTemporalProjectionTypes";
import { createTypedResearchAnchor } from "../../research/ResearchAnchorContract";
import type { ResearchAnchor } from "../../research/researchBridgeTypes";

type CaptureContext = Readonly<{ investigationId: string; projectionId?: string; collectedAt?: Date }>;
const inspectionOnly = (reason: string) => ({ state: "INSPECTION_ONLY" as const, reason });
const insertable = { state: "INSERTABLE" as const, reason: "Exact source identity and frozen representation are available." };
const capture = (value: unknown, schemaVersion: string) => ({ schemaVersion, mediaType: "application/json", value });

export function evidenceRecordResearchAnchor(record: EvidenceWorkspaceRecord, collectedAt?: Date): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: record.investigationId, kind: "EVIDENCE_RECORD", sourceWorkspace: "EVIDENCE", sourceIdentity: record.evidenceId, collectedAt, classification: record.provenance.repository === "SYSTEM_CANON" ? "CANONICAL" : "UNDETERMINED", display: { title: record.title, summary: record.description.status === "KNOWN" ? record.description.value : record.evidenceId }, insertability: record.payload.status === "UNAVAILABLE" ? inspectionOnly(record.payload.reason) : insertable, capturedRepresentation: capture(record, "evidence-workspace-record/v1") });
}

export interface MediaSource { readonly mediaId: string; readonly investigationId: string; readonly revisionId: string; readonly title: string; readonly summary: string; readonly representation: unknown; readonly classification: "CANONICAL" | "RESEARCHER_GENERATED" | "UNDETERMINED" }
export function mediaResearchAnchor(source: MediaSource, collectedAt?: Date): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: source.investigationId, kind: "MEDIA", sourceWorkspace: "MEDIA", sourceIdentity: source.mediaId, sourceRevisionId: source.revisionId, collectedAt, classification: source.classification, display: { title: source.title, summary: source.summary }, insertability: insertable, capturedRepresentation: capture(source.representation, "media-source/v1") });
}

export function narrativePassageResearchAnchor(context: CaptureContext & { readonly passageId: string; readonly revisionId: string; readonly narrative: SystemCanonNarrativeProjection; readonly passage: string }): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: context.investigationId, kind: "NARRATIVE_PASSAGE", sourceWorkspace: "NARRATIVE", sourceIdentity: context.passageId, sourceRevisionId: context.revisionId, sourceProjectionId: context.projectionId, collectedAt: context.collectedAt, classification: "CANONICAL", display: { title: context.narrative.title, summary: context.passage }, insertability: insertable, capturedRepresentation: capture({ narrativeIdentity: context.narrative.knowledgeObjectId, passageId: context.passageId, passage: context.passage }, "narrative-passage/v1") });
}

export function timelineMomentResearchAnchor(context: CaptureContext & { readonly moment: TimelineTemporalItem; readonly revisionId: string }): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: context.investigationId, kind: "TIMELINE_MOMENT", sourceWorkspace: "TIMELINE", sourceIdentity: context.moment.itemId, sourceRevisionId: context.revisionId, sourceProjectionId: context.projectionId, collectedAt: context.collectedAt, classification: "UNDETERMINED", display: { title: context.moment.itemId, summary: `${context.moment.semantic} · ${context.moment.precision}` }, insertability: insertable, capturedRepresentation: capture(context.moment, "timeline-moment/v1") });
}

export function timelineCorrespondenceResearchAnchor(context: CaptureContext & { readonly correspondence: TimelineCorrespondence; readonly revisionId: string }): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: context.investigationId, kind: "TIMELINE_CORRESPONDENCE", sourceWorkspace: "TIMELINE", sourceIdentity: context.correspondence.correspondenceId, sourceRevisionId: context.revisionId, sourceProjectionId: context.projectionId, collectedAt: context.collectedAt, classification: "RESEARCHER_GENERATED", display: { title: context.correspondence.correspondenceId, summary: context.correspondence.explanation }, insertability: inspectionOnly("Timeline correspondence is unresolved and is not an accepted relationship."), capturedRepresentation: capture(context.correspondence, "timeline-correspondence/v1") });
}

export function intentionDerivationResearchAnchor(context: CaptureContext & { readonly derivation: IntentionMetricDerivation }): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: context.investigationId, kind: "INTENTION_DERIVATION", sourceWorkspace: "INTENTION", sourceIdentity: context.derivation.id, sourceRevisionId: context.derivation.operationalRevisionId, sourceExecutionId: context.derivation.intentionExecutionId, sourceProjectionId: context.projectionId, collectedAt: context.collectedAt, classification: "RESEARCHER_GENERATED", display: { title: context.derivation.metricName, summary: context.derivation.displayValue ?? context.derivation.reason ?? context.derivation.id }, insertability: context.derivation.availability === "AVAILABLE" ? insertable : inspectionOnly(context.derivation.reason ?? "Derivation is unavailable."), capturedRepresentation: capture(context.derivation, "intention-derivation/v1") });
}

export function intentionHypothesisResearchAnchor(context: CaptureContext & { readonly hypothesis: IntentionHypothesis; readonly revisionId: string; readonly executionId: string }): ResearchAnchor {
  return createTypedResearchAnchor({ investigationId: context.investigationId, kind: "INTENTION_HYPOTHESIS", sourceWorkspace: "INTENTION", sourceIdentity: context.hypothesis.id, sourceRevisionId: context.revisionId, sourceExecutionId: context.executionId, sourceProjectionId: context.projectionId, collectedAt: context.collectedAt, classification: "RESEARCHER_GENERATED", display: { title: context.hypothesis.id, summary: context.hypothesis.statement }, insertability: inspectionOnly("An INTENTION hypothesis is untested and must not become an implicit claim."), capturedRepresentation: capture(context.hypothesis, "intention-hypothesis/v1") });
}
