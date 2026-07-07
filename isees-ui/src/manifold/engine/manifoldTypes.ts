// ============================================================
// src/manifold/engine/manifoldTypes.ts
// P30 MANIFOLD ENGINE FOUNDATION
// MANIFOLD TYPE CONTRACTS
//
// These contracts define the public language of the Manifold
// subsystem. They intentionally contain no computational logic.
//
// Resolve–Dissolve Computation (RDC) produces the canonical
// deterministic Investigation Manifold.
//
// The Investigation Manifold is the sole deterministic
// representation of the current investigation state.
//
// Graphs, timelines, narratives, intention surfaces and all
// future visualizations are projections derived from the
// Investigation Manifold.
//
// All manifold subsystems should import from this file.
// ============================================================

/**
 * Canonical Investigation Manifold.
 *
 * Represents the complete deterministic state of an
 * investigation.
 *
 * NOTE:
 * Although the exported type name remains "Manifold" for
 * backward compatibility, this contract represents the
 * canonical Investigation Manifold defined by System Canon
 * P33B.
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
 * Canonical alias.
 *
 * Preferred name for all new development.
 *
 * Existing code may continue using "Manifold" until
 * incremental migration occurs.
 */
export type InvestigationManifold = Manifold;

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
 *
 * Layers are computational inputs consumed by
 * Resolve–Dissolve Computation (RDC).
 *
 * Layers never belong to any visualization.
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