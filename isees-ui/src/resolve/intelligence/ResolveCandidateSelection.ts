// ============================================================
// src/resolve/intelligence/ResolveCandidateSelection.ts
//
// P56D-G
// RESOLVE CANDIDATE SELECTION BRIDGE
//
// Deterministic bridge between:
//
//   Resolve Candidate Intelligence
//
// and:
//
//   Workspace Operator Selection
//
// PURPOSE
//
// Candidate Intelligence explains:
//
//   "Why did this potential relationship surface?"
//
// Workspace Candidate Selection records:
//
//   "Which potential relationship is the operator inspecting?"
//
// This module provides the deterministic round-trip:
//
//                 Ic -> Sc
//
// and:
//
//             (Sc, Ic[]) -> Ic
//
// where:
//
//   Ic = Resolve Candidate Intelligence
//   Sc = Workspace Candidate Selection
//
// CURRENT EXPLANATORY PATH
//
//                 U
//                 ↓
//                 M
//                 ↓
//                 C
//                 ↓
//                 E
//                 ↓
//                 Ic
//                 ↓
//                 Sc
//                 ↓
//                 Ic
//
// CRITICAL EPISTEMIC BOUNDARY
//
//                 CANDIDATE != EDGE
//
// Candidate selection is inspection state.
//
// It does NOT:
//
//   • establish a relationship
//   • create a GraphEdge
//   • mutate graph topology
//   • promote Knowledge
//   • generate a Research Vector
//   • execute REX
//   • recompute similarity
//   • recompute candidate evaluation
//   • rank candidates
//   • threshold candidates
//   • reverse pair orientation
//   • repair malformed lineage
//   • guess missing identity
//   • introduce timestamps
//   • introduce UUIDs
//   • introduce randomness
//   • perform AI inference
//   • perform heuristic reasoning
//
// ============================================================

