// ============================================================
// useTemporalAuthority.ts
// TEMPORAL AUTHORITY LAYER
// ============================================================
//
// PURPOSE
// -------
// Centralized authority layer for immutable cognition-time
// navigation within iSEES.
//
// CRITICAL PRINCIPLES
// -------------------
// 1. Frames NEVER mutate.
// 2. Replay is historical cognition navigation.
// 3. Event reality is separate from knowledge-state reality.
// 4. Temporal authority manages navigation state,
//    NOT ontology mutation.
// 5. External providers are NEVER ontology authority.
//
// ============================================================

import { useCallback, useMemo, useState } from "react";

import type {
  EpistemicFrame,
  InvestigationEpoch,
  KnowledgePosition,
  KnowledgeTimeline,
  TemporalAuthorityState,
  TemporalMode,
} from "../types/epistemic";

// ============================================================
// TEMPORAL AUTHORITY API
// ============================================================

export interface TemporalAuthorityApi {
  state: TemporalAuthorityState;

  // ----------------------------------------------------------
  // MODE CONTROL
  // ----------------------------------------------------------

  setTemporalMode: (mode: TemporalMode) => void;

  // ----------------------------------------------------------
  // TIMELINE CONTROL
  // ----------------------------------------------------------

  setTimeline: (timeline: KnowledgeTimeline) => void;

  clearTimeline: () => void;

  // ----------------------------------------------------------
  // FRAME NAVIGATION
  // ----------------------------------------------------------

  setActiveFrame: (frameId: string) => void;

  advanceToNextFrame: () => void;

  returnToPreviousFrame: () => void;

  // ----------------------------------------------------------
  // EPOCH NAVIGATION
  // ----------------------------------------------------------

  setActiveEpoch: (epochId: string) => void;

  // ----------------------------------------------------------
  // POSITION CONTROL
  // ----------------------------------------------------------

  setKnowledgePosition: (
    position: Partial<KnowledgePosition>
  ) => void;

  // ----------------------------------------------------------
  // RESOLUTION HELPERS
  // ----------------------------------------------------------

  getFrameById: (
    frameId: string
  ) => EpistemicFrame | undefined;

  getEpochById: (
    epochId: string
  ) => InvestigationEpoch | undefined;

  // ----------------------------------------------------------
  // STATE FLAGS
  // ----------------------------------------------------------

  hasTimeline: boolean;

  frameCount: number;

  epochCount: number;
}

// ============================================================
// INITIAL STATE
// ============================================================

const INITIAL_STATE: TemporalAuthorityState = {
  temporal_mode: "LIVE",

  active_event_id: undefined,

  active_frame: undefined,

  active_epoch: undefined,

  knowledge_position: undefined,

  timeline: undefined,
};

// ============================================================
// HOOK
// ============================================================

