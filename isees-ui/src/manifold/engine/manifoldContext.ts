// ============================================================
// src/manifold/engine/manifoldContext.ts
// P30 MANIFOLD ENGINE FOUNDATION
// MANIFOLD EXECUTION CONTEXT
//
// Defines the deterministic execution context supplied to the
// Manifold Engine during every Resolve–Dissolve Computation (RDC)
// pass.
//
// The Manifold Engine is intentionally UI-agnostic. React,
// application state, and presentation concerns are responsible
// for constructing a ManifoldContext and passing it to the
// engine. All manifold subsystems operate exclusively against
// this contract.
//
// As the engine evolves, additional context such as operator
// mode, corpus references, history, and engine settings may be
// incorporated without affecting subsystem boundaries.
// ============================================================

/**
 * Canonical execution context for a manifold computation.
 */
export interface ManifoldContext {
    /**
     * Active investigation workspace.
     */
    workspaceId: string;

    /**
     * Primary event currently in operator focus.
     */
    focusedEventId?: string;

    /**
     * Active epistemic layers participating in this RDC pass.
     */
    activeLayerIds: string[];

    /**
     * Operator-selected manifold nodes.
     */
    selectedNodeIds: string[];

    /**
     * Operator-selected manifold edges.
     */
    selectedEdgeIds: string[];

    /**
     * Timestamp associated with this computation.
     */
    timestamp: string;
}