// ============================================================
// WORKSPACE CONTEXT
// P23 FOUNDATION
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
  Workspace,
} from "../workspaceTypes";

import {
  DEFAULT_WORKSPACE,
} from "../defaultWorkspace";

// ============================================================
// CONTEXT TYPE
// ============================================================

type WorkspaceContextType = {

  activeWorkspace:
    Workspace;

  setActiveWorkspace: (
    workspace: Workspace
  ) => void;
};

// ============================================================
// CONTEXT
// ============================================================

const WorkspaceContext =
  createContext<
    WorkspaceContextType | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [
    activeWorkspace,
    setActiveWorkspace,
  ] =
    useState<Workspace>(
      DEFAULT_WORKSPACE
    );

  return (

    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useWorkspace() {

  const context =
    useContext(
      WorkspaceContext
    );

  if (!context) {

    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider"
    );
  }

  return context;
}