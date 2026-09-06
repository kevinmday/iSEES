// ============================================================
// src/manifold/layers/systemCanonLayers.ts
// P30 MANIFOLD LAYER FOUNDATION
// SYSTEM CANONICAL LAYER REGISTRY
//
// This file defines the authoritative registry of system
// epistemic layers available to the Manifold Engine.
//
// New layers should be added here rather than scattered
// throughout the application.
//
// ============================================================

import { LayerGroup } from "./layerTypes.ts";
import type { LayerDefinition } from "./layerTypes.ts";
import { CanonicalLayerCatalog, CanonicalLayerProfileId } from "../../layers/catalog/index.ts";

/**
 * Canonical system-defined layers.
 *
 * The initial registry intentionally reflects the layers
 * already established within the current iSEES architecture.
 * Additional domains will be introduced as their deterministic
 * computational semantics are formalized.
 */
const compatibilityIds = ["OBSERVABILITY", "NARRATIVE", "TEMPORAL", "GEOGRAPHY", "INFRASTRUCTURE"] as const;
const compatibilityGroup = {
    OBSERVABILITY: LayerGroup.OBSERVATION, NARRATIVE: LayerGroup.CONTEXT, TEMPORAL: LayerGroup.CONTEXT,
    GEOGRAPHY: LayerGroup.PHYSICAL, INFRASTRUCTURE: LayerGroup.PHYSICAL,
} as const;
const compatibilityEntries = compatibilityIds.map((id) => {
    const canonical = CanonicalLayerCatalog.find((entry) => entry.id === id);
    if (!canonical) throw new Error(`Canonical compatibility layer ${id} is missing.`);
    return [id, Object.freeze({ id, name: canonical.label, description: canonical.description, group: compatibilityGroup[id], enabledByDefault: canonical.defaultProfileMembership.includes(CanonicalLayerProfileId.CANONICAL_BASELINE) })] as const;
});

export const SystemCanonLayers = Object.freeze(Object.fromEntries(compatibilityEntries)) as Readonly<Record<typeof compatibilityIds[number], LayerDefinition>>;

/**
 * Flat collection of all canonical layers.
 */
export const CanonicalLayerRegistry: readonly LayerDefinition[] =
    Object.values(SystemCanonLayers);

/**
 * Resolve a canonical layer by identifier.
 */
export function getSystemLayer(
    id: string,
): LayerDefinition | undefined {
    return CanonicalLayerRegistry.find(
        (layer) => layer.id === id,
    );
}
