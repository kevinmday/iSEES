// ============================================================
// src/resolve/engine/ResolveReplay.ts
//
// P56D-C
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
// Resolve now produces two distinct deterministic computational
// layers:
//
//   • Canonical Manifold
//   • Canonical Similarity Candidates
//
// The manifold remains governed by:
//
//                 M = g(L,T,S)
//
// Candidate derivation occurs strictly downstream:
//
//                 C = h(M.similarityMatrix)
//
// Therefore deterministic replay must verify BOTH:
//
//   • manifold canonical representation
//   • canonical similarity candidate representation
//
// A replay is VERIFIED only when both deterministic products
// are byte-equivalent.
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
//   • apply candidate thresholds
//   • rank candidates
//   • mutate topology
//   • mutate Knowledge
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

  expectedCanonicalRepresentation:
    string;

  actualCanonicalRepresentation:
    string;

  expectedSimilarityCandidateRepresentation:
    string;

  actualSimilarityCandidateRepresentation:
    string;

}

// ============================================================
// CREATE REPLAY RESULT
// ============================================================
//
// Centralizes the deterministic equivalence rule.
//
// A Resolve replay is VERIFIED iff:
//
//     manifoldEquivalent
//             AND
//     candidateProductEquivalent
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
): ResolveReplayResult {

  const manifoldVerified =
    expectedCanonicalRepresentation ===
    actualCanonicalRepresentation;

  const similarityCandidatesVerified =
    expectedSimilarityCandidateRepresentation ===
    actualSimilarityCandidateRepresentation;

  const verified =
    manifoldVerified &&
    similarityCandidatesVerified;

  return {

    status:
      verified
        ? ResolveReplayStatus.VERIFIED
        : ResolveReplayStatus.DIVERGED,

    verified,

    manifoldVerified,

    similarityCandidatesVerified,

    expectedCanonicalRepresentation,

    actualCanonicalRepresentation,

    expectedSimilarityCandidateRepresentation,

    actualSimilarityCandidateRepresentation,

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
//          Canonical Candidate
//            Representation
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

  return {

    canonicalRepresentation:
      output.canonicalRepresentation,

    similarityCandidateRepresentation,

  };

}

// ============================================================
// VERIFY REPLAY
// ============================================================
//
// Recomputes Resolve from supplied input and compares BOTH
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
// Divergence in either product causes the complete Resolve
// replay to report DIVERGED.
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

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    expectedSimilarityCandidateRepresentation,
    actualSimilarityCandidateRepresentation,
  );

}

// ============================================================
// VERIFY COMPLETE REPRESENTATIONS DIRECTLY
// ============================================================
//
// Lower-level verification utility.
//
// Useful when both deterministic representations have already
// been computed or loaded from a future persistence boundary.
//
// No recomputation occurs here.
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
): ResolveReplayResult {

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    expectedSimilarityCandidateRepresentation,
    actualSimilarityCandidateRepresentation,
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
// Candidate representations are intentionally represented by
// the same deterministic empty sentinel on both sides so that
// the returned aggregate result describes ONLY this explicitly
// scoped manifold comparison.
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

  return createResolveReplayResult(
    expectedCanonicalRepresentation,
    actualCanonicalRepresentation,
    emptyCandidateRepresentation,
    emptyCandidateRepresentation,
  );

}

// ============================================================
// ASSERT VERIFIED REPLAY
// ============================================================
//
// Strict replay assertion for engineering verification and
// future integrity-sensitive computation paths.
//
// Throws if either deterministic Resolve product diverges.
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
      "Resolve deterministic replay verification failed: canonical computation or similarity candidate product diverged.",
    );

  }

}

// ============================================================
// END
// ============================================================