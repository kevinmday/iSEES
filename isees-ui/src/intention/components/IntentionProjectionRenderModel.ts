import type { IntentionAvailability, IntentionEpistemicClassification, IntentionMetricDerivation, IntentionProjectedLink, IntentionProjectedNode, IntentionProjection } from "../projection";
import { validateIntentionProjection } from "../projection";

export interface IntentionPresentationCoordinates { readonly coordinateSystem: "PRESENTATION_ONLY_NON_SCIENTIFIC"; readonly x: number; readonly y: number; readonly z: number; }
export interface IntentionRenderNode { readonly id: string; readonly projectionId: string; readonly projectedNode: IntentionProjectedNode; readonly coordinates: IntentionPresentationCoordinates; readonly colorToken: "FOCUSED_CYAN" | "COMPARISON_AMBER"; readonly shapeToken: "FOCUSED_DIAMOND" | "COMPARISON_CIRCLE"; readonly derivationIds: readonly string[]; }
export interface IntentionRenderLink { readonly id: string; readonly projectionId: string; readonly projectedLink: IntentionProjectedLink; readonly sourceNodeId: string; readonly targetNodeId: string; readonly derivationIds: readonly string[]; }
export interface IntentionRenderDerivation { readonly id: string; readonly projectionId: string; readonly derivation: IntentionMetricDerivation; readonly availability: IntentionAvailability; readonly epistemicClassification: IntentionEpistemicClassification; }
export interface IntentionRenderDerivationOwnerGroup { readonly id: string; readonly label: string; readonly identity: string; readonly kind: "EVENT" | "DESCRIPTIVE_LINK"; readonly derivations: readonly IntentionRenderDerivation[]; }
export interface IntentionProjectionRenderModel { readonly projectionId: string; readonly executionId: string; readonly coordinateMeaning: "PRESENTATION_ONLY_NON_SCIENTIFIC"; readonly nodes: readonly IntentionRenderNode[]; readonly links: readonly IntentionRenderLink[]; readonly derivations: readonly IntentionRenderDerivation[]; }
export interface IntentionInitialCameraPose { readonly position: Readonly<{ x: number; y: number; z: number }>; readonly target: Readonly<{ x: number; y: number; z: number }>; }

export function createIntentionInitialCameraPose(model: IntentionProjectionRenderModel): IntentionInitialCameraPose | undefined {
  if (model.nodes.length === 0) return undefined;
  const bounds = model.nodes.reduce((value, node) => ({ minX: Math.min(value.minX, node.coordinates.x), maxX: Math.max(value.maxX, node.coordinates.x), minY: Math.min(value.minY, node.coordinates.y), maxY: Math.max(value.maxY, node.coordinates.y), minZ: Math.min(value.minZ, node.coordinates.z), maxZ: Math.max(value.maxZ, node.coordinates.z) }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity });
  const target = Object.freeze({ x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2, z: (bounds.minZ + bounds.maxZ) / 2 });
  const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ, 80);
  return Object.freeze({ position: Object.freeze({ x: target.x + span * 1.35, y: target.y + span * .72, z: target.z + span * 1.8 }), target });
}

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

export function groupIntentionRenderDerivationsByOwner(model: IntentionProjectionRenderModel): readonly IntentionRenderDerivationOwnerGroup[] {
  const claimed = new Set<string>();
  let groups: readonly IntentionRenderDerivationOwnerGroup[] = [];
  for (const link of model.links) {
    const derivations = resolveIntentionRenderDerivations(model, link.derivationIds);
    if (derivations.length === 0) continue;
    derivations.forEach(item => claimed.add(item.id));
    const source = model.nodes.find(node => node.id === link.sourceNodeId)?.projectedNode.canonicalEventId ?? link.sourceNodeId;
    const target = model.nodes.find(node => node.id === link.targetNodeId)?.projectedNode.canonicalEventId ?? link.targetNodeId;
    groups = [...groups, Object.freeze({ id: link.id, label: "PAIR", identity: `${source} ↔ ${target} · ${link.id}`, kind: "DESCRIPTIVE_LINK", derivations })];
  }
  for (const node of model.nodes) {
    const derivations = resolveIntentionRenderDerivations(model, node.derivationIds.filter(id => !claimed.has(id)));
    if (derivations.length === 0) continue;
    derivations.forEach(item => claimed.add(item.id));
    groups = [...groups, Object.freeze({ id: node.id, label: node.projectedNode.canonicalEventId, identity: node.projectedNode.canonicalEventId, kind: "EVENT", derivations })];
  }
  const unclaimed = model.derivations.filter(item => !claimed.has(item.id));
  if (unclaimed.length > 0) throw new Error(`Unowned render derivation identities for projection ${model.projectionId}: ${unclaimed.map(item => item.id).join(", ")}`);
  return Object.freeze(groups);
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
