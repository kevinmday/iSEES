// ============================================================
// src/manifold/engine/index.ts
// P29 MANIFOLD ENGINE FOUNDATION
// PUBLIC EXPORT SURFACE
// FULL DROP-IN FILE
// ============================================================

// ============================================================
// ENGINE
// ============================================================

export {
  buildManifold,
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

  ManifoldState,

  ManifoldTopology,

  ResolvedManifold,

  ResolvedSelection,

  BuildManifoldRequest,

  BuildManifoldResult,

} from "./manifoldTypes";

export {

  ManifoldLayer,

} from "./manifoldTypes";

// ============================================================
// FUTURE EXPORTS
// ============================================================
//
// Planned additions:
//
// export {
//   recomputeManifold,
//   collapseTopology,
//   dissolveTopology,
//   resolveNarratives,
//   resolveContradictions,
//   resolveEntanglement,
//   resolveHotspots,
// } from "./...";
//
// This folder intentionally becomes the deterministic
// computational core of iSEES. Rendering layers (2D graph,
// 3D manifold, timeline, narrative explorer, etc.) consume
// these contracts without owning computation.
//
// ============================================================