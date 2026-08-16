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
// P56D-I1-G2
// LATE-SUBSCRIPTION PUBLICATION SYNCHRONIZATION
//
// Guest workspace restoration may occur before React mounts this
// provider. Therefore the provider must synchronize against the
// runtime's already-current canonical revision when it mounts.
//
// Runtime state remains authoritative. React does not reconstruct,
// duplicate, or independently own workspace state.
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

type WorkspaceRuntimeContextValue = {

  runtime: WorkspaceRuntime;

  revision: number;

};

const WorkspaceRuntimeContext =
  createContext<
    WorkspaceRuntimeContextValue | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function WorkspaceRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ----------------------------------------------------------
  // REACT PUBLICATION REVISION
  // ----------------------------------------------------------
  //
  // React does not own Workspace Runtime state.
  //
  // The runtime revision is the canonical publication marker.
  //
  // IMPORTANT:
  //
  // Guest restoration may mutate WorkspaceRuntime before this
  // provider subscribes.
  //
  // Initializing from the runtime's current revision ensures the
  // first React render observes the already-restored runtime
  // rather than assuming revision zero.
  // ----------------------------------------------------------

  const [revision, setRevision] =
    useState(
      () =>
        workspaceRuntime
          .getState()
          .revision,
    );

  useEffect(() => {

    // --------------------------------------------------------
    // SUBSCRIBE FIRST
    // --------------------------------------------------------
    //
    // Subscribe before performing the synchronization read.
    //
    // This prevents a mutation occurring between the initial
    // render and effect execution from being lost.
    // --------------------------------------------------------

    const unsubscribe =
      workspaceRuntime.subscribe(() => {

        setRevision(
          workspaceRuntime
            .getState()
            .revision,
        );

      });

    // --------------------------------------------------------
    // LATE-SUBSCRIPTION SYNCHRONIZATION
    // --------------------------------------------------------
    //
    // Restoration may already have completed before React
    // subscribed.
    //
    // Read the canonical runtime revision immediately after
    // subscription so React catches up with any state mutation
    // that occurred before this observer existed.
    // --------------------------------------------------------

    setRevision(
      workspaceRuntime
        .getState()
        .revision,
    );

    return unsubscribe;

  }, []);

  return (

    <WorkspaceRuntimeContext.Provider
      value={{

        runtime:
          workspaceRuntime,

        revision,

      }}
    >
      {children}
    </WorkspaceRuntimeContext.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useWorkspaceRuntime() {

  const context =
    useContext(
      WorkspaceRuntimeContext,
    );

  if (!context) {

    throw new Error(
      "useWorkspaceRuntime must be used inside WorkspaceRuntimeProvider",
    );

  }

  return context.runtime;

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