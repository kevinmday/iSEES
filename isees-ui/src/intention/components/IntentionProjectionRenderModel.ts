import type { IntentionAvailability, IntentionEpistemicClassification, IntentionMetricDerivation, IntentionProjectedLink, IntentionProjectedNode, IntentionProjection } from "../projection";
import { validateIntentionProjection } from "../projection";

export interface IntentionPresentationCoordinates { readonly coordinateSystem: "PRESENTATION_ONLY_NON_SCIENTIFIC"; readonly x: number; readonly y: number; readonly z: number; }
export interface IntentionRenderNode { readonly id: string; readonly projectionId: string; readonly projectedNode: IntentionProjectedNode; readonly coordinates: IntentionPresentationCoordinates; readonly colorToken: "FOCUSED_CYAN" | "COMPARISON_AMBER"; readonly shapeToken: "FOCUSED_DIAMOND" | "COMPARISON_CIRCLE"; readonly derivationIds: readonly string[]; }
export interface IntentionRenderLink { readonly id: string; readonly projectionId: string; readonly projectedLink: IntentionProjectedLink; readonly sourceNodeId: string; readonly targetNodeId: string; readonly derivationIds: readonly string[]; }
export interface IntentionRenderDerivation { readonly id: string; readonly projectionId: string; readonly derivation: IntentionMetricDerivation; readonly availability: IntentionAvailability; readonly epistemicClassification: IntentionEpistemicClassification; }
export interface IntentionProjectionRenderModel { readonly projectionId: string; readonly executionId: string; readonly coordinateMeaning: "PRESENTATION_ONLY_NON_SCIENTIFIC"; readonly nodes: readonly IntentionRenderNode[]; readonly links: readonly IntentionRenderLink[]; readonly derivations: readonly IntentionRenderDerivation[]; }

export function resolveIntentionRenderDerivations(model: IntentionProjectionRenderModel, derivationIds: readonly string[]): readonly IntentionRenderDerivation[] {
  const seen = new Set<string>();
  const resolved = derivationIds.map(id => {
    if (seen.has(id)) throw new Error(`Duplicate render derivation identity: ${id}`);
    seen.add(id);
    const derivation = model.derivations.find(item => item.id === id && item.projectionId === model.projectionId);
    if (!derivation) throw new Error(`Unknown render derivation identity for projection ${model.projectionId}: ${id}`);
    return derivation;
  });
  return Object.freeze(resolved);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function createIntentionProjectionRenderModel(projection: IntentionProjection): IntentionProjectionRenderModel {
  validateIntentionProjection(projection);
  const count = Math.max(projection.nodes.length, 1);
  const nodes = projection.nodes.map((projectedNode, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const radius = count === 1 ? 0 : 120;
    return {
      id: projectedNode.id,
      projectionId: projection.id,
      projectedNode,
      coordinates: { coordinateSystem: "PRESENTATION_ONLY_NON_SCIENTIFIC" as const, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: (index - (count - 1) / 2) * 42 },
      colorToken: projectedNode.role === "FOCUSED_EVENT" ? "FOCUSED_CYAN" as const : "COMPARISON_AMBER" as const,
      shapeToken: projectedNode.role === "FOCUSED_EVENT" ? "FOCUSED_DIAMOND" as const : "COMPARISON_CIRCLE" as const,
      derivationIds: [...projectedNode.metricDerivationIds],
    };
  });
  const links = projection.links.map(projectedLink => ({ id: projectedLink.id, projectionId: projection.id, projectedLink, sourceNodeId: projectedLink.sourceNodeId, targetNodeId: projectedLink.targetNodeId, derivationIds: [...projectedLink.metricDerivationIds] }));
  const derivations = projection.derivations.map(derivation => ({ id: derivation.id, projectionId: projection.id, derivation, availability: derivation.availability, epistemicClassification: derivation.epistemicClassification }));
  return deepFreeze({ projectionId: projection.id, executionId: projection.executionId, coordinateMeaning: "PRESENTATION_ONLY_NON_SCIENTIFIC", nodes, links, derivations });
}
