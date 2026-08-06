// ============================================================
// src/session/runtime/OperatorSessionRuntimeContext.tsx
// P54A
// COMPUTATIONAL OPERATOR SESSION RUNTIME CONTEXT
//
// React observes the Operator Session Runtime.
//
// The runtime owns all mutable session state.
//
// ============================================================

import {

  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,

} from "react";

import type {

  ReactNode,

} from "react";

import {

  operatorSessionRuntime,

} from "./OperatorSessionRuntime";

import type {

  OperatorSessionState,

} from "./OperatorSessionRuntimeTypes";

// ============================================================
// CONTEXT
// ============================================================

const OperatorSessionRuntimeContext =
  createContext<OperatorSessionState>(

    operatorSessionRuntime.getState(),

  );

// ============================================================
// PROVIDER
// ============================================================

interface Props {

  children:
    ReactNode;

}

export function OperatorSessionRuntimeProvider({

  children,

}: Props) {

  const [

    state,

    setState,

  ] = useState(

    operatorSessionRuntime.getState(),

  );

  useEffect(

    () =>

      operatorSessionRuntime.subscribe(

        () => {

          setState(

            operatorSessionRuntime.getState(),

          );

        },

      ),

    [],

  );

  const value =

    useMemo(

      () => state,

      [state],

    );

  return (

    <OperatorSessionRuntimeContext.Provider

      value={value}

    >

      {children}

    </OperatorSessionRuntimeContext.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useOperatorSession() {

  return useContext(

    OperatorSessionRuntimeContext,

  );

}

export function useActiveOperatorSession() {

  return useOperatorSession()

    .activeSession;

}

export function useOperatorSessionRevision() {

  return useOperatorSession()

    .revision;

}