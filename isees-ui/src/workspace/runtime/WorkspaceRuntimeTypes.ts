// ============================================================
// src/workspace/runtime/WorkspaceRuntimeTypes.ts
// P56
// RUNTIME-OWNED INVESTIGATION TYPES
//
// Canonical contracts for the deterministic Workspace Runtime.
//
// The Workspace Runtime owns:
//
// • Active Investigation Session
// • Active Operator State
// • Active Computational Configuration
//
// The Workspace Runtime performs no mathematical computation.
//
// Computational execution remains owned by:
//
// • Resolve–Dissolve Computation (RDC)
// • ResolveRuntime
// • ResolveEngine
//
// The computational configuration establishes the runtime
// ownership boundary for:
//
//     C = (L, T, S)
//
// where:
//
//     L = active computational layers
//     T = temporal computational context
//     S = investigative scale
//
// T and S remain intentionally opaque until their canonical
// mathematical representations are formally introduced.
//
// Ownership:
//
// Operator
//      ↓
// Workspace Runtime
//      ├── Active Workspace
//      ├── Active Investigation
//      ├── Focused Event
//      ├── Operator State
//      │       ├── Active Workspace Mode
//      │       ├── Active Layout Mode
//      │       └── Active Selection
//      │
//      └── Computational Configuration
//              ├── L — Active Layers
//              ├── T — Temporal Context
//              └── S — Investigative Scale
//
// ============================================================

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  Artifact,
} from "../../artifacts/artifactTypes";

import type {
  Investigation,
} from "../../investigation/investigationTypes";

// ============================================================
// STATUS
// ============================================================

export type WorkspaceRuntimeStatus =
  | "INITIALIZING"
  | "READY"
  | "ACTIVE";

// ============================================================
// WORKSPACE MODES
// ============================================================

export const WorkspaceMode = {

  OVERVIEW:
    "OVERVIEW",

  MANIFOLD:
    "MANIFOLD",

  COMPARE:
    "COMPARE",

  NARRATIVE:
    "NARRATIVE",

  EVIDENCE:
    "EVIDENCE",

  TIMELINE:
    "TIMELINE",

  LAYERS:
    "LAYERS",

  INTENTION:
    "INTENTION",

  RESEARCH:
    "RESEARCH",

} as const;

export type WorkspaceMode =
  typeof WorkspaceMode[
    keyof typeof WorkspaceMode
  ];

/**
 * Canonical operator-facing eligibility for a Workspace Mode.
 *
 * WorkspaceRuntime owns this decision. Presentation surfaces
 * consume it but must not independently reproduce its rules.
 */
export interface WorkspaceModeAvailability {

  available:
    boolean;

  reason?:
    string;

}

// ============================================================
// WORKSPACE LAYOUT MODES
// ============================================================

/**
 * Canonical workspace presentation state.
 *
 * NORMAL
 *
 * Standard operational workspace.
 *
 * FOCUS
 *
 * Workspace expands while surrounding
 * operator chrome is temporarily hidden.
 *
 * Layout ownership belongs to the Workspace Runtime
 * because it represents operator state rather than
 * investigation state.
 */
export const WorkspaceLayoutMode = {

  NORMAL:
    "NORMAL",

  FOCUS:
    "FOCUS",

} as const;

export type WorkspaceLayoutMode =
  typeof WorkspaceLayoutMode[
    keyof typeof WorkspaceLayoutMode
  ];

// ============================================================
// OPERATOR SELECTION
// ============================================================
//
// P56D-G
// CANONICAL WORKSPACE OPERATOR SELECTION
//
// Workspace Runtime owns operator-facing selection.
//
// GraphContext owns graph-local camera and centering state.
// WorkspaceSelection is the sole canonical operator-selection
// vocabulary and Workspace Runtime is its sole owner.
//
// CRITICAL EPISTEMIC DISTINCTION
//
//   EDGE
//     = an established Investigation Graph relationship
//
//   CANDIDATE
//     = a deterministic Resolve candidate representing a
//       potential relationship available for inspection
//
// Therefore:
//
//                 CANDIDATE != EDGE
//
// Selecting a candidate does NOT:
//
//   • establish a relationship
//   • create a GraphEdge
//   • mutate topology
//   • promote Knowledge
//   • generate a Research Vector
//   • execute REX
//
// ============================================================

export const WorkspaceSelectionKind = {

  NONE:
    "NONE",

  NODE:
    "NODE",

  EDGE:
    "EDGE",

  CANDIDATE:
    "CANDIDATE",

} as const;

export type WorkspaceSelectionKind =
  typeof WorkspaceSelectionKind[
    keyof typeof WorkspaceSelectionKind
  ];

// ============================================================
// NONE
// ============================================================

export interface WorkspaceNoneSelection {

  kind:
    typeof WorkspaceSelectionKind.NONE;

}

// ============================================================
// NODE
// ============================================================

export interface WorkspaceNodeSelection {

  kind:
    typeof WorkspaceSelectionKind.NODE;

  nodeId:
    string;

}

// ============================================================
// EDGE
// ============================================================

export interface WorkspaceEdgeSelection {

  kind:
    typeof WorkspaceSelectionKind.EDGE;

  edgeId:
    string;

}

// ============================================================
// RESOLVE CANDIDATE
// ============================================================
//
// Candidate identity carries sufficient deterministic lineage
// for downstream inspection to resolve Candidate Intelligence:
//
//                 E -> Ic
//
// Candidate selection identifies which Ic the operator wants
// to inspect.
//
// It does not transform that candidate into established graph
// topology.
//
// ============================================================

