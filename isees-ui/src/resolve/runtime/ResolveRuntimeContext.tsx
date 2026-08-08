// ============================================================
// src/resolve/runtime/ResolveRuntimeContext.tsx
//
// P55A
// RESOLVE RUNTIME CONTEXT
//
// React integration layer for the Resolve Runtime.
//
// This file owns NO computation.
//
// It simply exposes a singleton ResolveRuntime instance to
// the React component tree.
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

import { ResolveRuntime } from "./ResolveRuntime";

// ============================================================
// CONTEXT
// ============================================================

const Context = createContext<ResolveRuntime | null>(

  null,

);

// ============================================================
// PROVIDER
// ============================================================

interface Props {

  children: ReactNode;

}

export function ResolveRuntimeProvider({

  children,

}: Props) {

  const runtime = useMemo(

    () => new ResolveRuntime(),

    [],

  );

  const [, setRevision] = useState(0);

  useEffect(() => {

    runtime.initialize();

    const unsubscribe = runtime.subscribe(

      () => {

        setRevision(

          runtime.getState().revision,

        );

      },

    );

    return () => {

      unsubscribe();

      runtime.dispose();

    };

  }, [runtime]);

  return (

    <Context.Provider value={runtime}>

      {children}

    </Context.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useResolveRuntime(): ResolveRuntime {

  const runtime = useContext(Context);

  if (!runtime) {

    throw new Error(

      "ResolveRuntimeProvider missing.",

    );

  }

  return runtime;

}

export function useResolveRuntimeState() {

  return useResolveRuntime().getState();

}

export function useResolveRuntimeRevision(): number {

  return useResolveRuntime()

    .getState()

    .revision;

}