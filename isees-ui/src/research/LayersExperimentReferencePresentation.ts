import { CANONICAL_REGISTRY } from "../canonical/canonicalRegistry";
import type { ResearchExperimentAnchor } from "./researchBridgeTypes";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function eventDisplayName(eventId: string): string {
  return CANONICAL_REGISTRY.find(event => event.event_id === eventId)?.event_name ?? eventId;
}

export function experimentReferenceSummary(anchor: ResearchExperimentAnchor): string {
  const { experiment } = anchor;
  const projection = experiment.projection;
  const experimental = projection.experimental.relationship;
  const baseline = projection.baseline.relationship;
  const layers = projection.provenance.experimentalLayerIds.join(" · ") || "NONE";
  const version = experiment.schemaVersion ?? "layers-experiment/v1";
  const details = projection.layerContributions.flatMap(contribution => {
    const evaluator = contribution.evaluatorKey ? `${contribution.evaluatorKey}@${contribution.evaluatorVersion ?? "UNKNOWN"}` : undefined;
    const result = contribution.availability === "AVAILABLE" ? `normalized=${formatPercent(contribution.normalizedResult ?? contribution.similarity ?? 0)}` : contribution.missingInputs?.length ? `missing=${contribution.missingInputs.map(item => item.inputIdentity).join(",")}` : undefined;
    const lineage = contribution.availableInputLineage?.length ? `lineage=${contribution.availableInputLineage.map(item => item.sourceIdentity).join(",")}` : undefined;
    return [evaluator, result, lineage].filter((item): item is string => !!item).join(" · ");
  }).filter(Boolean);
  return [
    `${eventDisplayName(experiment.caseAEventId)} ↔ ${eventDisplayName(experiment.caseBEventId)}`,
    `${projection.delta.state} · ${layers} · ${experimental.availability === "AVAILABLE" ? formatPercent(experimental.score) : "UNAVAILABLE"}`,
    `Baseline ${baseline.availability === "AVAILABLE" ? formatPercent(baseline.score) : "UNAVAILABLE"}`,
    `${version} · ${projection.provenance.catalogVersion ?? "catalog version unavailable"}`,
    ...details,
    "EXPERIMENTAL / NON-CANONICAL",
  ].join("\n");
}
