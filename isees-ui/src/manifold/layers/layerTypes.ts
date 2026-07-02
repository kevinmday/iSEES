// ============================================================
// src/manifold/layers/layerTypes.ts
// P30 MANIFOLD LAYER FOUNDATION
// LAYER TYPE CONTRACTS
//
// These contracts define the public language of epistemic
// layers used throughout the Manifold subsystem.
//
// ============================================================

/**
 * Canonical layer groups.
 */
export const LayerGroup = {
    OBSERVATION: "OBSERVATION",
    CONTEXT: "CONTEXT",
    HUMAN: "HUMAN",
    PHYSICAL: "PHYSICAL",
    CULTURAL: "CULTURAL",
    COMPUTATIONAL: "COMPUTATIONAL",
} as const;

export type LayerGroup =
    (typeof LayerGroup)[keyof typeof LayerGroup];

/**
 * Describes a single epistemic layer.
 */
export interface LayerDefinition {
    id: string;

    name: string;

    description: string;

    group: LayerGroup;

    enabledByDefault: boolean;
}

/**
 * Runtime state of a layer within a manifold computation.
 */
export interface ActiveLayer {
    layer: LayerDefinition;

    enabled: boolean;
}