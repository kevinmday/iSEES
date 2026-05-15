// ============================================================
// useKnowledgeTimeline.ts
// KNOWLEDGE TIMELINE AUTHORITY
// ============================================================
//
// PURPOSE
// -------
// Provides immutable cognition timeline utilities,
// mutation traversal, and epistemic lineage helpers.
//
// CRITICAL PRINCIPLES
// -------------------
// 1. Frames NEVER mutate.
// 2. Knowledge evolves through new frames.
// 3. Replay is cognition navigation.
// 4. Mutations connect immutable cognition states.
// 5. Timeline traversal must remain deterministic.
//
// ============================================================

import { useCallback, useMemo } from "react";

import type {
  EpistemicFrame,
  InvestigationEpoch,
  KnowledgeTimeline,
  TemporalMutation,
} from "../types/epistemic";

// ============================================================
// API
// ============================================================

export interface KnowledgeTimelineApi {
  timeline?: KnowledgeTimeline;

  // ----------------------------------------------------------
  // FRAME RESOLUTION
  // ----------------------------------------------------------

  getFrameById: (
    frameId: string
  ) => EpistemicFrame | undefined;

  getFramesForEpoch: (
    epochId: string
  ) => EpistemicFrame[];

  // ----------------------------------------------------------
  // MUTATION RESOLUTION
  // ----------------------------------------------------------

  getMutationById: (
    mutationId: string
  ) => TemporalMutation | undefined;

  getMutationsForFrame: (
    frameId: string
  ) => TemporalMutation[];

  getOutgoingMutations: (
    frameId: string
  ) => TemporalMutation[];

  getIncomingMutations: (
    frameId: string
  ) => TemporalMutation[];

  // ----------------------------------------------------------
  // LINEAGE
  // ----------------------------------------------------------

  getParentFrame: (
    frameId: string
  ) => EpistemicFrame | undefined;

  getChildFrames: (
    frameId: string
  ) => EpistemicFrame[];

  getLineageChain: (
    frameId: string
  ) => EpistemicFrame[];

  // ----------------------------------------------------------
  // EPOCH RESOLUTION
  // ----------------------------------------------------------

  getEpochById: (
    epochId: string
  ) => InvestigationEpoch | undefined;

  // ----------------------------------------------------------
  // TIMELINE NAVIGATION
  // ----------------------------------------------------------

  getFirstFrame: () =>
    | EpistemicFrame
    | undefined;

  getLastFrame: () =>
    | EpistemicFrame
    | undefined;

  getNextFrame: (
    frameId: string
  ) => EpistemicFrame | undefined;

  getPreviousFrame: (
    frameId: string
  ) => EpistemicFrame | undefined;

  // ----------------------------------------------------------
  // STATE FLAGS
  // ----------------------------------------------------------

  hasTimeline: boolean;

  frameCount: number;

  mutationCount: number;

  epochCount: number;
}

// ============================================================
// HOOK
// ============================================================

