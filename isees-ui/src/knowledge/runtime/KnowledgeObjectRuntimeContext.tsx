// ============================================================
// src/knowledge/runtime/KnowledgeObjectRuntimeContext.tsx
// P56A
// COMPUTATIONAL KNOWLEDGE OBJECT RUNTIME CONTEXT
//
// React integration layer for the deterministic Knowledge
// Object Runtime.
//
// Runtime owns K.
//
// React observes.
//
// Application bootstrap installs the deterministic System
// Canon Knowledge population before consumers begin operating.
//
// Ownership:
//
//     SYSTEM CANON
//          ↓
//     Knowledge Ingress
//          ↓
//          K
//          ↓
//     KnowledgeObjectRuntime
//          ↓
//        React
//
// No topology construction.
// No manifold projection.
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

import {
  bootstrapKnowledgeRuntime,
  isKnowledgeRuntimeBootstrapped,
} from "../ingestion/KnowledgeRuntimeBootstrap";

// ============================================================
// CONTEXT
// ============================================================

const KnowledgeObjectRuntimeContext =
  createContext(
    knowledgeObjectRuntime,
  );

// ============================================================
// PROVIDER
// ============================================================

export interface KnowledgeObjectRuntimeProviderProps {

  children: ReactNode;

}

export function KnowledgeObjectRuntimeProvider(
  props: KnowledgeObjectRuntimeProviderProps,
): React.JSX.Element {

  const runtime =
    useMemo(
      () =>
        knowledgeObjectRuntime,
      [],
    );

  // ----------------------------------------------------------
  // APPLICATION KNOWLEDGE BOOTSTRAP
  // ----------------------------------------------------------
  //
  // The runtime is the canonical owner of K.
  //
  // React initiates application bootstrap, but does not
  // construct or own the resulting Knowledge Objects.
  //
  // The bootstrap service owns source composition.
  //
  // The guard prevents unnecessary replacement if the
  // singleton runtime is already correctly bootstrapped.
  //
  // ----------------------------------------------------------

  useEffect(
    () => {

      if (
        !isKnowledgeRuntimeBootstrapped()
      ) {

        const result =
          bootstrapKnowledgeRuntime();

        console.log(
          "[KNOWLEDGE BOOTSTRAP]",
          {
            sourceEventCount:
              result.sourceEventCount,

            knowledgeObjectCount:
              result.knowledgeObjectCount,

            runtimeObjectCount:
              result.runtimeObjectCount,

            runtimeRevision:
              result.runtimeRevision,
          },
        );

      }

    },
    [runtime],
  );

  return (

    <KnowledgeObjectRuntimeContext.Provider
      value={runtime}
    >

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

  const runtime =
    useKnowledgeObjectRuntime();

  const [
    state,
    setState,
  ] =
    useState(
      runtime.getState(),
    );

  useEffect(
    () => {

      const subscription =
        runtime.subscribe(
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

  return useKnowledgeRuntimeState()
    .objects;

}

// ============================================================
// REVISION
// ============================================================

export function useKnowledgeRevision() {

  return useKnowledgeRuntimeState()
    .revision;

}

// ============================================================
// STATUS
// ============================================================

export function useKnowledgeRuntimeStatus() {

  return useKnowledgeRuntimeState()
    .status;

}

// ============================================================
// END
// ============================================================