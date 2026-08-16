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

  // ==========================================================
  // RUNTIME PUBLICATION TOKEN
  // ==========================================================
  //
  // React owns no Research Desk state.
  //
  // The deterministic Research Bridge Runtime remains the
  // canonical owner of:
  //
  //   - Research Desk
  //   - Research entries
  //   - Research revision
  //
  // React merely maintains a publication token so runtime
  // mutations cause React consumers to render again.
  //
  // IMPORTANT:
  //
  // Guest workspace restoration may occur before this Provider's
  // useEffect subscription has attached.
  //
  // Therefore the initial React publication token MUST reflect
  // the runtime's already-current revision rather than beginning
  // blindly at zero.
  //
  // This is the same late-subscription boundary repaired for the
  // Workspace Runtime during P56D-I1-G2.
  // ==========================================================

  const [
    revision,
    setRevision,
  ] = useState(
    () =>
      researchBridgeRuntime
        .getRevision(),
  );

  useEffect(() => {

    // ----------------------------------------------------------
    // SUBSCRIBE FIRST
    // ----------------------------------------------------------
    //
    // Attach before synchronizing so no publication can occur
    // between observing the runtime and installing the listener.
    // ----------------------------------------------------------

    const unsubscribe =
      researchBridgeRuntime.subscribe(() => {

        setRevision(
          researchBridgeRuntime
            .getRevision(),
        );

      });

    // ----------------------------------------------------------
    // LATE-SUBSCRIPTION SYNCHRONIZATION
    // ----------------------------------------------------------
    //
    // The runtime may have changed before this effect attached.
    //
    // Synchronize React immediately with the canonical runtime
    // revision after the subscription exists.
    // ----------------------------------------------------------

    setRevision(
      researchBridgeRuntime
        .getRevision(),
    );

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
 *
 * The Context publication token causes the consumer to render
 * whenever the canonical Research Bridge Runtime revision changes.
 *
 * The Research Desk itself remains runtime-owned.
 */
export function useResearchDesk() {

  const context =
    useContext(
      ResearchBridgeContext,
    );

  if (!context) {

    throw new Error(

      "useResearchDesk must be used inside ResearchBridgeProvider",

    );

  }

  // Establish the React dependency on the Context publication.
  //
  // The value itself is not copied into React state; reading the
  // canonical desk remains a runtime operation.

  void context.revision;

  return context.runtime
    .getDesk();

}

/**
 * Convenience hook for the
 * current Research Bridge revision.
 */
export function useResearchRevision() {

  const context =
    useContext(
      ResearchBridgeContext,
    );

  if (!context) {

    throw new Error(

      "useResearchRevision must be used inside ResearchBridgeProvider",

    );

  }

  return context.revision;

}