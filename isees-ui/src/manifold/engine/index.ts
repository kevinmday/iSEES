// ============================================================
// src/manifold/engine/index.ts
// P30 MANIFOLD ENGINE FOUNDATION
// PUBLIC EXPORT SURFACE
// FULL DROP-IN FILE
// ============================================================

// ============================================================
// ENGINE
// ============================================================

export {
  computeManifold,
} from "./manifoldEngine";

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
// The Manifold Engine is the deterministic computational
// core of iSEES. It implements the Resolve–Dissolve
// Computation (RDC) methodology while exposing a stable
// public API for consumers.
//
// Rendering layers (2D graph, 3D manifold, timeline,
// narratives, investigation workspace, etc.) consume these
// contracts without owning computation.
//
// ============================================================