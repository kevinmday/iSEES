// ============================================================
// src/manifold/contracts/metrics.ts
// P30 MANIFOLD CONTRACT FOUNDATION
// METRIC CONTRACTS
//
// These contracts describe the deterministic metrics produced
// during manifold computation.
//
// Metrics quantify the state of a computed manifold. They do
// not participate in topology construction or discovery.
//
// ============================================================

/**
 * Individual deterministic metric.
 */
export interface Metric {
    id: string;

    name: string;

    value: number;

    description: string;
}

/**
 * Collection of metrics produced during a single manifold
 * computation.
 */
export interface MetricResult {
    metrics: Metric[];

    generatedAt: string;
}

/**
 * High-level manifold summary metrics.
 *
 * These values represent the initial canonical metrics.
 * Additional metrics may be introduced as RDC evolves.
 */
export interface ManifoldMetrics {
    nodeCount: number;

    edgeCount: number;

    clusterCount: number;

    bridgeCount: number;

    discoveryCount: number;

    activeLayerCount: number;
}