export function useKnowledgeTimeline(
  timeline?: KnowledgeTimeline
): KnowledgeTimelineApi {
  // ==========================================================
  // FRAME RESOLUTION
  // ==========================================================

  const getFrameById = useCallback(
    (
      frameId: string
    ): EpistemicFrame | undefined => {
      return timeline?.frames.find(
        (frame) =>
          frame.frame_id === frameId
      );
    },
    [timeline]
  );

  const getFramesForEpoch = useCallback(
    (
      epochId: string
    ): EpistemicFrame[] => {
      return (
        timeline?.frames.filter(
          (frame) =>
            frame.epoch_id === epochId
        ) ?? []
      );
    },
    [timeline]
  );

  // ==========================================================
  // MUTATION RESOLUTION
  // ==========================================================

  const getMutationById = useCallback(
    (
      mutationId: string
    ): TemporalMutation | undefined => {
      return timeline?.mutations.find(
        (mutation) =>
          mutation.mutation_id ===
          mutationId
      );
    },
    [timeline]
  );

  const getMutationsForFrame = useCallback(
    (
      frameId: string
    ): TemporalMutation[] => {
      return (
        timeline?.mutations.filter(
          (mutation) =>
            mutation.from_frame_id ===
              frameId ||
            mutation.to_frame_id ===
              frameId
        ) ?? []
      );
    },
    [timeline]
  );

  const getOutgoingMutations =
    useCallback(
      (
        frameId: string
      ): TemporalMutation[] => {
        return (
          timeline?.mutations.filter(
            (mutation) =>
              mutation.from_frame_id ===
              frameId
          ) ?? []
        );
      },
      [timeline]
    );

  const getIncomingMutations =
    useCallback(
      (
        frameId: string
      ): TemporalMutation[] => {
        return (
          timeline?.mutations.filter(
            (mutation) =>
              mutation.to_frame_id ===
              frameId
          ) ?? []
        );
      },
      [timeline]
    );

  // ==========================================================
  // LINEAGE
  // ==========================================================

  const getParentFrame = useCallback(
    (
      frameId: string
    ): EpistemicFrame | undefined => {
      const frame =
        getFrameById(frameId);

      if (!frame?.parent_frame_id) {
        return undefined;
      }

      return getFrameById(
        frame.parent_frame_id
      );
    },
    [getFrameById]
  );

  const getChildFrames = useCallback(
    (
      frameId: string
    ): EpistemicFrame[] => {
      return (
        timeline?.frames.filter(
          (frame) =>
            frame.parent_frame_id ===
            frameId
        ) ?? []
      );
    },
    [timeline]
  );

  const getLineageChain = useCallback(
    (
      frameId: string
    ): EpistemicFrame[] => {
      const lineage: EpistemicFrame[] = [];

      let currentFrame =
        getFrameById(frameId);

      while (currentFrame) {
        lineage.unshift(currentFrame);

        if (
          !currentFrame.parent_frame_id
        ) {
          break;
        }

        currentFrame = getFrameById(
          currentFrame.parent_frame_id
        );
      }

      return lineage;
    },
    [getFrameById]
  );

  // ==========================================================
  // EPOCH RESOLUTION
  // ==========================================================

  const getEpochById = useCallback(
    (
      epochId: string
    ): InvestigationEpoch | undefined => {
      return timeline?.epochs.find(
        (epoch) =>
          epoch.epoch_id === epochId
      );
    },
    [timeline]
  );

  // ==========================================================
  // TIMELINE NAVIGATION
  // ==========================================================

  const getFirstFrame = useCallback(() => {
    return timeline?.frames[0];
  }, [timeline]);

  const getLastFrame = useCallback(() => {
    if (!timeline?.frames.length) {
      return undefined;
    }

    return timeline.frames[
      timeline.frames.length - 1
    ];
  }, [timeline]);

  const getNextFrame = useCallback(
    (
      frameId: string
    ): EpistemicFrame | undefined => {
      if (!timeline) {
        return undefined;
      }

      const currentIndex =
        timeline.frames.findIndex(
          (frame) =>
            frame.frame_id === frameId
        );

      if (currentIndex === -1) {
        return undefined;
      }

      return timeline.frames[
        currentIndex + 1
      ];
    },
    [timeline]
  );

  const getPreviousFrame =
    useCallback(
      (
        frameId: string
      ): EpistemicFrame | undefined => {
        if (!timeline) {
          return undefined;
        }

        const currentIndex =
          timeline.frames.findIndex(
            (frame) =>
              frame.frame_id ===
              frameId
          );

        if (currentIndex <= 0) {
          return undefined;
        }

        return timeline.frames[
          currentIndex - 1
        ];
      },
      [timeline]
    );

  // ==========================================================
  // STATE FLAGS
  // ==========================================================

  const hasTimeline = useMemo(() => {
    return Boolean(timeline);
  }, [timeline]);

  const frameCount = useMemo(() => {
    return timeline?.frames.length ?? 0;
  }, [timeline]);

  const mutationCount = useMemo(() => {
    return (
      timeline?.mutations.length ?? 0
    );
  }, [timeline]);

  const epochCount = useMemo(() => {
    return timeline?.epochs.length ?? 0;
  }, [timeline]);

  // ==========================================================
  // API
  // ==========================================================

  return {
    timeline,

    getFrameById,

    getFramesForEpoch,

    getMutationById,

    getMutationsForFrame,

    getOutgoingMutations,

    getIncomingMutations,

    getParentFrame,

    getChildFrames,

    getLineageChain,

    getEpochById,

    getFirstFrame,

    getLastFrame,

    getNextFrame,

    getPreviousFrame,

    hasTimeline,

    frameCount,

    mutationCount,

    epochCount,
  };
}