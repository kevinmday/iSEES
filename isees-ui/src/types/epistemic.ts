// ============================================================
// epistemic.ts
// CANONICAL TEMPORAL ONTOLOGY CONTRACT
// ============================================================
//
// PURPOSE
// -------
// This file defines the immutable knowledge-time architecture
// contracts for the iSEES operator cognition system.
//
// CRITICAL PRINCIPLES
// -------------------
// 1. Frames contain cognition, NOT truth.
// 2. Frames NEVER mutate.
// 3. New knowledge creates new frames.
// 4. Replay represents historical cognition navigation.
// 5. Pipeline progression is separate from knowledge evolution.
//
// ============================================================

/**
 * ============================================================
 * TEMPORAL MODE
 * ============================================================
 *
 * Defines how the operator is viewing the event-space.
 *
 * LIVE
 *   Active evolving cognition-state.
 *
 * STATIC
 *   Frozen presentation view.
 *
 * REPLAY
 *   Historical cognition navigation.
 */

export type TemporalMode =
  | "LIVE"
  | "STATIC"
  | "REPLAY";

/**
 * ============================================================
 * COGNITION STATE
 * ============================================================
 *
 * Represents the epistemic interpretation generated at a
 * specific knowledge-time position.
 *
 * IMPORTANT:
 * This is NOT objective truth.
 */

export interface CognitionState {
  confidence: number;

  topology_state?: string;

  contradiction_density?: number;

  ambiguity_index?: number;

  residual_instability?: number;

  collapse_pressure?: number;
}

/**
 * ============================================================
 * INVESTIGATION STATE
 * ============================================================
 *
 * Represents actionable investigative cognition attached
 * to a frame.
 */

export interface InvestigationState {
  vectors: string[];

  narratives: string[];

  recommended_actions: string[];
}

/**
 * ============================================================
 * REINTERPRETATION LINKAGE
 * ============================================================
 *
 * Represents retrospective reinterpretation of prior
 * cognition states.
 */

export interface ReinterpretationLink {
  reason: string;

  prior_frame_ids: string[];
}

/**
 * ============================================================
 * EPISTEMIC FRAME
 * ============================================================
 *
 * The core immutable cognition object.
 *
 * IMPORTANT:
 * Frames NEVER mutate.
 *
 * New information ALWAYS creates a new frame.
 */

export interface EpistemicFrame {
  /**
   * Unique immutable frame identifier.
   */
  frame_id: string;

  /**
   * Parent event identifier.
   */
  event_id: string;

  /**
   * Frame creation timestamp.
   */
  created_at: string;

  /**
   * Optional parent frame lineage.
   */
  parent_frame_id?: string;

  /**
   * Optional investigation epoch association.
   */
  epoch_id?: string;

  /**
   * Immutable contract lock.
   *
   * MUST ALWAYS REMAIN TRUE.
   */
  immutable: true;

  /**
   * Cognition-state representation.
   */
  cognition: CognitionState;

  /**
   * Investigation-state representation.
   */
  investigation: InvestigationState;

  /**
   * Optional reinterpretation metadata.
   */
  reinterpretation?: ReinterpretationLink;
}

/**
 * ============================================================
 * TEMPORAL MUTATION TYPES
 * ============================================================
 *
 * Represents cognition-state transition categories.
 */

export type TemporalMutationType =
  | "INVESTIGATION_UPDATE"
  | "KOD_COLLAPSE"
  | "WITNESS_CORRELATION"
  | "RETROSPECTIVE_REINTERPRETATION"
  | "SENSOR_RECLASSIFICATION";

/**
 * ============================================================
 * TEMPORAL MUTATION
 * ============================================================
 *
 * Represents transition between cognition states.
 *
 * IMPORTANT:
 * Mutations connect immutable frames.
 */

export interface TemporalMutation {
  mutation_id: string;

  from_frame_id: string;

  to_frame_id: string;

  mutation_type: TemporalMutationType;

  timestamp: string;

  summary: string;
}

/**
 * ============================================================
 * INVESTIGATION EPOCH
 * ============================================================
 *
 * Represents macro-level investigation periods.
 *
 * Examples:
 * - Initial Witness Intake
 * - FAA Coordination
 * - Radar Correlation
 * - KOD Collapse Phase
 * - Retrospective Reanalysis
 */

export interface InvestigationEpoch {
  epoch_id: string;

  event_id: string;

  title: string;

  description?: string;

  start_frame_id: string;

  end_frame_id?: string;

  created_at: string;
}

/**
 * ============================================================
 * KNOWLEDGE TIMELINE
 * ============================================================
 *
 * Represents the complete epistemic evolution chain
 * for an event.
 */

export interface KnowledgeTimeline {
  event_id: string;

  frames: EpistemicFrame[];

  mutations: TemporalMutation[];

  epochs: InvestigationEpoch[];
}

/**
 * ============================================================
 * KNOWLEDGE POSITION
 * ============================================================
 *
 * Represents operator temporal navigation position.
 */

export interface KnowledgePosition {
  active_frame_id: string;

  active_epoch_id?: string;

  temporal_mode: TemporalMode;
}

/**
 * ============================================================
 * TEMPORAL AUTHORITY STATE
 * ============================================================
 *
 * Future-facing centralized temporal authority contract.
 *
 * This separates:
 *
 * event reality
 * from
 * knowledge-state reality.
 */

export interface TemporalAuthorityState {
  active_event_id?: string;

  active_frame?: EpistemicFrame;

  active_epoch?: InvestigationEpoch;

  knowledge_position?: KnowledgePosition;

  temporal_mode: TemporalMode;

  timeline?: KnowledgeTimeline;
}