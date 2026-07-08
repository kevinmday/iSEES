// ============================================================
// src/workspace/runtime/WorkspaceRuntimeContext.tsx
// P36
// RUNTIME-OWNED INVESTIGATION CONTEXT
//
// React access layer for the deterministic Workspace Runtime.
//
// The Workspace Runtime remains the canonical owner of:
//
// • Active Workspace
// • Active Investigation
// • Operator State
//
// React merely observes runtime state changes.
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
  useEffect,
  useState,
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

  // React does not own runtime state.
  // It simply re-renders whenever the deterministic
  // Workspace Runtime publishes a revision.

  const [, forceUpdate] =
    useState(0);

  useEffect(() => {

    const unsubscribe =
      workspaceRuntime.subscribe(() => {

        forceUpdate(
          revision => revision + 1,
        );

      });

    return unsubscribe;

  }, []);

  return (

    <WorkspaceRuntimeContext.Provider
      value={workspaceRuntime}
    >
      {children}
    </WorkspaceRuntimeContext.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useWorkspaceRuntime() {

  const runtime =
    useContext(
      WorkspaceRuntimeContext,
    );

  if (!runtime) {

    throw new Error(
      "useWorkspaceRuntime must be used inside WorkspaceRuntimeProvider",
    );

  }

  return runtime;

}

/**
 * Convenience hook for the active investigation.
 *
 * Workspace modes should consume investigation state from
 * the Workspace Runtime rather than maintaining their own
 * duplicate investigation state.
 */
export function useActiveInvestigation() {

  return useWorkspaceRuntime()
    .getActiveInvestigation();

}

/**
 * Convenience hook for the active workspace mode.
 */
export function useWorkspaceMode() {

  return useWorkspaceRuntime()
    .getActiveMode();

}