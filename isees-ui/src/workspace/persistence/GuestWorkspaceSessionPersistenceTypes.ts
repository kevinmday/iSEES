// ============================================================
// src/workspace/persistence/GuestWorkspaceSessionPersistenceTypes.ts
// P56D-I1-G2
// GUEST WORKSPACE SESSION PERSISTENCE TYPES
//
// Canonical persistence contract for Guest operational state.
//
// G1 established:
//
//   Guest operator identity
//       -> browser-session persistence
//
// G2 extends that architecture:
//
//   Guest operator identity
//       +
//   Guest operational workspace
//       -> browser-session persistence
//
// Governing invariant:
//
//   Authentication changes ownership,
//   not investigative identity.
//
// This contract deliberately separates:
//
//   Identity
//       -> OperatorIdentityRuntime
//
//   Operational workspace persistence
//       -> GuestWorkspaceSessionPersistence
//
// Runtime revision counters and runtime lifecycle status are NOT
// canonical persisted investigative identity.
//
// ============================================================

import type {
  Investigation,
} from "../../investigation/investigationTypes";

import type {
  Workspace,
} from "../workspaceTypes";

import type {
  WorkspaceComputationalConfiguration,
  WorkspaceMode,
  WorkspaceLayoutMode,
} from "../runtime/WorkspaceRuntimeTypes";

import type {
  ResearchDesk,
} from "../../research/researchBridgeTypes";

import type {
  ComputationalAuthorDocument,
} from "../../author/model/AuthorDocument";


// ============================================================
// SCHEMA VERSION
// ============================================================
//
// Persisted browser state is untrusted external input.
//
// A schema version allows the persistence boundary to reject or
// migrate incompatible historical snapshots deterministically.
//
// ============================================================

export const GUEST_WORKSPACE_SESSION_SCHEMA_VERSION =
  1 as const;

export type GuestWorkspaceSessionSchemaVersion =
  typeof GUEST_WORKSPACE_SESSION_SCHEMA_VERSION;


// ============================================================
// PERSISTED WORKSPACE OPERATOR STATE
// ============================================================
//
// Only operational configuration required to reconstruct the
// workspace is persisted.
//
// Transient interaction state such as hover/selection should not
// become part of investigative identity merely because it existed
// at the moment a snapshot was written.
//
// ============================================================

export interface PersistedGuestWorkspaceOperatorState {

  activeMode:
    WorkspaceMode;

  layoutMode:
    WorkspaceLayoutMode;

}


// ============================================================
// PERSISTED WORKSPACE STATE
// ============================================================
//
// WorkspaceRuntime owns considerably more live runtime state than
// should be persisted.
//
// We preserve the domain state necessary to reconstruct the
// operator's investigative workspace:
//
//   workspace
//   investigation
//   computational configuration
//   operator configuration
//
// We intentionally do NOT persist:
//
//   runtime status
//   runtime revision
//   listeners
//   hover state
//   selection state
//
// Those belong to the reconstructed runtime.
//
// ============================================================

export interface PersistedGuestWorkspaceState {

  workspace?:
    Workspace;

  investigation?:
    Investigation;

  operator:
    PersistedGuestWorkspaceOperatorState;

  computational:
    WorkspaceComputationalConfiguration;

}


// ============================================================
// PERSISTED RESEARCH STATE
// ============================================================
//
// Research Anchors already carry deterministic identity derived
// from:
//
//   investigationId
//   +
//   graph type
//   +
//   graph identity
//
// Therefore the Research Desk may be preserved directly without
// manufacturing replacement Research identities.
//
// ============================================================

export interface PersistedGuestResearchState {

  desk:
    ResearchDesk;

}


// ============================================================
// PERSISTED AUTHORING STATE
// ============================================================
//
// The active Computational Author Document is an artifact with
// its own identity.
//
// Authentication must never manufacture a replacement document
// merely because workspace ownership changes.
//
// Dirty state is intentionally excluded.
//
// "dirty" describes runtime/editor state, not artifact identity.
//
// ============================================================

