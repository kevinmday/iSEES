// ============================================================
// WORKSPACE CONTEXT
// P23.2 WORKSPACE FOCUS FOUNDATION
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

  focusedEventId:
    string | null;

  setFocusedEventId: (
    eventId: string | null
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

  function setFocusedEventId(
    eventId: string | null
  ) {

    setActiveWorkspace(
      current => ({

        ...current,

        focused_event_id:
          eventId,
      })
    );
  }

  const addEventToWorkspace =
    (
      eventId: string
    ) => {

      setActiveWorkspace(
        current => {

          const alreadyExists =
            current.imported_events.some(
              reference =>
                reference.event_id ===
                eventId
            );

          if (alreadyExists) {
            return current;
          }

          return {

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

            focused_event_id:
              current.focused_event_id ??
              eventId,
          };
        }
      );
    };

  const removeEventFromWorkspace =
  (
    eventId: string
  ) => {

    setActiveWorkspace(
      current => {

        const remainingEvents =
          current.imported_events.filter(
            reference =>
              reference.event_id !==
              eventId
          );

        return {

          ...current,

          imported_events:
            remainingEvents,

          focused_event_id:
            current.focused_event_id ===
            eventId
              ? (
                  remainingEvents[0]
                    ?.event_id ?? null
                )
              : current.focused_event_id,
        };
      }
    );
  };

  return (

    <WorkspaceContext.Provider
      value={{
        activeWorkspace,

        setActiveWorkspace,

        focusedEventId:
          activeWorkspace.focused_event_id,

        setFocusedEventId,

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