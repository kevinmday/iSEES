// ============================================================
// src/identity/runtime/OperatorIdentityRuntimeContext.tsx
// P56D-I1
// OPERATOR IDENTITY RUNTIME REACT CONTEXT
//
// React observation bridge for OperatorIdentityRuntime.
//
// The deterministic runtime owns all mutable identity state.
//
// React:
//   - observes runtime publication
//   - exposes identity state to components
//   - does NOT own identity
//   - does NOT infer Guest/Account state
//
// Architectural invariants:
//
//   Identity != Session
//   Identity != Workspace
//   React != Runtime ownership
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

  operatorIdentityRuntime,

} from "./OperatorIdentityRuntime";

import type {

  OperatorIdentityState,

} from "./OperatorIdentityRuntimeTypes";

import {

  getOperatorIdentityKind,
  hasOperatorIdentity,
  isAccountOperator,
  isDurablyPersistent,
  isGuestOperator,
  isSessionPersistent,

} from "./OperatorIdentityRuntimeTypes";


// ============================================================
// CONTEXT
// ============================================================

type OperatorIdentityRuntimeContextValue = {

  state:
    OperatorIdentityState;

};


const OperatorIdentityRuntimeContext =
  createContext<
    OperatorIdentityRuntimeContextValue | undefined
  >(undefined);


// ============================================================
// PROVIDER
// ============================================================
//
// Runtime owns mutable identity state.
//
// React merely observes runtime publication.
//
// Initialization is performed here because this provider marks
// the point at which the identity runtime becomes operational
// for the React application.
//
// initialize() is idempotent.
//
// ============================================================

export function OperatorIdentityRuntimeProvider({

  children,

}: {

  children:
    ReactNode;

}) {

  const [

    state,

    setState,

  ] = useState<OperatorIdentityState>(

    operatorIdentityRuntime.getState(),

  );


  useEffect(

    () => {

      const unsubscribe =
        operatorIdentityRuntime.subscribe(

          () => {

            setState(

              operatorIdentityRuntime.getState(),

            );

          },

        );


      operatorIdentityRuntime.initialize();


      // Synchronize after initialization in case publication
      // occurred before React processed the subscription update.

      setState(

        operatorIdentityRuntime.getState(),

      );


      return unsubscribe;

    },

    [],

  );


  const value =
    useMemo(

      () => ({

        state,

      }),

      [state],

    );


  return (

    <OperatorIdentityRuntimeContext.Provider

      value={value}

    >

      {children}

    </OperatorIdentityRuntimeContext.Provider>

  );

}


// ============================================================
// BASE HOOK
// ============================================================

export function useOperatorIdentityRuntime() {

  const context =
    useContext(

      OperatorIdentityRuntimeContext,

    );


  if (!context) {

    throw new Error(

      "useOperatorIdentityRuntime must be used inside OperatorIdentityRuntimeProvider",

    );

  }


  return {

    runtime:
      operatorIdentityRuntime,

    state:
      context.state,

  };

}


// ============================================================
// STATE HOOK
// ============================================================

export function useOperatorIdentity() {

  return useOperatorIdentityRuntime()
    .state;

}


// ============================================================
// SEMANTIC HOOKS
// ============================================================

export function useOperatorIdentityKind() {

  const state =
    useOperatorIdentity();

  return getOperatorIdentityKind(
    state,
  );

}


export function useHasOperatorIdentity() {

  const state =
    useOperatorIdentity();

  return hasOperatorIdentity(
    state,
  );

}


export function useIsGuestOperator() {

  const state =
    useOperatorIdentity();

  return isGuestOperator(
    state,
  );

}


export function useIsAccountOperator() {

  const state =
    useOperatorIdentity();

  return isAccountOperator(
    state,
  );

}


// ============================================================
// PERSISTENCE HOOKS
// ============================================================

export function useIsSessionPersistentOperator() {

  const state =
    useOperatorIdentity();

  return isSessionPersistent(
    state,
  );

}


export function useIsDurablyPersistentOperator() {

  const state =
    useOperatorIdentity();

  return isDurablyPersistent(
    state,
  );

}


// ============================================================
// REVISION HOOK
// ============================================================

export function useOperatorIdentityRevision() {

  return useOperatorIdentity()
    .revision;

}