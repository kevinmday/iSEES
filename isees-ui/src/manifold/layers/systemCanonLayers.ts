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

import { LayerGroup } from "./layerTypes";
import type { LayerDefinition } from "./layerTypes";

/**
 * Canonical system-defined layers.
 *
 * The initial registry intentionally reflects the layers
 * already established within the current iSEES architecture.
 * Additional domains will be introduced as their deterministic
 * computational semantics are formalized.
 */
export const SystemCanonLayers = {

    OBSERVABILITY: {
        id: "OBSERVABILITY",
        name: "Observability",
        description:
            "Sensor observations, witnesses, instrumentation, and evidence.",
        group: LayerGroup.OBSERVATION,
        enabledByDefault: true,
    },

    NARRATIVE: {
        id: "NARRATIVE",
        name: "Narrative",
        description:
            "Claims, reports, testimony, and descriptive accounts.",
        group: LayerGroup.CONTEXT,
        enabledByDefault: true,
    },

    TEMPORAL: {
        id: "TEMPORAL",
        name: "Temporal",
        description:
            "Time relationships, chronology, sequencing, and recurrence.",
        group: LayerGroup.CONTEXT,
        enabledByDefault: true,
    },

    GEOGRAPHY: {
        id: "GEOGRAPHY",
        name: "Geography",
        description:
            "Spatial relationships, location, terrain, and proximity.",
        group: LayerGroup.PHYSICAL,
        enabledByDefault: false,
    },

    INFRASTRUCTURE: {
        id: "INFRASTRUCTURE",
        name: "Infrastructure",
        description:
            "Facilities, platforms, organizations, and supporting systems.",
        group: LayerGroup.PHYSICAL,
        enabledByDefault: false,
    },

} as const satisfies Record<string, LayerDefinition>;

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