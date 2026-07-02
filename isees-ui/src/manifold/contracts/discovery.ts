// ============================================================
// src/manifold/contracts/discovery.ts
// P30 MANIFOLD CONTRACT FOUNDATION
// DISCOVERY CONTRACTS
//
// These contracts describe the deterministic discoveries
// produced by the Manifold Engine after topology has been
// computed.
//
// Discovery does not own topology. It interprets topology and
// identifies structures that may be meaningful to an operator.
//
// ============================================================

/**
 * Categories of discoveries that may be produced by the
 * deterministic discovery pipeline.
 */
export const DiscoveryKind = {
    EMERGENT_NODE: "EMERGENT_NODE",
    EMERGENT_EDGE: "EMERGENT_EDGE",
    CLUSTER: "CLUSTER",
    BRIDGE: "BRIDGE",
    CONTRADICTION: "CONTRADICTION",
    ANOMALY: "ANOMALY",
    PATTERN: "PATTERN",
} as const;

export type DiscoveryKind =
    (typeof DiscoveryKind)[keyof typeof DiscoveryKind];

/**
 * Base discovery contract.
 */
export interface Discovery {
    id: string;

    kind: DiscoveryKind;

    title: string;

    description: string;

    confidence: number;

    metadata?: Record<string, unknown>;
}

/**
 * Collection of discoveries generated during a single manifold
 * computation.
 */
export interface DiscoveryResult {
    discoveries: Discovery[];

    generatedAt: string;
}