export interface PersistedGuestAuthoringState {

  activeDocument?:
    ComputationalAuthorDocument;

}


// ============================================================
// OWNERSHIP PROVENANCE
// ============================================================
//
// G2 initially persists Guest ownership.
//
// The structure is intentionally explicit so a later Guest ->
// Account transition can extend provenance without changing the
// investigation identity.
//
// ============================================================

export interface GuestWorkspaceOwnershipProvenance {

  kind:
    "GUEST";

  operatorId:
    string;

  establishedAt:
    string;

}


// ============================================================
// GUEST WORKSPACE SNAPSHOT
// ============================================================
//
// This is the canonical browser-session representation of a Guest
// operational workspace.
//
// IMPORTANT:
//
// guest operator identity and investigation identity are separate.
//
// operatorId answers:
//
//   WHO is operating?
//
// investigation.id answers:
//
//   WHAT investigation is being operated?
//
// Neither identity may be derived from the other.
//
// ============================================================

export interface GuestWorkspaceSessionSnapshot {

  schemaVersion:
    GuestWorkspaceSessionSchemaVersion;

  ownership:
    GuestWorkspaceOwnershipProvenance;

  createdAt:
    string;

  updatedAt:
    string;

  workspace:
    PersistedGuestWorkspaceState;

  research:
    PersistedGuestResearchState;

  authoring:
    PersistedGuestAuthoringState;

}


// ============================================================
// RESTORE RESULT
// ============================================================
//
// Persistence restoration must distinguish:
//
//   no snapshot exists
//
// from:
//
//   snapshot exists but is invalid
//
// This matters because malformed browser storage should never
// silently enter deterministic runtime state.
//
// ============================================================

export type GuestWorkspaceSessionRestoreResult =
  | {
      status:
        "EMPTY";
    }
  | {
      status:
        "RESTORED";

      snapshot:
        GuestWorkspaceSessionSnapshot;
    }
  | {
      status:
        "INVALID";

      reason:
        string;
    };


// ============================================================
// SEMANTIC HELPERS
// ============================================================

export function isGuestWorkspaceSessionSchemaVersion(
  value:
    unknown,
): value is GuestWorkspaceSessionSchemaVersion {

  return (
    value ===
    GUEST_WORKSPACE_SESSION_SCHEMA_VERSION
  );

}


// ============================================================
// INVESTIGATION IDENTITY HELPER
// ============================================================
//
// Centralizes the G2 identity invariant.
//
// This deliberately compares investigation identity only.
//
// It does NOT compare:
//
//   operator identity
//   ownership
//   timestamps
//   runtime revisions
//
// ============================================================

export function preservesInvestigationIdentity(
  before:
    Investigation,
  after:
    Investigation,
): boolean {

  return (
    before.id ===
    after.id
  );

}


// ============================================================
// OWNERSHIP HELPER
// ============================================================

export function isGuestWorkspaceOwnership(
  ownership:
    GuestWorkspaceOwnershipProvenance,
): boolean {

  return (
    ownership.kind ===
    "GUEST"
  );

}


// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// P56D-I1-G2:
//
//   Identity != Session
//
//   Identity != Workspace
//
//   Account != Capability
//
//   Guest operator identity != Investigation identity
//
//   Investigation identity != Storage location
//
//   Knowledge identity != Ownership identity
//
//   Author document identity != Ownership identity
//
//   Research anchor identity != Ownership identity
//
//   Authentication changes ownership,
//   not investigative identity.
//
// Therefore:
//
//       Guest
//         |
//         v
//   Investigation I
//         |
//         v
//   Authenticate
//         |
//         v
//   Account-owned Investigation I
//
// NOT:
//
//       Guest Investigation I
//         |
//         v
//   Authenticate
//         |
//         v
//   New Investigation I'
//
// ============================================================
