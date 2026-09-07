import { RESEARCH_ANCHOR_SCHEMA_VERSION, type ResearchMetricFindingAnchor } from "../research/researchBridgeTypes.ts";
import { researchAnchorId } from "../research/ResearchAnchorContract.ts";
import type { ResearchBridgeRuntime } from "../research/ResearchBridgeRuntime.ts";
import type { MetricSignificanceBriefing } from "./MetricIntelligenceTypes.ts";

function immutableSnapshot<T>(value: T): T {
  if (value instanceof Date) return Object.freeze(new Date(value.getTime())) as T;
  if (Array.isArray(value)) return Object.freeze(value.map(immutableSnapshot)) as T;
  if (value && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value as object).map(([key, child]) => [key, immutableSnapshot(child)]))) as T;
  return value;
}

export function createMetricFindingResearchAnchor(briefing: MetricSignificanceBriefing, collectedAt = new Date()): ResearchMetricFindingAnchor {
  if (!briefing.findingId || !briefing.source.investigationId || briefing.epistemicClassification !== "EXPERIMENTAL / DERIVED / NON-CANONICAL") throw new Error("A qualified non-canonical metric finding is required.");
  const captured = immutableSnapshot(briefing);
  return Object.freeze({ schemaVersion: RESEARCH_ANCHOR_SCHEMA_VERSION, kind: "METRIC_FINDING", anchorId: researchAnchorId(briefing.source.investigationId, "METRIC_FINDING", briefing.findingId), investigationId: briefing.source.investigationId, sourceWorkspace: "LAYERS", sourceIdentity: briefing.findingId, collectedAt, createdAt: collectedAt, classification: "RESEARCHER_GENERATED", sourceExecutionId: briefing.source.executionId, sourceProjectionId: briefing.source.inputProjectionId, display: Object.freeze({ title: `${briefing.metricLabel} · ${briefing.displayValue}`, summary: `${briefing.pairDisplay} · Experimental metric finding · NON-CANONICAL` }), insertability: Object.freeze({ state: "INSPECTION_ONLY", reason: "An experimental metric finding is not an accepted relationship." }), capturedRepresentation: Object.freeze({ schemaVersion: `${briefing.templateId}/${briefing.templateVersion}`, mediaType: "application/json", value: captured }), metricFinding: captured, pinned: false });
}

export function collectMetricFinding(briefing: MetricSignificanceBriefing, research: ResearchBridgeRuntime): ResearchMetricFindingAnchor {
  const anchor = createMetricFindingResearchAnchor(briefing);
  research.createAnchor(anchor);
  return anchor;
}
