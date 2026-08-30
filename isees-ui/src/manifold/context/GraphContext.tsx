// ============================================================
// src/manifold/context/GraphContext.tsx
// P28B GRAPH-DRIVEN INVESTIGATION CONTEXT
// MANIFOLD OWNERSHIP FOUNDATION
// SINGLE SOURCE OF TRUTH
// FULL DROP-IN REPLACEMENT
// ============================================================

import {
  createContext,
  useContext,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

// ============================================================
// INVESTIGATION CONTEXT
// ============================================================

export type InvestigationContext = {

  selectedNodeId:
    string | null;

  selectedEdgeId:
    string | null;

  selectedEventId:
    string | null;

  selectedFacilityId:
    string | null;

  selectedArtifactId:
    string | null;

  selectedClusterId:
    string | null;
};

// ============================================================
// CONTEXT CONTRACT
// ============================================================

type GraphContextType = {

  // ----------------------------------------------------------
  // GRAPH CENTER
  // ----------------------------------------------------------

  centerNodeId:
    string | null;

  setCenterNodeId: (
    nodeId: string | null
  ) => void;

  // ----------------------------------------------------------
  // INVESTIGATION CONTEXT
  // ----------------------------------------------------------

  investigationContext:
    InvestigationContext;

  setInvestigationContext: (
    context: InvestigationContext
  ) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const GraphContext =
  createContext<
    GraphContextType | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function GraphProvider({
  children,
}: {
  children: ReactNode;
}) {

  // ==========================================================
  // GRAPH CENTER
  // ==========================================================

  const [
    centerNodeId,
    setCenterNodeId,
  ] =
    useState<
      string | null
    >(null);

  // ==========================================================
  // INVESTIGATION CONTEXT
  // ==========================================================

  const [
    investigationContext,
    setInvestigationContext,
  ] =
    useState<
      InvestigationContext
    >({

      selectedNodeId:
        null,

      selectedEdgeId:
        null,

      selectedEventId:
        null,

      selectedFacilityId:
        null,

      selectedArtifactId:
        null,

      selectedClusterId:
        null,
    });

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <GraphContext.Provider
      value={{

        centerNodeId,
        setCenterNodeId,

        investigationContext,
        setInvestigationContext,
      }}
    >

      {children}

    </GraphContext.Provider>

  );
}

// ============================================================
// HOOK
// ============================================================

export function useGraph() {

  const context =
    useContext(
      GraphContext
    );

  if (!context) {

    throw new Error(
      "useGraph must be used inside GraphProvider"
    );
  }

  return context;
}