// ============================================================
// src/workspace/runtime/index.ts
// P34
// WORKSPACE RUNTIME
// PUBLIC EXPORT SURFACE
//
// Canonical public API for the deterministic Workspace Runtime
// subsystem.
//
// Consumers should import from this module rather than
// implementation files whenever possible.
//
// ============================================================

// ============================================================
// RUNTIME
// ============================================================

export {
  WorkspaceRuntime,
  workspaceRuntime,
} from "./WorkspaceRuntime";

// ============================================================
// CONTEXT
// ============================================================

export {
  WorkspaceRuntimeProvider,
  useWorkspaceRuntime,
} from "./WorkspaceRuntimeContext";

// ============================================================
// TYPES
// ============================================================

export type {

  WorkspaceRuntimeStatus,

  WorkspaceRuntimeSession,

  WorkspaceRuntimeState,

} from "./WorkspaceRuntimeTypes";

// ============================================================
// ARCHITECTURE
// ============================================================
//
// Operator
//      ↓
// MainLayout
//      ↓
// Workspace Runtime
//      ├── Workspace Context
//      ├── Manifold Runtime
//      ├── Corpus
//      ├── Artifacts
//      └── Future Runtime Services
//
// The Workspace Runtime owns the deterministic Investigation
// Session while delegating computation to the Resolve–Dissolve
// Computation (RDC) subsystem through the Manifold Runtime.
//
// ============================================================