// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntimeContext.tsx
// P53
// COMPUTATIONAL KNOWLEDGE OBJECT RUNTIME CONTEXT
//
// React context exposing the deterministic Knowledge Object
// Runtime to UI components.
//
// React observes.
//
// Runtime owns state.
//
// No persistence.
// No networking.
// No AI.
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

  knowledgeObjectRuntime,

} from "./KnowledgeObjectRuntime";

import type {

  KnowledgeRuntimeState,

} from "./KnowledgeObjectRuntimeTypes";

// ============================================================
// CONTEXT
// ============================================================

const KnowledgeObjectRuntimeContext =
  createContext(knowledgeObjectRuntime);

// ============================================================
// PROVIDER
// ============================================================

export interface KnowledgeObjectRuntimeProviderProps {

  children: ReactNode;

}

export function KnowledgeObjectRuntimeProvider(

  props: KnowledgeObjectRuntimeProviderProps,

): React.JSX.Element {

  const runtime = useMemo(

    () => knowledgeObjectRuntime,

    [],

  );

  return (

    <KnowledgeObjectRuntimeContext.Provider value={runtime}>

      {props.children}

    </KnowledgeObjectRuntimeContext.Provider>

  );

}

// ============================================================
// RUNTIME
// ============================================================

export function useKnowledgeObjectRuntime() {

  return useContext(

    KnowledgeObjectRuntimeContext,

  );

}

// ============================================================
// STATE
// ============================================================

export function useKnowledgeRuntimeState():

KnowledgeRuntimeState {

  const runtime = useKnowledgeObjectRuntime();

  const [

    state,

    setState,

  ] = useState(

    runtime.getState(),

  );

  useEffect(

    () => {

      const subscription = runtime.subscribe(

        setState,

      );

      return () => {

        subscription.unsubscribe();

      };

    },

    [runtime],

  );

  return state;

}

// ============================================================
// OBJECTS
// ============================================================

export function useKnowledgeObjects() {

  return useKnowledgeRuntimeState().objects;

}

// ============================================================
// REVISION
// ============================================================

export function useKnowledgeRevision() {

  return useKnowledgeRuntimeState().revision;

}

// ============================================================
// STATUS
// ============================================================

export function useKnowledgeRuntimeStatus() {

  return useKnowledgeRuntimeState().status;

}

// ============================================================
// END
// ============================================================