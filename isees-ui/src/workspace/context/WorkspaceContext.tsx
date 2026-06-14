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

  addEventToWorkspace: (
    eventId: string
  ) => void;

  removeEventFromWorkspace: (
    eventId: string
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

  const addEventToWorkspace =
    (
      eventId: string
    ) => {

      setActiveWorkspace(
        current => ({

          ...current,

          imported_events: [

            ...current.imported_events,

            {
              event_id:
                eventId,

              source:
                "SYSTEM_CANON",
            },
          ],
        })
      );
    };

  const removeEventFromWorkspace =
    (
      eventId: string
    ) => {

      setActiveWorkspace(
        current => ({

          ...current,

          imported_events:
            current.imported_events.filter(
              reference =>
                reference.event_id !==
                eventId
            ),
        })
      );
    };

  return (

    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        addEventToWorkspace,
        removeEventFromWorkspace,
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