// ============================================================
// src/workspace/runtime/WorkspaceRuntimeContext.tsx
// P34D
// WORKSPACE RUNTIME CONTEXT
//
// React access layer for the deterministic Workspace Runtime.
//
// The Workspace Runtime remains the canonical owner of the
// Investigation Session and Operator State.
//
// This context bridges runtime state changes into the React
// rendering lifecycle without transferring ownership.
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
// HOOK
// ============================================================

export function useWorkspaceRuntime() {

  const runtime =
    useContext(
      WorkspaceRuntimeContext
    );

  if (!runtime) {

    throw new Error(
      "useWorkspaceRuntime must be used inside WorkspaceRuntimeProvider",
    );

  }

  return runtime;

}