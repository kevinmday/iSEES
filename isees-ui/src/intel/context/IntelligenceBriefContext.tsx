// ============================================================
// src/intel/context/IntelligenceBriefContext.tsx
// P26.1
// INTELLIGENCE BRIEF CONTEXT
// UNIVERSAL INSPECTION SURFACE
//
// Owns the object currently being briefed.
//
// This context is intentionally independent of:
//
// - Workspace
// - Federation
// - Corpus
// - Investigation Graph
//
// Every subsystem requests a briefing by publishing an
// IntelligenceBrief into this context.
//
// ============================================================

import {

  createContext,

  useContext,

  useState,

  type ReactNode,

} from "react";

import type {

  IntelligenceBrief,

} from "../types/intelligenceBriefTypes";


// ============================================================
// CONTEXT CONTRACT
// ============================================================

interface IntelligenceBriefContextType {

  // ==========================================================
  // CURRENT BRIEF
  // ==========================================================

  brief:

    IntelligenceBrief | null;

  // ==========================================================
  // ACTIONS
  // ==========================================================

  setBrief: (

    brief: IntelligenceBrief

  ) => void;

  clearBrief: () => void;

}


// ============================================================
// CONTEXT
// ============================================================

const IntelligenceBriefContext =

  createContext<

    IntelligenceBriefContextType | undefined

  >(undefined);


// ============================================================
// PROVIDER
// ============================================================

export function IntelligenceBriefProvider({

  children,

}: {

  children: ReactNode;

}) {

  const [

    brief,

    setBriefState,

  ] = useState<

    IntelligenceBrief | null

  >(null);


  // ==========================================================
  // SET BRIEF
  // ==========================================================

  function setBrief(

    nextBrief: IntelligenceBrief

  ) {

    setBriefState(

      nextBrief

    );

  }


  // ==========================================================
  // CLEAR BRIEF
  // ==========================================================

  function clearBrief() {

    setBriefState(

      null

    );

  }


  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <IntelligenceBriefContext.Provider

      value={{

        brief,

        setBrief,

        clearBrief,

      }}

    >

      {children}

    </IntelligenceBriefContext.Provider>

  );

}


// ============================================================
// HOOK
// ============================================================

export function useIntelligenceBrief() {

  const context =

    useContext(

      IntelligenceBriefContext

    );

  if (!context) {

    throw new Error(

      "useIntelligenceBrief must be used within IntelligenceBriefProvider."

    );

  }

  return context;

}