import {
  WorkspaceSelectionKind,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import type {
  WorkspaceCandidateSelection,
  WorkspaceSelection,
} from "../../workspace/runtime/WorkspaceRuntimeTypes";

import type {
  ResolveCandidateIntelligence,
} from "./ResolveCandidateIntelligenceTypes";

// ============================================================
// CREATE WORKSPACE CANDIDATE SELECTION
// ============================================================
//
// Projects one Candidate Intelligence identity into the
// canonical Workspace candidate-selection vocabulary.
//
// No identity is generated.
//
// No lineage is reconstructed.
//
// No topology is created.
//
// ============================================================

export function createWorkspaceCandidateSelection(
  intelligence:
    ResolveCandidateIntelligence,
): WorkspaceCandidateSelection {

  // ----------------------------------------------------------
  // VALIDATE INTELLIGENCE IDENTITY
  // ----------------------------------------------------------
  //
  // Candidate Intelligence should already have been produced
  // from a validated canonical evaluation.
  //
  // This bridge nevertheless refuses to publish incomplete
  // operator-selection identity.
  //
  // ----------------------------------------------------------

  assertNonEmptyIdentity(
    intelligence.identity.candidateId,
    "candidateId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.evaluationId,
    "evaluationId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

  // ----------------------------------------------------------
  // CANDIDATE / EVALUATION LINEAGE CONSISTENCY
  // ----------------------------------------------------------
  //
  // Candidate Intelligence deliberately retains its
  // authoritative source evaluation.
  //
  // The identity projected into Workspace selection must agree
  // exactly with that authoritative evaluation identity.
  //
  // ----------------------------------------------------------

  assertIdentityEqual(
    intelligence.identity.candidateId,
    intelligence.sourceEvaluation.identity.candidateId,
    "candidateId",
  );

  assertIdentityEqual(
    intelligence.identity.evaluationId,
    intelligence.sourceEvaluation.identity.evaluationId,
    "evaluationId",
  );

  assertIdentityEqual(
    intelligence.identity.leftKnowledgeObjectId,
    intelligence.sourceEvaluation.identity.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertIdentityEqual(
    intelligence.identity.rightKnowledgeObjectId,
    intelligence.sourceEvaluation.identity.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

  // ----------------------------------------------------------
  // PROJECT SELECTION
  // ----------------------------------------------------------

  return {

    kind:
      WorkspaceSelectionKind.CANDIDATE,

    candidateId:
      intelligence.identity.candidateId,

    evaluationId:
      intelligence.identity.evaluationId,

    leftKnowledgeObjectId:
      intelligence.identity.leftKnowledgeObjectId,

    rightKnowledgeObjectId:
      intelligence.identity.rightKnowledgeObjectId,

  };

}

// ============================================================
// RESOLVE SELECTED CANDIDATE INTELLIGENCE
// ============================================================
//
// Resolves canonical operator selection back to the exact
// Candidate Intelligence object.
//
// Semantics:
//
//   NONE      -> undefined
//   NODE      -> undefined
//   EDGE      -> undefined
//   CANDIDATE -> exactly one matching Ic
//
// Candidate lookup is NOT based solely on candidateId.
//
// The complete deterministic identity tuple must agree:
//
//   candidateId
//   evaluationId
//   leftKnowledgeObjectId
//   rightKnowledgeObjectId
//
// This prevents:
//
//   • stale selection
//   • forged lineage
//   • accidental pair reversal
//   • ambiguous candidate resolution
//
// ============================================================

export function resolveSelectedCandidateIntelligence(
  selection:
    WorkspaceSelection,
  intelligence:
    readonly ResolveCandidateIntelligence[],
): ResolveCandidateIntelligence | undefined {

  // ----------------------------------------------------------
  // NON-CANDIDATE SELECTION
  // ----------------------------------------------------------
  //
  // Candidate Intelligence is deliberately orthogonal to
  // graph NODE / EDGE inspection.
  //
  // ----------------------------------------------------------

  if (
    selection.kind !==
    WorkspaceSelectionKind.CANDIDATE
  ) {

    return undefined;

  }

  // ----------------------------------------------------------
  // VALIDATE SELECTION IDENTITY
  // ----------------------------------------------------------

  validateWorkspaceCandidateSelection(
    selection,
  );

  // ----------------------------------------------------------
  // CANDIDATE ID LOOKUP
  // ----------------------------------------------------------
  //
  // First locate by canonical candidate identity.
  //
  // We intentionally do not immediately match the complete
  // tuple because doing so could turn malformed lineage into a
  // misleading "candidate not found" result.
  //
  // Instead:
  //
  //   candidateId
  //       ↓
  //   unique intelligence
  //       ↓
  //   validate complete lineage
  //
  // ----------------------------------------------------------

  const candidateMatches =
    intelligence.filter(
      candidateIntelligence =>
        candidateIntelligence.identity.candidateId ===
        selection.candidateId,
    );

  // ----------------------------------------------------------
  // MISSING CANDIDATE
  // ----------------------------------------------------------

  if (
    candidateMatches.length ===
    0
  ) {

    throw new Error(
      [
        "Resolve Candidate Selection rejected",
        "a candidate selection that cannot be resolved:",
        `candidateId="${selection.candidateId}".`,
      ].join(" "),
    );

  }

  // ----------------------------------------------------------
  // AMBIGUOUS CANDIDATE
  // ----------------------------------------------------------
  //
  // Candidate identity is canonical.
  //
  // More than one intelligence object carrying the same
  // candidateId is therefore malformed/ambiguous state.
  //
  // Never choose arbitrarily.
  //
  // ----------------------------------------------------------

  if (
    candidateMatches.length !==
    1
  ) {

    throw new Error(
      [
        "Resolve Candidate Selection rejected",
        "an ambiguous Candidate Intelligence population:",
        `candidateId="${selection.candidateId}"`,
        `matches=${candidateMatches.length}.`,
      ].join(" "),
    );

  }

  const resolved =
    candidateMatches[0];

  if (!resolved) {

    // TypeScript safety boundary.
    //
    // candidateMatches.length === 1 guarantees this branch is
    // unreachable at runtime.

    throw new Error(
      "Resolve Candidate Selection reached an impossible empty resolution state.",
    );

  }

  // ----------------------------------------------------------
  // VALIDATE RESOLVED INTELLIGENCE INTERNAL LINEAGE
  // ----------------------------------------------------------
  //
  // Before comparing selection lineage, ensure the resolved Ic
  // still agrees with its own authoritative source evaluation.
  //
  // This prevents a malformed intelligence object from being
  // accepted merely because the Workspace selection copied the
  // same malformed values.
  //
  // ----------------------------------------------------------

  validateCandidateIntelligenceLineage(
    resolved,
  );

  // ----------------------------------------------------------
  // COMPLETE SELECTION / INTELLIGENCE LINEAGE VALIDATION
  // ----------------------------------------------------------

  assertIdentityEqual(
    selection.candidateId,
    resolved.identity.candidateId,
    "candidateId",
  );

  assertIdentityEqual(
    selection.evaluationId,
    resolved.identity.evaluationId,
    "evaluationId",
  );

  assertIdentityEqual(
    selection.leftKnowledgeObjectId,
    resolved.identity.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertIdentityEqual(
    selection.rightKnowledgeObjectId,
    resolved.identity.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

  // ----------------------------------------------------------
  // EXACT AUTHORITATIVE RESOLUTION
  // ----------------------------------------------------------
  //
  // Return the existing authoritative intelligence object.
  //
  // Do NOT clone.
  // Do NOT reconstruct.
  // Do NOT reinterpret.
  //
  // ----------------------------------------------------------

  return resolved;

}

// ============================================================
// OPTIONAL SELECTION RESOLUTION
// ============================================================
//
// WorkspaceRuntime currently represents cleared selection as:
//
//                 undefined
//
// even though WorkspaceSelectionKind also contains an explicit:
//
//                 NONE
//
// state.
//
// This helper allows UI/runtime consumers to pass the runtime's
// current optional selection directly.
//
// Semantics:
//
//   undefined -> undefined
//   NONE      -> undefined
//   NODE      -> undefined
//   EDGE      -> undefined
//   CANDIDATE -> exact Ic
//
// ============================================================

export function resolveOptionalSelectedCandidateIntelligence(
  selection:
    WorkspaceSelection | undefined,
  intelligence:
    readonly ResolveCandidateIntelligence[],
): ResolveCandidateIntelligence | undefined {

  if (
    selection ===
    undefined
  ) {

    return undefined;

  }

  return resolveSelectedCandidateIntelligence(
    selection,
    intelligence,
  );

}

// ============================================================
// WORKSPACE CANDIDATE SELECTION VALIDATION
// ============================================================

export function validateWorkspaceCandidateSelection(
  selection:
    WorkspaceCandidateSelection,
): void {

  assertNonEmptyIdentity(
    selection.candidateId,
    "candidateId",
  );

  assertNonEmptyIdentity(
    selection.evaluationId,
    "evaluationId",
  );

  assertNonEmptyIdentity(
    selection.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertNonEmptyIdentity(
    selection.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

}

// ============================================================
// CANDIDATE INTELLIGENCE LINEAGE VALIDATION
// ============================================================
//
// Candidate Intelligence retains authoritative E.
//
// Therefore its projected identity must agree exactly with:
//
//                 sourceEvaluation.identity
//
// No repair is permitted.
//
// ============================================================

export function validateCandidateIntelligenceLineage(
  intelligence:
    ResolveCandidateIntelligence,
): void {

  assertNonEmptyIdentity(
    intelligence.identity.candidateId,
    "candidateId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.evaluationId,
    "evaluationId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertNonEmptyIdentity(
    intelligence.identity.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

  assertIdentityEqual(
    intelligence.identity.candidateId,
    intelligence.sourceEvaluation.identity.candidateId,
    "candidateId",
  );

  assertIdentityEqual(
    intelligence.identity.evaluationId,
    intelligence.sourceEvaluation.identity.evaluationId,
    "evaluationId",
  );

  assertIdentityEqual(
    intelligence.identity.leftKnowledgeObjectId,
    intelligence.sourceEvaluation.identity.leftKnowledgeObjectId,
    "leftKnowledgeObjectId",
  );

  assertIdentityEqual(
    intelligence.identity.rightKnowledgeObjectId,
    intelligence.sourceEvaluation.identity.rightKnowledgeObjectId,
    "rightKnowledgeObjectId",
  );

}

// ============================================================
// IDENTITY ASSERTION
// ============================================================

function assertNonEmptyIdentity(
  value:
    string,
  field:
    string,
): void {

  if (
    value.trim().length ===
    0
  ) {

    throw new Error(
      [
        "Resolve Candidate Selection rejected",
        "an empty canonical identity:",
        `${field}="${value}".`,
      ].join(" "),
    );

  }

}

// ============================================================
// IDENTITY EQUALITY ASSERTION
// ============================================================

function assertIdentityEqual(
  left:
    string,
  right:
    string,
  field:
    string,
): void {

  if (
    left !==
    right
  ) {

    throw new Error(
      [
        "Resolve Candidate Selection rejected",
        "inconsistent canonical lineage:",
        `${field}`,
        `left="${left}"`,
        `right="${right}".`,
      ].join(" "),
    );

  }

}

// ============================================================
// ARCHITECTURAL BOUNDARY
// ============================================================
//
// Established graph selection:
//
//   WorkspaceEdgeSelection
//          ↓
//   established GraphEdge inspection
//
// Resolve candidate selection:
//
//   ResolveCandidateIntelligence
//          ↓
//   WorkspaceCandidateSelection
//          ↓
//   ResolveCandidateIntelligence
//
// Therefore:
//
//   EDGE selection
//
// and:
//
//   CANDIDATE selection
//
// remain structurally and epistemically distinct.
//
// Future RightPanel integration can consume:
//
//   WorkspaceRuntime.getSelection()
//
// together with:
//
//   ResolveCandidateIntelligence[]
//
// and call:
//
//   resolveOptionalSelectedCandidateIntelligence(...)
//
// without converting a candidate into graph topology.
//
// ============================================================

// ============================================================
// END
// ============================================================