// ============================================================
// src/resolve/engine/ResolveReplay.ts
//
// P56D-D
// DETERMINISTIC RESOLVE REPLAY
//
// Provides first-class replay verification for the complete
// deterministic Resolve computational product.
//
// PURPOSE
//
// A deterministic computational system must be able to prove:
//
//     equivalent canonical input
//              ↓
//           Resolve
//              ↓
//     equivalent deterministic output
//
// Resolve now produces three distinct deterministic
// computational layers:
//
//   • Canonical Manifold
//   • Canonical Similarity Candidates
//   • Canonical Similarity Candidate Evaluations
//
// The manifold remains governed by:
//
//                 M = g(L,T,S)
//
// Candidate derivation occurs strictly downstream:
//
//                 C = h(M.similarityMatrix)
//
// Candidate evaluation occurs strictly downstream:
//
//                 E = q(C)
//
// Therefore:
//
//                 U -> M -> C -> E
//
// Deterministic replay must verify ALL THREE:
//
//   • manifold canonical representation
//   • canonical similarity candidate representation
//   • canonical candidate evaluation representation
//
// A replay is VERIFIED only when all three deterministic
// products are byte-equivalent.
//
// IMPORTANT
//
// Replay verification is based on computational content.
//
// It deliberately ignores:
//
//   • execution IDs
//   • timestamps
//   • runtime revision numbers
//   • runtime lifecycle state
//   • UI state
//
// Those values are runtime metadata and MUST NOT affect
// deterministic replay.
//
// Replay does NOT:
//
//   • recompute similarity independently
//   • recompute candidate evaluation independently
//   • apply candidate thresholds
//   • rank candidates
//   • mutate topology
//   • mutate Knowledge
//   • generate Research Vectors
//   • execute REX
//   • perform AI inference
//
// No React.
// No UI.
// No graph rendering.
// No persistence.
// No networking.
// No AI inference.
// No clocks.
// No random values.
//
// ============================================================

import type {
  ResolveComputationInput,
} from "../runtime/ResolveRuntimeTypes";

import type {
  CanonicalSimilarityCandidateCollection,
} from "../candidates/CanonicalSimilarityCandidateTypes";

import type {
  CanonicalSimilarityCandidateEvaluationCollection,
} from "../evaluation/CanonicalSimilarityCandidateEvaluationTypes";

import {
  buildCanonicalComputationalUniverse,
} from "./CanonicalUniverse";

import {
  ResolveEngine,
} from "./ResolveEngine";

// ============================================================
// REPLAY STATUS
// ============================================================

export const ResolveReplayStatus = {

  VERIFIED:
    "VERIFIED",

  DIVERGED:
    "DIVERGED",

} as const;

export type ResolveReplayStatus =
  (typeof ResolveReplayStatus)[
    keyof typeof ResolveReplayStatus
  ];

// ============================================================
// CANONICAL CANDIDATE REPRESENTATION
// ============================================================
//
// similarityCandidates are already produced in deterministic
// canonical pair order by the candidate generator.
//
// The complete collection contains only deterministic
// computational content.
//
// JSON serialization is therefore intentionally used here as
// the byte-comparable replay representation of that canonical
// candidate collection.
//
// This representation is separate from the manifold's
// canonicalRepresentation because candidates are deliberately
// a sibling Resolve product rather than part of
// CanonicalManifold.
//
// ============================================================

export function computeCanonicalSimilarityCandidateRepresentation(
  candidates:
    CanonicalSimilarityCandidateCollection,
): string {

  return JSON.stringify(
    candidates,
  );

}

// ============================================================
// CANONICAL EVALUATION REPRESENTATION
// ============================================================
//
// candidateEvaluations are produced in deterministic candidate
// identity order by the canonical evaluator.
//
// The evaluation collection contains only deterministic
// computational content.
//
// JSON serialization is therefore intentionally used as the
// byte-comparable replay representation of the canonical
// evaluation product.
//
// This representation remains separate from:
//
//   • CanonicalManifold representation
//   • similarity candidate representation
//
// because evaluations are a sibling deterministic Resolve
// product.
//
// This separation is intentional.
//
// It allows replay to detect:
//
//   M same, C same, E different
//
// independently from other divergence classes.
//
// ============================================================

export function computeCanonicalCandidateEvaluationRepresentation(
  evaluations:
    CanonicalSimilarityCandidateEvaluationCollection,
): string {

  return JSON.stringify(
    evaluations,
  );

}

