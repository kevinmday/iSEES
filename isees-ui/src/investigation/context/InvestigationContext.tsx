// ============================================================
// src/investigation/context/InvestigationContext.tsx
// P29
// INVESTIGATION LIFECYCLE FOUNDATION
// INVESTIGATION OWNERSHIP CONTEXT
//
// Single source of truth for the active Investigation.
//
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
  Investigation,
  InvestigationRevision,
} from "../investigationTypes";

import {
  DEFAULT_INVESTIGATION,
} from "../defaultInvestigation";

// ============================================================
// CONTEXT CONTRACT
// ============================================================

type InvestigationContextType = {

  activeInvestigation:
    Investigation;

  setActiveInvestigation: (
    investigation: Investigation
  ) => void;

  addRevision: (
    revision: InvestigationRevision
  ) => void;

  setCurrentRevision: (
    revisionId: string | undefined
  ) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const InvestigationContext =
  createContext<
    InvestigationContextType | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function InvestigationProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [

    activeInvestigation,

    setActiveInvestigation,

  ] =
    useState<Investigation>(
      DEFAULT_INVESTIGATION
    );

  // ==========================================================
  // ADD REVISION
  // ==========================================================

  function addRevision(
    revision: InvestigationRevision
  ) {

    setActiveInvestigation(
      current => ({

        ...current,

        updatedAt:
          revision.timestamp,

        currentRevisionId:
          revision.id,

        revisions: [

          ...current.revisions,

          revision,
        ],
      })
    );
  }

  // ==========================================================
  // SELECT CURRENT REVISION
  // ==========================================================

  function setCurrentRevision(
    revisionId:
      string | undefined
  ) {

    setActiveInvestigation(
      current => ({

        ...current,

        currentRevisionId:
          revisionId,
      })
    );
  }

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <InvestigationContext.Provider
      value={{

        activeInvestigation,

        setActiveInvestigation,

        addRevision,

        setCurrentRevision,
      }}
    >

      {children}

    </InvestigationContext.Provider>

  );
}

// ============================================================
// HOOK
// ============================================================

export function useInvestigation() {

  const context =
    useContext(
      InvestigationContext
    );

  if (!context) {

    throw new Error(
      "useInvestigation must be used inside InvestigationProvider"
    );
  }

  return context;
}