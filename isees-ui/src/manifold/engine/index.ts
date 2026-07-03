// ============================================================
// src/manifold/engine/index.ts
// P31A
// DETERMINISTIC MANIFOLD ENGINE
// PUBLIC EXPORT SURFACE
//
// This module exposes the complete public API of the
// deterministic Manifold subsystem.
//
// Consumers should import from this file rather than individual
// implementation modules whenever possible.
//
// ============================================================

// ============================================================
// ENGINE
// ============================================================

export {
  computeManifold,
} from "./manifoldEngine";

// ============================================================
// RUNTIME
// ============================================================

export {
  manifoldRuntime,
  ManifoldRuntime,
  DEFAULT_MANIFOLD_RUNTIME,
} from "./manifoldRuntime";

// ============================================================
// CONTEXT RESOLVER
// ============================================================

export {
  resolveInvestigationContext,
} from "./manifoldContextResolver";

// ============================================================
// TYPES
// ============================================================

export type {

  Manifold,

  ManifoldNode,

  ManifoldEdge,

  ManifoldLayer,

  ManifoldSnapshot,

  ManifoldStatistics,

  DiscoveryResult,

  LayoutResult,

} from "./manifoldTypes";

export type {

  ManifoldRuntimeState,

  ManifoldViewMode,

} from "./manifoldRuntime";

// ============================================================
// FUTURE EXPORTS
// ============================================================
//
// Planned additions:
//
// export {
//   manifoldDiscovery,
//   manifoldResolver,
//   manifoldMetrics,
//   manifoldLayout,
//   manifoldHistory,
// } from "./...";
//
// The Manifold subsystem is intentionally layered:
//
// Operator
//      ↓
// Runtime
//      ↓
// Engine
//      ↓
// Discovery / Metrics / Layout / History
//
// Rendering layers (2D manifold, 3D manifold,
// investigation workspace, narratives, timelines,
// etc.) consume these public contracts without owning
// deterministic computation.
//
// ============================================================