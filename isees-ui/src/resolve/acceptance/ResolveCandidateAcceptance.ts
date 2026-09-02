// ============================================================
// src/resolve/acceptance/ResolveCandidateAcceptance.ts
//
// P56D-I1-G6
// OPERATOR CANDIDATE ACCEPTANCE
//
// Deterministic materialization of an accepted Resolve candidate
// into canonical Knowledge relationship state.
//
// GOVERNING PATH
//
//   Canonical Knowledge
//          ↓
//   Resolve similarity
//          ↓
//   Candidate
//          ↓
//   Evaluation
//          ↓
//   Candidate Intelligence
//          ↓
//   Operator Candidate Selection
//          ↓
//   ACCEPT
//          ↓
//   KnowledgeRelationship
//
// CRITICAL EPISTEMIC BOUNDARY
//
//   Candidate != Relationship
//
// Acceptance is the explicit operator act that crosses this
// boundary.
//
// This module:
//   • validates complete candidate lineage
//   • resolves the canonical Knowledge pair
//   • creates one deterministic KnowledgeRelationship
//   • returns a new immutable KnowledgeObject
//
// This module does NOT:
//   • mutate KnowledgeRuntime
//   • execute Resolve
//   • create graph topology directly
//   • recompute similarity
//   • recompute candidate evaluation
//   • rank candidates
//   • threshold candidates
//   • invent timestamps
//   • invent UUIDs
//   • perform AI inference
//
// ============================================================

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import type {
  KnowledgeRelationship,
} from "../../knowledge/model/KnowledgeObjectTypes";

import type {
  ResolveCandidateIntelligence,
} from "../intelligence/ResolveCandidateIntelligenceTypes";

import {
  validateCandidateIntelligenceLineage,
} from "../intelligence/ResolveCandidateSelection";

// ============================================================
// ACCEPTED RELATIONSHIP TYPE
// ============================================================
//
// The relationship semantic deliberately records WHY the
// relationship entered canonical Knowledge:
//
//     accepted Resolve similarity candidate
//
// It does NOT claim:
//   • sameness
//   • causation
//   • support
//   • contradiction
//
// ============================================================

export const ResolveAcceptedRelationshipType = {
  RESOLVE_CANDIDATE:
    "RESOLVE_CANDIDATE",
} as const;

export type ResolveAcceptedRelationshipType =
  (
    typeof ResolveAcceptedRelationshipType
  )[
    keyof typeof ResolveAcceptedRelationshipType
  ];

// ============================================================
// ACCEPTANCE RESULT
// ============================================================

export interface ResolveCandidateAcceptanceResult {

  sourceKnowledgeObjectId:
    string;

  targetKnowledgeObjectId:
    string;

  relationship:
    KnowledgeRelationship;

  knowledgeObject:
    KnowledgeObject;

  changed:
    boolean;

}

export function createAcceptedResolveCandidateRelationshipId(
  candidateId: string,
): string {
  if (candidateId.trim().length === 0) {
    throw new Error(
      "Resolve Candidate Acceptance rejected an empty candidate identity.",
    );
  }

  return [
    "resolve-relationship",
    candidateId,
  ].join(":");
}

// ============================================================
// MATERIALIZE ACCEPTED CANDIDATE
// ============================================================

