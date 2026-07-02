// ============================================================
// src/manifold/engine/manifoldTypes.ts
// P30 MANIFOLD ENGINE FOUNDATION
// MANIFOLD TYPE CONTRACTS
//
// These contracts define the public language of the Manifold
// subsystem. They intentionally contain no computational logic.
// The deterministic Resolve–Dissolve Computation (RDC) pipeline
// will operate exclusively against these contracts.
//
// All manifold subsystems should import from this file.
// ============================================================

/**
 * A canonical manifold.
 * Represents the complete computed topology for a workspace.
 */
export interface Manifold {
    id: string;
    name: string;

    nodes: ManifoldNode[];
    edges: ManifoldEdge[];

    activeLayers: string[];

    statistics: ManifoldStatistics;

    snapshot: ManifoldSnapshot;
}

/**
 * Canonical manifold node.
 */
export interface ManifoldNode {
    id: string;

    type: string;

    label: string;

    metadata?: Record<string, unknown>;
}

/**
 * Canonical manifold edge.
 */
export interface ManifoldEdge {
    id: string;

    source: string;

    target: string;

    relationship: string;

    weight: number;

    metadata?: Record<string, unknown>;
}

/**
 * Active epistemic layer.
 */
export interface ManifoldLayer {
    id: string;

    name: string;

    enabled: boolean;

    metadata?: Record<string, unknown>;
}

/**
 * Immutable snapshot metadata describing a computed manifold.
 */
export interface ManifoldSnapshot {
    revision: number;

    timestamp: string;
}

/**
 * High-level manifold statistics.
 *
 * Additional metrics will migrate into the Metrics subsystem
 * as the deterministic engine evolves.
 */
export interface ManifoldStatistics {
    nodeCount: number;

    edgeCount: number;

    activeLayerCount: number;
}

/**
 * Result returned by the discovery subsystem.
 *
 * This contract intentionally remains minimal until the
 * Discovery subsystem is implemented.
 */
export interface DiscoveryResult {
    discoveredNodes: ManifoldNode[];

    discoveredEdges: ManifoldEdge[];
}

/**
 * Result returned by the layout subsystem.
 */
export interface LayoutResult {
    nodes: ManifoldNode[];

    edges: ManifoldEdge[];
}