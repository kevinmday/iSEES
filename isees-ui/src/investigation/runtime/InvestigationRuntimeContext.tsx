// ============================================================
// src/investigation/runtime/InvestigationRuntimeContext.tsx
//
// P44
// INVESTIGATION RUNTIME CONTEXT
//
// React adapter for the deterministic Investigation Runtime.
//
// Responsibilities
//
// • Own a single Investigation Runtime instance
// • Subscribe to runtime updates
// • Trigger React re-rendering
// • Expose the runtime through Context
//
// The runtime itself contains no React code.
// This file is the bridge between React and the runtime.
//
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  InvestigationRuntime,
} from "./InvestigationRuntime";

// ============================================================
// CONTEXT
// ============================================================

const InvestigationRuntimeContext =
  createContext<InvestigationRuntime | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export function InvestigationRuntimeProvider(
  props: PropsWithChildren,
) {

  const runtime = useMemo(
    () => new InvestigationRuntime(),
    [],
  );

  const [, setRevision] = useState(0);

  useEffect(() => {

    runtime.initialize();

    const unsubscribe = runtime.subscribe(
      (state) => {

        setRevision(state.revision);

      },
    );

    return unsubscribe;

  }, [runtime]);

  return (

    <InvestigationRuntimeContext.Provider
      value={runtime}
    >
      {props.children}
    </InvestigationRuntimeContext.Provider>

  );

}

// ============================================================
// HOOK
// ============================================================

export function useInvestigationRuntime(): InvestigationRuntime {

  const runtime = useContext(
    InvestigationRuntimeContext,
  );

  if (!runtime) {

    throw new Error(

      "useInvestigationRuntime must be used inside InvestigationRuntimeProvider.",

    );

  }

  return runtime;

}