export function useTemporalAuthority(): TemporalAuthorityApi {
  const [state, setState] =
    useState<TemporalAuthorityState>(INITIAL_STATE);

  // ==========================================================
  // RESOLUTION HELPERS
  // ==========================================================

  const getFrameById = useCallback(
    (
      frameId: string
    ): EpistemicFrame | undefined => {
      return state.timeline?.frames.find(
        (frame) => frame.frame_id === frameId
      );
    },
    [state.timeline]
  );

  const getEpochById = useCallback(
    (
      epochId: string
    ): InvestigationEpoch | undefined => {
      return state.timeline?.epochs.find(
        (epoch) => epoch.epoch_id === epochId
      );
    },
    [state.timeline]
  );

  // ==========================================================
  // MODE CONTROL
  // ==========================================================

  const setTemporalMode = useCallback(
    (mode: TemporalMode) => {
      setState((previous) => ({
        ...previous,
        temporal_mode: mode,
      }));
    },
    []
  );

  // ==========================================================
  // TIMELINE CONTROL
  // ==========================================================

  const setTimeline = useCallback(
    (timeline: KnowledgeTimeline) => {
      const initialFrame = timeline.frames[0];

      const initialEpoch = timeline.epochs[0];

      setState((previous) => ({
        ...previous,

        timeline,

        active_event_id: timeline.event_id,

        active_frame: initialFrame,

        active_epoch: initialEpoch,

        knowledge_position: initialFrame
          ? {
              active_frame_id:
                initialFrame.frame_id,

              active_epoch_id:
                initialEpoch?.epoch_id,

              temporal_mode:
                previous.temporal_mode,
            }
          : undefined,
      }));
    },
    []
  );

  const clearTimeline = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ==========================================================
  // FRAME NAVIGATION
  // ==========================================================

  const setActiveFrame = useCallback(
    (frameId: string) => {
      setState((previous) => {
        const frame =
          previous.timeline?.frames.find(
            (candidate) =>
              candidate.frame_id === frameId
          );

        if (!frame) {
          return previous;
        }

        return {
          ...previous,

          active_frame: frame,

          knowledge_position: {
            active_frame_id: frame.frame_id,

            active_epoch_id: frame.epoch_id,

            temporal_mode:
              previous.temporal_mode,
          },
        };
      });
    },
    []
  );

  const advanceToNextFrame = useCallback(() => {
    setState((previous) => {
      const timeline = previous.timeline;

      const activeFrame =
        previous.active_frame;

      if (!timeline || !activeFrame) {
        return previous;
      }

      const currentIndex =
        timeline.frames.findIndex(
          (frame) =>
            frame.frame_id ===
            activeFrame.frame_id
        );

      const nextFrame =
        timeline.frames[currentIndex + 1];

      if (!nextFrame) {
        return previous;
      }

      return {
        ...previous,

        active_frame: nextFrame,

        knowledge_position: {
          active_frame_id:
            nextFrame.frame_id,

          active_epoch_id:
            nextFrame.epoch_id,

          temporal_mode:
            previous.temporal_mode,
        },
      };
    });
  }, []);

  const returnToPreviousFrame = useCallback(() => {
    setState((previous) => {
      const timeline = previous.timeline;

      const activeFrame =
        previous.active_frame;

      if (!timeline || !activeFrame) {
        return previous;
      }

      const currentIndex =
        timeline.frames.findIndex(
          (frame) =>
            frame.frame_id ===
            activeFrame.frame_id
        );

      const previousFrame =
        timeline.frames[currentIndex - 1];

      if (!previousFrame) {
        return previous;
      }

      return {
        ...previous,

        active_frame: previousFrame,

        knowledge_position: {
          active_frame_id:
            previousFrame.frame_id,

          active_epoch_id:
            previousFrame.epoch_id,

          temporal_mode:
            previous.temporal_mode,
        },
      };
    });
  }, []);

  // ==========================================================
  // EPOCH NAVIGATION
  // ==========================================================

  const setActiveEpoch = useCallback(
    (epochId: string) => {
      setState((previous) => {
        const epoch =
          previous.timeline?.epochs.find(
            (candidate) =>
              candidate.epoch_id === epochId
          );

        if (!epoch) {
          return previous;
        }

        return {
          ...previous,

          active_epoch: epoch,

          knowledge_position: {
            active_frame_id:
              previous.active_frame?.frame_id ??
              "",

            active_epoch_id: epoch.epoch_id,

            temporal_mode:
              previous.temporal_mode,
          },
        };
      });
    },
    []
  );

  // ==========================================================
  // POSITION CONTROL
  // ==========================================================

  const setKnowledgePosition = useCallback(
    (
      position: Partial<KnowledgePosition>
    ) => {
      setState((previous) => ({
        ...previous,

        knowledge_position: {
          active_frame_id:
            position.active_frame_id ??
            previous.knowledge_position
              ?.active_frame_id ??
            "",

          active_epoch_id:
            position.active_epoch_id ??
            previous.knowledge_position
              ?.active_epoch_id,

          temporal_mode:
            position.temporal_mode ??
            previous.temporal_mode,
        },
      }));
    },
    []
  );

  // ==========================================================
  // STATE FLAGS
  // ==========================================================

  const hasTimeline = useMemo(() => {
    return Boolean(state.timeline);
  }, [state.timeline]);

  const frameCount = useMemo(() => {
    return state.timeline?.frames.length ?? 0;
  }, [state.timeline]);

  const epochCount = useMemo(() => {
    return state.timeline?.epochs.length ?? 0;
  }, [state.timeline]);

  // ==========================================================
  // API
  // ==========================================================

  return {
    state,

    setTemporalMode,

    setTimeline,

    clearTimeline,

    setActiveFrame,

    advanceToNextFrame,

    returnToPreviousFrame,

    setActiveEpoch,

    setKnowledgePosition,

    getFrameById,

    getEpochById,

    hasTimeline,

    frameCount,

    epochCount,
  };
}