// ============================================================
// WORKSPACE CONTEXT
// P25.6B UNIFIED INVESTIGATION IMPORT CONTRACT
// SINGLE WORKSPACE INVESTIGATION ENTRY POINT
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

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Artifact,
} from "../../artifacts/artifactTypes";

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

  // ==========================================================
  // P25.6B
  // Unified Investigation Import Contract
  // ==========================================================

  importInvestigation: (
    eventId: string
  ) => void;

  addEventToWorkspace: (
    eventId: string
  ) => void;

  removeEventFromWorkspace: (
    eventId: string
  ) => void;

  addArtifact: (
    artifact: Artifact
  ) => void;

  removeArtifact: (
    artifactId: string
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

  // ==========================================================
  // FOCUS
  // ==========================================================

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

  // ==========================================================
  // IMPORT EVENT
  // ==========================================================

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

  // ==========================================================
  // P25.6B
  // UNIFIED INVESTIGATION IMPORT
  // SINGLE ENTRY POINT
  // ==========================================================

  const importInvestigation =
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

          return {

            ...current,

            imported_events:
              alreadyExists
                ? current.imported_events
                : [

                    ...current.imported_events,

                    {
                      event_id:
                        eventId,

                      source:
                        "SYSTEM_CANON",
                    },
                  ],

            // Always focus the imported
            // investigation.

            focused_event_id:
              eventId,
          };
        }
      );
    };

  // ==========================================================
  // REMOVE EVENT
  // ==========================================================

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

  // ==========================================================
  // ARTIFACTS
  // ==========================================================

  const addArtifact =
    (
      artifact: Artifact
    ) => {

      setActiveWorkspace(
        current => ({

          ...current,

          artifacts: [

            ...current.artifacts,

            artifact,
          ],
        })
      );
    };

  const removeArtifact =
    (
      artifactId: string
    ) => {

      setActiveWorkspace(
        current => ({

          ...current,

          artifacts:
            current.artifacts.filter(
              artifact =>
                artifact.id !==
                artifactId
            ),
        })
      );
    };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (

    <WorkspaceContext.Provider
      value={{

        activeWorkspace,

        setActiveWorkspace,

        focusedEventId:
          activeWorkspace.focused_event_id,

        setFocusedEventId,

        importInvestigation,

        addEventToWorkspace,

        removeEventFromWorkspace,

        addArtifact,

        removeArtifact,
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