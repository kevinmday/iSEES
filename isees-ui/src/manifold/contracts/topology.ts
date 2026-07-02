// ============================================================
// src/manifold/contracts/topology.ts
// P30 MANIFOLD CONTRACT FOUNDATION
// TOPOLOGY CONTRACTS
//
// These contracts describe the deterministic topology produced
// by the Manifold Engine. They intentionally contain no
// computational logic.
//
// Discovery, metrics, layout, and rendering operate against
// these contracts rather than owning topology themselves.
// ============================================================

/**
 * A connected region of the manifold.
 */
export interface TopologyCluster {
    id: string;

    label: string;

    nodeIds: string[];

    metadata?: Record<string, unknown>;
}

/**
 * A bridge connecting two clusters.
 */
export interface TopologyBridge {
    id: string;

    sourceClusterId: string;

    targetClusterId: string;

    edgeIds: string[];

    metadata?: Record<string, unknown>;
}

/**
 * A connected component within the manifold.
 */
export interface TopologyComponent {
    id: string;

    nodeIds: string[];

    edgeIds: string[];
}

/**
 * The local neighborhood surrounding a node.
 */
export interface TopologyNeighborhood {
    nodeId: string;

    neighborNodeIds: string[];

    edgeIds: string[];
}

/**
 * Canonical topology produced by the Manifold Engine.
 */
export interface Topology {
    clusters: TopologyCluster[];

    bridges: TopologyBridge[];

    components: TopologyComponent[];

    neighborhoods: TopologyNeighborhood[];
}