// ============================================================
// REPLAY BASELINE
// ============================================================
//
// A baseline captures the complete deterministic Resolve product
// required for replay verification.
//
// It contains:
//
//   • canonical manifold representation
//   • canonical candidate representation
//   • canonical evaluation representation
//
// This is intentionally NOT a runtime execution record.
//
// Runtime metadata does not belong in deterministic replay.
//
// ============================================================

export interface ResolveReplayBaseline {

  canonicalRepresentation:
    string;

  similarityCandidateRepresentation:
    string;

  candidateEvaluationRepresentation:
    string;

}

// ============================================================
// REPLAY RESULT
// ============================================================
//
// Replay exposes component equivalence as well as aggregate
// verification.
//
// This allows a caller to distinguish:
//
//   manifold divergence
//
// from:
//
//   candidate-product divergence
//
// from:
//
//   evaluation-product divergence
//
// without weakening the aggregate replay contract.
//
// ============================================================

export interface ResolveReplayResult {

  status:
    ResolveReplayStatus;

  verified:
    boolean;

  manifoldVerified:
    boolean;

  similarityCandidatesVerified:
    boolean;

  candidateEvaluationsVerified:
    boolean;

  expectedCanonicalRepresentation:
    string;

  actualCanonicalRepresentation:
    string;

  expectedSimilarityCandidateRepresentation:
    string;

  actualSimilarityCandidateRepresentation:
    string;

  expectedCandidateEvaluationRepresentation:
    string;

  actualCandidateEvaluationRepresentation:
    string;

}

// ============================================================
// CREATE REPLAY RESULT
// ============================================================
//
// Centralizes the deterministic equivalence rule.
//
// A complete Resolve replay is VERIFIED iff:
//
//     manifoldEquivalent
//             AND
//     candidateProductEquivalent
//             AND
//     evaluationProductEquivalent
//
// ============================================================

function createResolveReplayResult(
  expectedCanonicalRepresentation:
    string,
  actualCanonicalRepresentation:
    string,
  expectedSimilarityCandidateRepresentation:
    string,
  actualSimilarityCandidateRepresentation:
    string,
  expectedCandidateEvaluationRepresentation:
    string,
  actualCandidateEvaluationRepresentation:
    string,
): ResolveReplayResult {

  const manifoldVerified =
    expectedCanonicalRepresentation ===
    actualCanonicalRepresentation;

  const similarityCandidatesVerified =
    expectedSimilarityCandidateRepresentation ===
    actualSimilarityCandidateRepresentation;

  const candidateEvaluationsVerified =
    expectedCandidateEvaluationRepresentation ===
    actualCandidateEvaluationRepresentation;

  const verified =
    manifoldVerified &&
    similarityCandidatesVerified &&
    candidateEvaluationsVerified;

  return {

    status:
      verified
        ? ResolveReplayStatus.VERIFIED
        : ResolveReplayStatus.DIVERGED,

    verified,

    manifoldVerified,

    similarityCandidatesVerified,

    candidateEvaluationsVerified,

    expectedCanonicalRepresentation,

    actualCanonicalRepresentation,

    expectedSimilarityCandidateRepresentation,

    actualSimilarityCandidateRepresentation,

    expectedCandidateEvaluationRepresentation,

    actualCandidateEvaluationRepresentation,

  };

}

// ============================================================
// CREATE REPLAY BASELINE
// ============================================================
//
// Executes the deterministic Resolve pipeline and captures the
// complete deterministic result required for replay.
//
// Pipeline:
//
//   ResolveComputationInput
//            ↓
//   Canonical Computational Universe
//            ↓
//        Resolve Engine
//            ↓
//         g(L,T,S)
//            ↓
//    Canonical Manifold
//       ↙          ↘
//      ↓            ↓
// Canonical       Similarity
// Representation   Matrix
//                   ↓
//                C = h(S)
//                   ↓
//          Similarity Candidates
//                   ↓
//                E = q(C)
//                   ↓
//          Candidate Evaluations
//
// Replay baseline independently captures:
//
//   M representation
//   C representation
//   E representation
//
// ============================================================

export function createResolveReplayBaseline(
  input:
    ResolveComputationInput,
): ResolveReplayBaseline {

  const universe =
    buildCanonicalComputationalUniverse(
      input,
    );

  const engine =
    new ResolveEngine();

  const output =
    engine.execute({

      universe,

    });

  const similarityCandidateRepresentation =
    computeCanonicalSimilarityCandidateRepresentation(
      output.similarityCandidates,
    );

  const candidateEvaluationRepresentation =
    computeCanonicalCandidateEvaluationRepresentation(
      output.candidateEvaluations,
    );

  return {

    canonicalRepresentation:
      output.canonicalRepresentation,

    similarityCandidateRepresentation,

    candidateEvaluationRepresentation,

  };

}