export function materializeAcceptedResolveCandidate(
  intelligence:
    ResolveCandidateIntelligence,
  knowledgeObjects:
    readonly KnowledgeObject[],
): ResolveCandidateAcceptanceResult {

  // ----------------------------------------------------------
  // VALIDATE AUTHORITATIVE CANDIDATE LINEAGE
  // ----------------------------------------------------------

  validateCandidateIntelligenceLineage(
    intelligence,
  );

  const sourceKnowledgeObjectId =
    intelligence.identity.leftKnowledgeObjectId;

  const targetKnowledgeObjectId =
    intelligence.identity.rightKnowledgeObjectId;

  // ----------------------------------------------------------
  // RESOLVE SOURCE KNOWLEDGE OBJECT
  // ----------------------------------------------------------

  const sourceObject =
    resolveExactlyOneKnowledgeObject(
      knowledgeObjects,
      sourceKnowledgeObjectId,
      "source",
    );

  // ----------------------------------------------------------
  // RESOLVE TARGET KNOWLEDGE OBJECT
  // ----------------------------------------------------------
  //
  // Target existence is mandatory even though the target object
  // itself is not mutated.
  //
  // This prevents materializing dangling canonical
  // relationships.
  //
  // ----------------------------------------------------------

  resolveExactlyOneKnowledgeObject(
    knowledgeObjects,
    targetKnowledgeObjectId,
    "target",
  );

  // ----------------------------------------------------------
  // DETERMINISTIC RELATIONSHIP IDENTITY
  // ----------------------------------------------------------
  //
  // Candidate identity is already canonical and deterministic.
  //
  // Therefore relationship identity derives from it directly.
  //
  // No UUID.
  // No clock.
  //
  // ----------------------------------------------------------

  const relationshipId =
    createAcceptedResolveCandidateRelationshipId(
      intelligence.identity.candidateId,
    );

  const relationship:
    KnowledgeRelationship = {

    id:
      relationshipId,

    type:
      ResolveAcceptedRelationshipType.RESOLVE_CANDIDATE,

    targetId:
      targetKnowledgeObjectId,

  };

  // ----------------------------------------------------------
  // IDEMPOTENCE
  // ----------------------------------------------------------
  //
  // Re-accepting the same canonical candidate must not create a
  // duplicate relationship.
  //
  // ----------------------------------------------------------

  const existingRelationship =
    sourceObject.relationships.find(
      existing =>
        existing.id ===
        relationship.id,
    );

  if (existingRelationship) {

    assertRelationshipEqual(
      existingRelationship,
      relationship,
    );

    return {

      sourceKnowledgeObjectId,

      targetKnowledgeObjectId,

      relationship:
        existingRelationship,

      knowledgeObject:
        sourceObject,

      changed:
        false,

    };

  }

  // ----------------------------------------------------------
  // IMMUTABLE MATERIALIZATION
  // ----------------------------------------------------------
  //
  // Preserve every existing Knowledge field exactly.
  //
  // Acceptance changes only canonical relationship state.
  //
  // Revision/provenance clocks are intentionally NOT fabricated
  // here. Runtime revision publication belongs to
  // KnowledgeObjectRuntime.
  //
  // ----------------------------------------------------------

  const knowledgeObject:
    KnowledgeObject = {

    ...sourceObject,

    relationships: [
      ...sourceObject.relationships,
      relationship,
    ],

  };

  return {

    sourceKnowledgeObjectId,

    targetKnowledgeObjectId,

    relationship,

    knowledgeObject,

    changed:
      true,

  };

}

// ============================================================
// EXACT KNOWLEDGE RESOLUTION
// ============================================================

function resolveExactlyOneKnowledgeObject(
  knowledgeObjects:
    readonly KnowledgeObject[],
  id:
    string,
  role:
    "source" | "target",
): KnowledgeObject {

  if (
    id.trim().length ===
    0
  ) {

    throw new Error(
      [
        "Resolve Candidate Acceptance rejected",
        `an empty ${role} Knowledge identity.`,
      ].join(" "),
    );

  }

  const matches =
    knowledgeObjects.filter(
      object =>
        object.identity.id ===
        id,
    );

  if (
    matches.length ===
    0
  ) {

    throw new Error(
      [
        "Resolve Candidate Acceptance rejected",
        `a missing ${role} Knowledge Object:`,
        `id="${id}".`,
      ].join(" "),
    );

  }

  if (
    matches.length !==
    1
  ) {

    throw new Error(
      [
        "Resolve Candidate Acceptance rejected",
        `an ambiguous ${role} Knowledge identity:`,
        `id="${id}"`,
        `matches=${matches.length}.`,
      ].join(" "),
    );

  }

  const resolved =
    matches[0];

  if (!resolved) {

    throw new Error(
      "Resolve Candidate Acceptance reached an impossible empty Knowledge resolution state.",
    );

  }

  return resolved;

}

// ============================================================
// EXISTING RELATIONSHIP VALIDATION
// ============================================================
//
// Same deterministic relationship ID carrying different
// semantics is malformed canonical state.
//
// Never overwrite it silently.
//
// ============================================================

function assertRelationshipEqual(
  existing:
    KnowledgeRelationship,
  expected:
    KnowledgeRelationship,
): void {

  if (
    existing.id !==
      expected.id ||
    existing.type !==
      expected.type ||
    existing.targetId !==
      expected.targetId
  ) {

    throw new Error(
      [
        "Resolve Candidate Acceptance rejected",
        "an inconsistent existing relationship:",
        `id="${expected.id}".`,
      ].join(" "),
    );

  }

}

// ============================================================
// ARCHITECTURAL INVARIANTS
// ============================================================
//
// 1. Candidate != Relationship.
//
// 2. Only explicit acceptance materializes a relationship.
//
// 3. Relationship identity derives from canonical candidate
//    identity.
//
// 4. Pair orientation is preserved:
//      left  = source
//      right = target
//
// 5. Source and target Knowledge Objects must both exist.
//
// 6. Repeated acceptance is idempotent.
//
// 7. Existing conflicting relationship identity is rejected.
//
// 8. Existing Knowledge state is preserved immutably.
//
// 9. Acceptance does not manufacture provenance.
//
// 10. Acceptance does not manufacture wall-clock timestamps.
//
// 11. Acceptance does not execute Resolve.
//
// 12. Acceptance does not mutate graph topology directly.
//
// 13. Acceptance performs no AI inference.
//
// ============================================================

// ============================================================
// END
// ============================================================
