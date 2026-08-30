// ============================================================
// src/federation/context/FederationContext.tsx
// P26 FEDERATED KNOWLEDGE LAYER
// GLOBAL FEDERATION STATE
//
// Owns repository selection, expansion state, event preview,
// search state, and repository loading.
//
// The UI should consume this context instead of directly
// manipulating corpus state.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  loadFederation,
  type FederatedRepository,
} from "../services/loadFederation";

import type {
  FederationPreview,
} from "../adapters/FederationAdapter";

import {
  importInvestigationIntoWorkspace,
} from "../services/importInvestigation";

import {
  useWorkspaceRuntime,
} from "../../workspace/runtime/WorkspaceRuntimeContext";

// ============================================================
// REPOSITORY STATE
// ============================================================

export type FederationRepositoryState =
  FederatedRepository;

// ============================================================
// CONTEXT CONTRACT
// ============================================================

interface FederationContextValue {

  repositories:
    FederationRepositoryState[];

  loading:
    boolean;

  selectedRepositoryId:
    string | null;

  selectedEventId:
    string | null;

  expandedRepositoryIds:
    Set<string>;

  preview:
    FederationPreview | null;

  searchText:
    string;

  setSearchText:
    (
      value: string
    ) => void;

  selectRepository:
    (
      repositoryId: string
    ) => void;

  toggleRepository:
    (
      repositoryId: string
    ) => void;

  selectEvent:
    (
      repositoryId: string,
      eventId: string
    ) => Promise<void>;

  importEvent:
    (
      repositoryId: string,
      eventId: string
    ) => Promise<void>;

  refresh:
    () => Promise<void>;

}

// ============================================================
// CONTEXT
// ============================================================

const FederationContext =
  createContext<
    FederationContextValue | null
  >(null);

// ============================================================
// PROVIDER
// ============================================================

export function FederationProvider({

  children,

}: {

  children: ReactNode;

}) {

  const workspaceRuntime =
    useWorkspaceRuntime();

  const [repositories,
    setRepositories] =
    useState<
      FederationRepositoryState[]
    >([]);

  const [loading,
    setLoading] =
    useState(true);

  const [selectedRepositoryId,
    setSelectedRepositoryId] =
    useState<string | null>(
      null
    );

  const [selectedEventId,
    setSelectedEventId] =
    useState<string | null>(
      null
    );

  const [expandedRepositoryIds,
    setExpandedRepositoryIds] =
    useState<
      Set<string>
    >(
      () => new Set()
    );

  const [preview,
    setPreview] =
    useState<
      FederationPreview | null
    >(null);

  const [searchText,
    setSearchText] =
    useState("");

// ==========================================================
// LOAD REPOSITORIES
// ==========================================================

async function refresh() {

  setLoading(true);

  try {

    const loaded =
      await loadFederation();

    setRepositories(
      loaded
    );

    if (

      loaded.length > 0 &&

      !selectedRepositoryId

    ) {

      setSelectedRepositoryId(

        loaded[0]
          .repository
          .id

      );

    }

  }
  finally {

    setLoading(
      false
    );

  }

}

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    void refresh();

  }, []);

  // ==========================================================
  // REPOSITORY SELECTION
  // ==========================================================

  function selectRepository(

    repositoryId: string

  ) {

    setSelectedRepositoryId(
      repositoryId
    );

  }

  // ==========================================================
  // TREE EXPANSION
  // ==========================================================

  function toggleRepository(

    repositoryId: string

  ) {

    setExpandedRepositoryIds(

      previous => {

        const next =
          new Set(previous);

        if (
          next.has(
            repositoryId
          )
        ) {

          next.delete(
            repositoryId
          );

        }
        else {

          next.add(
            repositoryId
          );

        }

        return next;

      }

    );

  }

  // ==========================================================
  // EVENT PREVIEW
  // ==========================================================

  async function selectEvent(

    repositoryId: string,

    eventId: string

  ) {

    setSelectedRepositoryId(
      repositoryId
    );

    setSelectedEventId(
      eventId
    );

    const repository =
      repositories.find(

        candidate =>

          candidate
            .repository
            .id ===
          repositoryId

      );

    if (
      !repository
    ) {

      return;

    }

    const result =
      await repository
        .adapter
        .preview(
          eventId
        );

    setPreview(
      result
    );

  }

  // ==========================================================
  // IMPORT
  // ==========================================================

  async function importEvent(

    repositoryId: string,

    eventId: string

  ) {

    const repository =
      repositories.find(

        candidate =>

          candidate
            .repository
            .id ===
          repositoryId

      );

    if (
      !repository
    ) {

      return;

    }

    await importInvestigationIntoWorkspace(
      repository.adapter,
      eventId,
      workspaceRuntime,
    );

  }

  // ==========================================================
  // VALUE
  // ==========================================================

  const value =
    useMemo<
      FederationContextValue
    >(

      () => ({

        repositories,

        loading,

        selectedRepositoryId,

        selectedEventId,

        expandedRepositoryIds,

        preview,

        searchText,

        setSearchText,

        selectRepository,

        toggleRepository,

        selectEvent,

        importEvent,

        refresh,

      }),

      [

        repositories,

        loading,

        selectedRepositoryId,

        selectedEventId,

        expandedRepositoryIds,

        preview,

        searchText,

      ]

    );

  return (

    <FederationContext.Provider
      value={value}
    >

      {children}

    </FederationContext.Provider>

  );

}

// ============================================================
// HOOK
// ============================================================

export function useFederation() {

  const context =
    useContext(
      FederationContext
    );

  if (
    !context
  ) {

    throw new Error(

      "useFederation must be used inside FederationProvider."

    );

  }

  return context;

}
