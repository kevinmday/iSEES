// ============================================================
// src/resolve/runtime/ResolveRuntimeContext.tsx
//
// P56
// RESOLVE RUNTIME REACT INTEGRATION
//
// React observation layer for the deterministic ResolveRuntime.
//
// ResolveRuntime owns:
//
// • Resolve execution lifecycle
// • Canonical universe construction
// • Deterministic Resolve execution
// • Canonical manifold result
// • Computational provenance
// • Execution history
//
// React owns NONE of that state.
//
// React merely observes ResolveRuntime publications through
// the runtime revision.
//
// IMPORTANT:
//
// The context value contains BOTH:
//
//   • runtime
//   • revision
//
// The runtime instance itself has stable identity.
//
// Therefore revision must participate in the Context value so
// React consumers are re-rendered whenever ResolveRuntime
// publishes a new deterministic runtime state.
//
// Ownership:
//
// Operator
//      ↓
// ResolveRuntimeContext
//      ↓
// ResolveRuntime
//      ↓
// Canonical Computational Universe
//      ↓
// ResolveEngine
//      ↓
// Canonical Manifold
//
// ============================================================

import {

  createContext,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import {
  ResolveRuntime,
} from "./ResolveRuntime";

import type {
  ResolveRuntimeState,
} from "./ResolveRuntimeTypes";

// ============================================================
// CONTEXT VALUE
// ============================================================

type ResolveRuntimeContextValue = {

  runtime:
    ResolveRuntime;

  revision:
    number;

};

// ============================================================
// CONTEXT
// ============================================================

const ResolveRuntimeContext =
  createContext<
    ResolveRuntimeContextValue | undefined
  >(
    undefined,
  );

// ============================================================
// PROVIDER
// ============================================================

interface Props {

  children:
    ReactNode;

}

export function ResolveRuntimeProvider({

  children,

}: Props) {

  // ========================================================
  // RUNTIME INSTANCE
  // ========================================================
  //
  // ResolveRuntime is created once for the lifetime of this
  // provider.
  //
  // React does not own its computational state.
  //
  // ========================================================

  const runtime =
    useMemo(

      () =>
        new ResolveRuntime(),

      [],

    );

  // ========================================================
  // REACT OBSERVATION REVISION
  // ========================================================
  //
  // This value exists only to make runtime publications
  // observable by the React component tree.
  //
  // It mirrors ResolveRuntime.state.revision.
  //
  // ========================================================

  const [
    revision,
    setRevision,
  ] =
    useState(

      runtime
        .getState()
        .revision,

    );

  // ========================================================
  // RUNTIME LIFECYCLE
  // ========================================================

  useEffect(() => {

    // ------------------------------------------------------
    // SUBSCRIBE BEFORE INITIALIZATION
    // ------------------------------------------------------
    //
    // initialize() publishes READY immediately.
    //
    // Therefore the React observer must exist before
    // initialization occurs.
    //
    // ------------------------------------------------------

    const unsubscribe =
      runtime.subscribe(

        () => {

          setRevision(

            runtime
              .getState()
              .revision,

          );

        },

      );

    // ------------------------------------------------------
    // INITIALIZE
    // ------------------------------------------------------

    runtime.initialize();

    // ------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------

    return () => {

      unsubscribe();

      runtime.dispose();

    };

  }, [runtime]);

  // ========================================================
  // PROVIDER
  // ========================================================
  //
  // revision intentionally participates in the Context
  // value.
  //
  // This guarantees that a ResolveRuntime publication causes
  // consumers to observe the new runtime state even though
  // the runtime object itself retains stable identity.
  //
  // ========================================================

  return (

    <ResolveRuntimeContext.Provider
      value={{

        runtime,

        revision,

      }}
    >

      {children}

    </ResolveRuntimeContext.Provider>

  );

}

// ============================================================
// RUNTIME HOOK
// ============================================================

export function useResolveRuntime():
  ResolveRuntime {

  const context =
    useContext(
      ResolveRuntimeContext,
    );

  if (!context) {

    throw new Error(

      "ResolveRuntimeProvider missing.",

    );

  }

  return context.runtime;

}

// ============================================================
// STATE HOOK
// ============================================================
//
// Accessing context here is important.
//
// revision is part of the Context value, so this hook is
// re-rendered whenever ResolveRuntime publishes.
//
// The canonical state itself remains owned by ResolveRuntime.
//
// ============================================================

export function useResolveRuntimeState():
  ResolveRuntimeState {

  const context =
    useContext(
      ResolveRuntimeContext,
    );

  if (!context) {

    throw new Error(

      "ResolveRuntimeProvider missing.",

    );

  }

  return context.runtime
    .getState();

}

// ============================================================
// REVISION HOOK
// ============================================================

export function useResolveRuntimeRevision():
  number {

  const context =
    useContext(
      ResolveRuntimeContext,
    );

  if (!context) {

    throw new Error(

      "ResolveRuntimeProvider missing.",

    );

  }

  return context.revision;

}

// ============================================================
// END
// ============================================================