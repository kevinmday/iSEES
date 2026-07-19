// ============================================================
// src/research/ResearchBridgeContext.tsx
// P41A
// RESEARCH BRIDGE CONTEXT
//
// React observation layer for the deterministic
// Research Bridge Runtime.
//
// The Research Bridge Runtime remains the canonical
// owner of the active Research Desk.
//
// React owns nothing.
//
// Ownership:
//
// Investigation Graph
//          ↓
// Research Bridge Runtime
//          ↓
// Research Bridge Context
//          ↓
// React Components
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
  researchBridgeRuntime,
} from "./ResearchBridgeRuntime";

import type {
  ResearchBridgeRuntime,
} from "./ResearchBridgeRuntime";

// ============================================================
// CONTEXT
// ============================================================

type ResearchBridgeContextValue = {

  runtime:
    ResearchBridgeRuntime;

  revision:
    number;

};

const ResearchBridgeContext =
  createContext<
    ResearchBridgeContextValue | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function ResearchBridgeProvider({
  children,
}: {
  children: ReactNode;
}) {

  // React owns no Research Desk state.
  //
  // React simply observes deterministic
  // runtime revisions.

  const [
    revision,
    forceUpdate,
  ] = useState(0);

  useEffect(() => {

    const unsubscribe =
      researchBridgeRuntime.subscribe(() => {

        forceUpdate(
          revision => revision + 1,
        );

      });

    return unsubscribe;

  }, []);

  return (

    <ResearchBridgeContext.Provider
      value={{

        runtime:
          researchBridgeRuntime,

        revision,

      }}
    >

      {children}

    </ResearchBridgeContext.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useResearchBridge() {

  const context =
    useContext(
      ResearchBridgeContext,
    );

  if (!context) {

    throw new Error(

      "useResearchBridge must be used inside ResearchBridgeProvider",

    );

  }

  return context.runtime;

}

/**
 * Convenience hook for the
 * active Research Desk.
 */

export function useResearchDesk() {

  return useResearchBridge()
    .getDesk();

}

/**
 * Convenience hook for the
 * current Research Bridge revision.
 */

export function useResearchRevision() {

  return useResearchBridge()
    .getRevision();

}