// ============================================================
// useEvidenceAuthority.ts
// EVIDENCE AUTHORITY LAYER
// ============================================================
//
// PURPOSE
// -------
// Centralized authority layer for evidence reservoir
// navigation and provider-state management.
//
// CRITICAL PRINCIPLES
// -------------------
// 1. Evidence is NOT ontology authority.
// 2. Evidence reservoirs remain subordinate to immutable
//    epistemic frames.
// 3. NotebookLM is OPTIONAL.
// 4. External providers are NEVER required for operation.
// 5. Replay must remain deterministic even if all external
//    providers disappear.
// 6. Evidence evolution is separate from cognition lineage.
//
// ============================================================

import { useCallback, useMemo, useState } from "react";

import type {
  EvidenceArtifact,
  EvidenceAuthorityState,
  EvidenceProviderStatus,
  EvidenceProviderType,
  EvidenceReservoir,
  NotebookContext,
} from "../types/evidence";

// ============================================================
// EVIDENCE AUTHORITY API
// ============================================================

export interface EvidenceAuthorityApi {
  state: EvidenceAuthorityState;

  // ----------------------------------------------------------
  // RESERVOIR CONTROL
  // ----------------------------------------------------------

  setReservoir: (
    reservoir: EvidenceReservoir
  ) => void;

  clearReservoir: () => void;

  // ----------------------------------------------------------
  // NOTEBOOK CONTROL
  // ----------------------------------------------------------

  setActiveNotebook: (
    notebookId: string
  ) => void;

  // ----------------------------------------------------------
  // ARTIFACT CONTROL
  // ----------------------------------------------------------

  setActiveArtifact: (
    artifactId: string
  ) => void;

  // ----------------------------------------------------------
  // PROVIDER STATUS
  // ----------------------------------------------------------

  updateProviderStatus: (
    status: EvidenceProviderStatus
  ) => void;

  isProviderAvailable: (
    provider: EvidenceProviderType
  ) => boolean;

  // ----------------------------------------------------------
  // RESOLUTION HELPERS
  // ----------------------------------------------------------

  getNotebookById: (
    notebookId: string
  ) => NotebookContext | undefined;

  getArtifactById: (
    artifactId: string
  ) => EvidenceArtifact | undefined;

  getArtifactsForFrame: (
    frameId: string
  ) => EvidenceArtifact[];

  getArtifactsForEpoch: (
    epochId: string
  ) => EvidenceArtifact[];

  // ----------------------------------------------------------
  // STATE FLAGS
  // ----------------------------------------------------------

  hasReservoir: boolean;

  artifactCount: number;

  notebookCount: number;
}

// ============================================================
// INITIAL STATE
// ============================================================

const INITIAL_STATE: EvidenceAuthorityState = {
  active_reservoir: undefined,

  active_notebook: undefined,

  active_artifact: undefined,

  provider_statuses: [],

  external_providers_optional: true,
};

// ============================================================
// HOOK
// ============================================================

