// ============================================================
// src/workspace/runtime/WorkspaceRuntimeContext.tsx
// P34
// WORKSPACE RUNTIME CONTEXT
//
// React access layer for the deterministic Workspace Runtime.
//
// This context does NOT own deterministic computation.
// It simply exposes the singleton Workspace Runtime to the
// operator interface.
//
// Ownership:
//
// Operator
//      ↓
// MainLayout
//      ↓
// WorkspaceRuntimeContext
//      ↓
// Workspace Runtime
//      ↓
// Manifold Runtime
//      ↓
// Resolve–Dissolve Computation (RDC)
//
// ============================================================

import {
  createContext,
  useContext,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  workspaceRuntime,
} from "./WorkspaceRuntime";

import type {
  WorkspaceRuntime,
} from "./WorkspaceRuntime";

// ============================================================
// CONTEXT
// ============================================================

const WorkspaceRuntimeContext =
  createContext<
    WorkspaceRuntime | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function WorkspaceRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {

  return (

    <WorkspaceRuntimeContext.Provider
      value={workspaceRuntime}
    >
      {children}
    </WorkspaceRuntimeContext.Provider>

  );

}

// ============================================================
// HOOK
// ============================================================

export function useWorkspaceRuntime() {

  const runtime =
    useContext(
      WorkspaceRuntimeContext
    );

  if (!runtime) {

    throw new Error(
      "useWorkspaceRuntime must be used inside WorkspaceRuntimeProvider"
    );

  }

  return runtime;

}