// ============================================================
// VERIFY REPLAY
// ============================================================
//
// Recomputes Resolve from supplied input and compares ALL THREE
// deterministic output layers against the expected baseline.
//
// Byte equality is intentional.
//
// A replay is VERIFIED only when:
//
//   expected manifold bytes
//            ===
//   actual manifold bytes
//
// AND
//
//   expected candidate bytes
//            ===
//   actual candidate bytes
//
// AND
//
//   expected evaluation bytes
//            ===
//   actual evaluation bytes
//
// Divergence in any product causes the complete Resolve replay
// to report DIVERGED.
//
// ============================================================

export function verifyResolveReplay(
  baseline:
    ResolveReplayBaseline,
  input:
    ResolveComputationInput,
): ResolveReplayResult {

  const universe =
    buildCanonicalComputationalUniverse(
      input,
    );

  const engine =
    new ResolveEngine();

  const output =
    engine.execute({

      universe,

    });

  const expectedCanonicalRepresentation =
    baseline.canonicalRepresentation;

  const actualCanonicalRepresentation =
    output.canonicalRepresentation;

  const expectedSimilarityCandidateRepresentation =
    baseline.similarityCandidateRepresentation;

  const actualSimilarityCandidateRepresentation =
    computeCanonicalSimilarityCandidateRepresentation(
      output.similarityCandidates,
    );

  const expectedCandidateEvaluationRepresentation =
    baseline.candidateEvaluationRepresentation;

  const actualCandidateEvaluationRepresentation =
    computeCanonicalCandidateEvaluationRepresentation(
      output.candidateEvaluations,
    );

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    expectedSimilarityCandidateRepresentation,
    actualSimilarityCandidateRepresentation,
    expectedCandidateEvaluationRepresentation,
    actualCandidateEvaluationRepresentation,
  );

}

// ============================================================
// VERIFY COMPLETE REPRESENTATIONS DIRECTLY
// ============================================================
//
// Lower-level verification utility.
//
// Useful when all deterministic representations have already
// been computed or loaded from a future persistence boundary.
//
// No recomputation occurs here.
//
// Complete-product verification covers:
//
//   M + C + E
//
// ============================================================

export function verifyResolveRepresentations(
  expectedCanonicalRepresentation:
    string,
  actualCanonicalRepresentation:
    string,
  expectedSimilarityCandidateRepresentation:
    string,
  actualSimilarityCandidateRepresentation:
    string,
  expectedCandidateEvaluationRepresentation:
    string,
  actualCandidateEvaluationRepresentation:
    string,
): ResolveReplayResult {

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    expectedSimilarityCandidateRepresentation,
    actualSimilarityCandidateRepresentation,
    expectedCandidateEvaluationRepresentation,
    actualCandidateEvaluationRepresentation,
  );

}

// ============================================================
// VERIFY MANIFOLD REPRESENTATIONS DIRECTLY
// ============================================================
//
// Backward-compatible lower-level utility for callers that
// intentionally verify ONLY CanonicalManifold representation.
//
// IMPORTANT:
//
// This function does NOT claim complete Resolve-product replay
// equivalence.
//
// It verifies only the supplied manifold representations.
//
// Candidate and evaluation representations are intentionally
// represented by the same deterministic empty sentinel on both
// sides so that the returned aggregate result describes ONLY
// this explicitly scoped manifold comparison.
//
// Complete Resolve replay should use:
//
//   verifyResolveReplay()
//
// or:
//
//   verifyResolveRepresentations()
//
// ============================================================

export function verifyCanonicalRepresentations(
  expectedCanonicalRepresentation:
    string,
  actualCanonicalRepresentation:
    string,
): ResolveReplayResult {

  const emptyCandidateRepresentation =
    "";

  const emptyEvaluationRepresentation =
    "";

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    emptyCandidateRepresentation,
    emptyCandidateRepresentation,
    emptyEvaluationRepresentation,
    emptyEvaluationRepresentation,
  );

}

// ============================================================
// ASSERT VERIFIED REPLAY
// ============================================================
//
// Strict replay assertion for engineering verification and
// future integrity-sensitive computation paths.
//
// Throws if any deterministic Resolve product diverges.
//
// ============================================================

export function assertResolveReplayVerified(
  result:
    ResolveReplayResult,
): void {

  if (
    result.status !==
      ResolveReplayStatus.VERIFIED
  ) {

    throw new Error(
      "Resolve deterministic replay verification failed: canonical manifold, similarity candidate product, or candidate evaluation product diverged.",
    );

  }

}

// ============================================================
// END
// ============================================================