export function useEvidenceAuthority(): EvidenceAuthorityApi {
  const [state, setState] =
    useState<EvidenceAuthorityState>(
      INITIAL_STATE
    );

  // ==========================================================
  // RESOLUTION HELPERS
  // ==========================================================

  const getNotebookById = useCallback(
    (
      notebookId: string
    ): NotebookContext | undefined => {
      return state.active_reservoir?.notebooks.find(
        (notebook) =>
          notebook.notebook_id === notebookId
      );
    },
    [state.active_reservoir]
  );

  const getArtifactById = useCallback(
    (
      artifactId: string
    ): EvidenceArtifact | undefined => {
      return state.active_reservoir?.artifacts.find(
        (artifact) =>
          artifact.artifact_id === artifactId
      );
    },
    [state.active_reservoir]
  );

  // ==========================================================
  // RESERVOIR CONTROL
  // ==========================================================

  const setReservoir = useCallback(
    (reservoir: EvidenceReservoir) => {
      setState((previous) => ({
        ...previous,

        active_reservoir: reservoir,

        active_notebook:
          reservoir.notebooks[0],

        active_artifact:
          reservoir.artifacts[0],
      }));
    },
    []
  );

  const clearReservoir = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ==========================================================
  // NOTEBOOK CONTROL
  // ==========================================================

  const setActiveNotebook = useCallback(
    (notebookId: string) => {
      setState((previous) => {
        const notebook =
          previous.active_reservoir?.notebooks.find(
            (candidate) =>
              candidate.notebook_id ===
              notebookId
          );

        if (!notebook) {
          return previous;
        }

        return {
          ...previous,

          active_notebook: notebook,
        };
      });
    },
    []
  );

  // ==========================================================
  // ARTIFACT CONTROL
  // ==========================================================

  const setActiveArtifact = useCallback(
    (artifactId: string) => {
      setState((previous) => {
        const artifact =
          previous.active_reservoir?.artifacts.find(
            (candidate) =>
              candidate.artifact_id ===
              artifactId
          );

        if (!artifact) {
          return previous;
        }

        return {
          ...previous,

          active_artifact: artifact,
        };
      });
    },
    []
  );

  // ==========================================================
  // PROVIDER STATUS
  // ==========================================================

  const updateProviderStatus = useCallback(
    (status: EvidenceProviderStatus) => {
      setState((previous) => {
        const existingStatuses =
          previous.provider_statuses ?? [];

        const filteredStatuses =
          existingStatuses.filter(
            (candidate) =>
              candidate.provider_type !==
              status.provider_type
          );

        return {
          ...previous,

          provider_statuses: [
            ...filteredStatuses,
            status,
          ],
        };
      });
    },
    []
  );

  const isProviderAvailable = useCallback(
    (
      provider: EvidenceProviderType
    ): boolean => {
      const providerStatus =
        state.provider_statuses?.find(
          (status) =>
            status.provider_type === provider
        );

      return providerStatus?.available ?? false;
    },
    [state.provider_statuses]
  );

  // ==========================================================
  // FRAME ARTIFACT RESOLUTION
  // ==========================================================

  const getArtifactsForFrame = useCallback(
    (frameId: string): EvidenceArtifact[] => {
      const reservoir =
        state.active_reservoir;

      if (!reservoir) {
        return [];
      }

      const frameReference =
        reservoir.frame_references.find(
          (reference) =>
            reference.frame_id === frameId
        );

      if (!frameReference) {
        return [];
      }

      return reservoir.artifacts.filter(
        (artifact) =>
          frameReference.artifact_ids.includes(
            artifact.artifact_id
          )
      );
    },
    [state.active_reservoir]
  );

  // ==========================================================
  // EPOCH ARTIFACT RESOLUTION
  // ==========================================================

  const getArtifactsForEpoch = useCallback(
    (epochId: string): EvidenceArtifact[] => {
      const reservoir =
        state.active_reservoir;

      if (!reservoir) {
        return [];
      }

      const epochReference =
        reservoir.epoch_references.find(
          (reference) =>
            reference.epoch_id === epochId
        );

      if (!epochReference) {
        return [];
      }

      return reservoir.artifacts.filter(
        (artifact) =>
          epochReference.artifact_ids.includes(
            artifact.artifact_id
          )
      );
    },
    [state.active_reservoir]
  );

  // ==========================================================
  // STATE FLAGS
  // ==========================================================

  const hasReservoir = useMemo(() => {
    return Boolean(state.active_reservoir);
  }, [state.active_reservoir]);

  const artifactCount = useMemo(() => {
    return (
      state.active_reservoir?.artifacts
        .length ?? 0
    );
  }, [state.active_reservoir]);

  const notebookCount = useMemo(() => {
    return (
      state.active_reservoir?.notebooks
        .length ?? 0
    );
  }, [state.active_reservoir]);

  // ==========================================================
  // API
  // ==========================================================

  return {
    state,

    setReservoir,

    clearReservoir,

    setActiveNotebook,

    setActiveArtifact,

    updateProviderStatus,

    isProviderAvailable,

    getNotebookById,

    getArtifactById,

    getArtifactsForFrame,

    getArtifactsForEpoch,

    hasReservoir,

    artifactCount,

    notebookCount,
  };
}