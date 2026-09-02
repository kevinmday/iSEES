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
  return [
    `${eventDisplayName(experiment.caseAEventId)} ↔ ${eventDisplayName(experiment.caseBEventId)}`,
    `${projection.delta.state} · ${layers} · ${experimental.availability === "AVAILABLE" ? formatPercent(experimental.score) : "UNAVAILABLE"}`,
    `Baseline ${baseline.availability === "AVAILABLE" ? formatPercent(baseline.score) : "UNAVAILABLE"}`,
    "EXPERIMENTAL / NON-CANONICAL",
  ].join("\n");
}