export interface WorkspaceCandidateSelection {

  kind:
    typeof WorkspaceSelectionKind.CANDIDATE;

  candidateId:
    string;

  evaluationId:
    string;

  leftKnowledgeObjectId:
    string;

  rightKnowledgeObjectId:
    string;

}

// ============================================================
// CANONICAL OPERATOR SELECTION UNION
// ============================================================

export type WorkspaceSelection =

  | WorkspaceNoneSelection
  | WorkspaceNodeSelection
  | WorkspaceEdgeSelection
  | WorkspaceCandidateSelection;
// ============================================================
// INVESTIGATION SESSION
// ============================================================

export interface WorkspaceRuntimeSession {

  /**
   * Active workspace container.
   */
  workspace?:
    Workspace;

  /**
   * Active canonical Investigation owned by the runtime.
   *
   * WorkspaceRuntime is the runtime ownership boundary for
   * the Investigation consumed by deterministic computation.
   */
  investigation?:
    Investigation;

  /**
   * Currently focused event.
   *
   * This remains intentionally opaque until focused-event
   * ownership is migrated onto its canonical contract.
   */
  focusedEvent?:
    unknown;

  /**
   * Imported artifacts.
   */
  artifacts:
    Artifact[];

}

// ============================================================
// OPERATOR STATE
// ============================================================

export interface WorkspaceOperatorState {

  /**
   * Current active workspace mode.
   *
   * Determines which workspace surface is currently
   * presented to the operator.
   */
  activeMode:
    WorkspaceMode;

  /**
   * Current workspace layout mode.
   *
   * Layout is owned by the operator rather than the
   * investigation. This allows the operator to switch
   * between the standard operational layout and a
   * focused authoring/analysis layout without affecting
   * investigation state.
   */
  layoutMode:
    WorkspaceLayoutMode;

  /**
   * Runtime-owned operator selection.
   */
  selection?:
    WorkspaceSelection;

}

// ============================================================
// COMPUTATIONAL CONFIGURATION
// ============================================================
//
// Runtime-owned configuration consumed by deterministic
// Resolve–Dissolve Computation.
//
// This object DOES NOT perform computation.
//
// It establishes a single canonical ownership boundary for
// the operator-selected computational universe:
//
//     C = (L, T, S)
//
// Resolve consumes a snapshot of this configuration together
// with the active Investigation and canonical Knowledge Object
// population.
//
// ============================================================

export interface WorkspaceComputationalConfiguration {

  // ----------------------------------------------------------
  // L — ACTIVE COMPUTATIONAL LAYERS
  // ----------------------------------------------------------
  //
  // Layers participating in the next Resolve computation.
  //
  // The Workspace Runtime owns the live configuration.
  //
  // Resolve receives a deterministic snapshot.
  //
  // ----------------------------------------------------------

  activeLayers:
    readonly string[];

  // ----------------------------------------------------------
  // T — TEMPORAL COMPUTATIONAL CONTEXT
  // ----------------------------------------------------------
  //
  // Intentionally opaque.
  //
  // The Resolve architecture currently preserves temporal
  // context without imposing a premature mathematical
  // representation.
  //
  // A canonical TemporalContext contract can replace unknown
  // later without changing the ownership architecture.
  //
  // ----------------------------------------------------------

  temporalContext:
    unknown;

  // ----------------------------------------------------------
  // S — INVESTIGATIVE SCALE
  // ----------------------------------------------------------
  //
  // Intentionally opaque.
  //
  // The Resolve architecture currently preserves investigative
  // scale without imposing a premature mathematical model.
  //
  // A canonical InvestigativeScale contract can replace unknown
  // later without changing the ownership architecture.
  //
  // ----------------------------------------------------------

  investigativeScale:
    unknown;

}

// ============================================================
// STATE
// ============================================================

export interface WorkspaceRuntimeState {

  /**
   * Runtime lifecycle status.
   */
  status:
    WorkspaceRuntimeStatus;

  /**
   * Active Investigation Session.
   */
  session:
    WorkspaceRuntimeSession;

  /**
   * Current Operator State.
   */
  operator:
    WorkspaceOperatorState;

  /**
   * Runtime-owned computational configuration.
   *
   * This configuration supplies L, T, and S to RDC.
   */
  computational:
    WorkspaceComputationalConfiguration;

  /**
   * Monotonically increasing runtime revision.
   *
   * Any canonical runtime state change increments this value.
   */
  revision:
    number;

}

// ============================================================
// FUTURE CONTRACTS
// ============================================================
//
// WorkspaceLayout will eventually expand beyond
// NORMAL / FOCUS to include additional operator-owned
// presentation state such as:
//
// • Dock visibility
// • Panel sizing
// • Workspace chrome
// • Multi-monitor layouts
// • Immersive presentation modes
//
// Computational configuration will later gain canonical:
//
// • TemporalContext
// • InvestigativeScale
// • Layer taxonomy
// • Compute profiles
// • Compute presets
// • Parameter validation
// • Configuration snapshots
//
// Those extensions MUST preserve the current ownership rule:
//
//     Workspace Runtime owns configuration.
//
//     Resolve Runtime consumes immutable computational
//     snapshots.
//
//     Resolve Engine performs deterministic computation.
//
// export interface WorkspaceViewport {}
//
// export interface WorkspacePlayback {}
//
// export interface WorkspaceHistory {}
//
// export interface WorkspaceSnapshot {}
//
// export interface WorkspaceCollaboration {}
//
// export interface WorkspaceExport {}
//
// export interface WorkspaceNotification {}
//
// ============================================================