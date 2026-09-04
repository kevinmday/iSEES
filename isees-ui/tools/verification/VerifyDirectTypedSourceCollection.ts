import assert from "node:assert/strict";
import { ResearchBridgeRuntime } from "../../src/research/ResearchBridgeRuntime";
import { collectTypedResearchSource } from "../../src/studio/sources/DirectResearchPublication";
import { createAuthorReferenceFromResearchAnchor } from "../../src/studio/sources/ResearchAnchorAuthorInsertion";
import { evidenceRecordResearchAnchor, intentionDerivationResearchAnchor, intentionHypothesisResearchAnchor, mediaResearchAnchor, narrativePassageResearchAnchor, timelineCorrespondenceResearchAnchor, timelineMomentResearchAnchor } from "../../src/studio/sources/TypedResearchSourceAdapters";
import { TimelineTemporalPrecision, TimelineTemporalSemantic } from "../../src/timeline/projection/TimelineTemporalProjectionTypes";

const at = new Date("2026-01-01T00:00:00.000Z");
const evidence = { evidenceId: "e:1", investigationId: "inv:a", sourceArtifactId: "artifact:1", title: "Record", artifactType: "SOURCE", provenance: { repository: "SYSTEM_CANON", createdAt: at.toISOString() }, description: { status: "KNOWN", value: "Exact record" }, confidence: { status: "UNKNOWN" }, doi: { status: "UNKNOWN" }, url: { status: "UNKNOWN" }, tags: { status: "UNKNOWN" }, sourceDerivationIdentifiers: { status: "UNKNOWN" }, payload: { status: "UNAVAILABLE", reason: "Binary payload is not stored." } } as const;
const moment = { itemId: "moment:1", investigationId: "inv:a", eventId: "event:1", semantic: TimelineTemporalSemantic.OCCURRENCE, precision: TimelineTemporalPrecision.EXACT, temporal: { kind: "INSTANT", sourceValue: at.toISOString(), normalizedEpochMilliseconds: at.getTime(), timezone: "UTC" }, subject: { availability: "AVAILABLE", type: "NODE", id: "node:1" }, provenance: { sourceType: "SYSTEM_CANON", sourceId: "ko:1", sourceField: "occurredAt" }, evidenceReferenceIds: ["e:1"], mediaReferenceIds: [], orderKey: "0", validity: "VALID" } as const;
const derivation = { id: "derivation:1", metricId: "m:1", metricName: "Metric", symbol: "M", value: 1, displayValue: "1", availability: "AVAILABLE", epistemicClassification: "COMPUTATIONAL_PROJECTION", equationId: "eq:1", inputs: [], assumptions: ["Assumption"], unavailableInputs: [], sourceKnowledgeIds: ["ko:1"], sourceRelationshipIds: ["rel:1"], investigationId: "inv:a", operationalRevisionId: "rev:1", resolveExecutionId: "resolve:1", intentionExecutionId: "intent:1", modelId: "model:1", modelVersion: "1", configurationId: "config:1", projectedNodeId: "node:1" } as const;
const hypothesis = { id: "hypothesis:1", statement: "Explicit hypothesis", nullCandidate: { id: "h0:1", statement: "Null" }, assumptions: ["Assumption"], requiredInputs: ["input:1"], availability: "THEORETICAL", falsificationConditions: ["Condition"], validationStatus: "NOT_TESTED", reason: "Not tested" } as const;
const anchors = [
  evidenceRecordResearchAnchor(evidence, at),
  mediaResearchAnchor({ mediaId: "media:1", investigationId: "inv:a", revisionId: "rev:1", title: "Verified media", summary: "Exact artifact", representation: { artifactId: "artifact:1" }, classification: "CANONICAL" }, at),
  narrativePassageResearchAnchor({ investigationId: "inv:a", passageId: "passage:1", revisionId: "rev:1", projectionId: "narrative:rev:1", collectedAt: at, narrative: { canonicalEventId: "event:1", knowledgeObjectId: "ko:1", title: "Narrative", materialClassification: "System Canon narrative", paragraphs: ["Passage"] }, passage: "Passage" }),
  timelineMomentResearchAnchor({ investigationId: "inv:a", revisionId: "rev:1", projectionId: "timeline:rev:1", collectedAt: at, moment }),
  timelineCorrespondenceResearchAnchor({ investigationId: "inv:a", revisionId: "rev:1", projectionId: "timeline:rev:1", collectedAt: at, correspondence: { correspondenceId: "corr:1", focusedItemId: "moment:1", comparedItemId: "moment:2", status: "UNRESOLVED", explanation: "Qualified pair; unresolved." } }),
  intentionDerivationResearchAnchor({ investigationId: "inv:a", projectionId: "projection:1", collectedAt: at, derivation }),
  intentionHypothesisResearchAnchor({ investigationId: "inv:a", projectionId: "projection:1", revisionId: "rev:1", executionId: "intent:1", collectedAt: at, hypothesis }),
];
assert.deepEqual(anchors.map(anchor => anchor.kind), ["EVIDENCE_RECORD", "MEDIA", "NARRATIVE_PASSAGE", "TIMELINE_MOMENT", "TIMELINE_CORRESPONDENCE", "INTENTION_DERIVATION", "INTENTION_HYPOTHESIS"]);
assert.equal(evidenceRecordResearchAnchor(evidence, at).anchorId, evidenceRecordResearchAnchor(evidence, at).anchorId);
const runtime = new ResearchBridgeRuntime();
assert.equal(collectTypedResearchSource(runtime, () => anchors[0]!).message, "Added to Research Inbox");
assert.equal(collectTypedResearchSource(runtime, () => anchors[0]!).message, "Already in Research Inbox");
assert.equal(runtime.getDesk().entries.length, 1);
runtime.createAnchor(evidenceRecordResearchAnchor({ ...evidence, investigationId: "inv:b" }, at));
assert.equal(runtime.projectInvestigation({ investigationId: "inv:a" }).entries.length, 1);
assert.equal(runtime.projectInvestigation({ investigationId: "inv:b" }).entries.length, 1);
assert.deepEqual(runtime.getDesk().entries[0]!.anchor.capturedRepresentation.value, evidence);
assert.equal(anchors[0]!.classification, "CANONICAL");
assert.equal(anchors[0]!.insertability.state, "INSPECTION_ONLY");
assert.equal(anchors[4]!.classification, "RESEARCHER_GENERATED");
assert.equal(anchors[6]!.insertability.state, "INSPECTION_ONLY");
assert.throws(() => narrativePassageResearchAnchor({ investigationId: "inv:a", passageId: "", revisionId: "rev", projectionId: "projection", narrative: anchors[2]!.capturedRepresentation.value as never, passage: "x" }));
assert.throws(() => createAuthorReferenceFromResearchAnchor(anchors[0]!, "reference:1"));
assert.equal(createAuthorReferenceFromResearchAnchor(anchors[5]!, "reference:2", at).researchSource?.sourceProjectionId, "projection:1");
console.log("PASS VerifyDirectTypedSourceCollection");
