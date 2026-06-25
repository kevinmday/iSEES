// ============================================================
// src/manifold/context/GraphContext.tsx
// P26.1 MANIFOLD OWNERSHIP FOUNDATION
// GRAPH INTERACTION CONTEXT
// FULL DROP-IN FILE
// ============================================================

import {
  createContext,
  useContext,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  GraphSelection,
} from "../graphTypes";

// ============================================================
// CONTEXT CONTRACT
// ============================================================

type GraphContextType = {

  selection:
    GraphSelection;

  setSelection: (
    selection: GraphSelection
  ) => void;

  centerNodeId:
    string | null;

  setCenterNodeId: (
    nodeId: string | null
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

  const [
    selection,
    setSelection,
  ] =
    useState<GraphSelection>({
      kind: "NONE",
    });

  const [
    centerNodeId,
    setCenterNodeId,
  ] =
    useState<
      string | null
    >(null);

  return (

    <GraphContext.Provider
      value={{

        selection,

        setSelection,

        centerNodeId,

        setCenterNodeId,
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