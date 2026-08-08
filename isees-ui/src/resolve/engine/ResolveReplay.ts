// ============================================================
// src/resolve/engine/ResolveReplay.ts
//
// P55B
// DETERMINISTIC RESOLVE REPLAY
//
// Provides first-class replay verification for canonical
// Resolve computation.
//
// PURPOSE
//
// A deterministic computational system must be able to prove:
//
//     equivalent canonical input
//              ↓
//           Resolve
//              ↓
//     equivalent canonical output
//
// Replay verification therefore compares the canonical
// computational representation produced by two executions.
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
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
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
// REPLAY BASELINE
// ============================================================
//
// A baseline is the deterministic computational representation
// against which a later execution is verified.
//
// This is intentionally NOT a runtime execution record.
//
// Runtime metadata does not belong in deterministic replay.
//
// ============================================================

export interface ResolveReplayBaseline {

  canonicalRepresentation: string;

}

// ============================================================
// REPLAY RESULT
// ============================================================

export interface ResolveReplayResult {

  status: ResolveReplayStatus;

  verified: boolean;

  expectedCanonicalRepresentation: string;

  actualCanonicalRepresentation: string;

}

// ============================================================
// CREATE REPLAY BASELINE
// ============================================================
//
// Executes the deterministic Resolve pipeline and captures the
// canonical result as a replay baseline.
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
//    Canonical Representation
//
// ============================================================

export function createResolveReplayBaseline(
  input: ResolveComputationInput,
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

  return {

    canonicalRepresentation:
      output.canonicalRepresentation,

  };

}

// ============================================================
// VERIFY REPLAY
// ============================================================
//
// Recomputes Resolve from supplied input and compares its
// canonical representation against the expected baseline.
//
// Byte equality is intentional.
//
// If canonical representations differ by even one byte, the
// computation is considered divergent.
//
// ============================================================

export function verifyResolveReplay(
  baseline: ResolveReplayBaseline,
  input: ResolveComputationInput,
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

  const verified =
    expectedCanonicalRepresentation ===
    actualCanonicalRepresentation;

  return {

    status:
      verified
        ? ResolveReplayStatus.VERIFIED
        : ResolveReplayStatus.DIVERGED,

    verified,

    expectedCanonicalRepresentation,

    actualCanonicalRepresentation,

  };

}

// ============================================================
// VERIFY REPRESENTATIONS DIRECTLY
// ============================================================
//
// Lower-level verification utility.
//
// Useful when both canonical representations have already been
// computed or loaded from a future persistence/provenance
// boundary.
//
// No recomputation occurs here.
//
// ============================================================

export function verifyCanonicalRepresentations(
  expectedCanonicalRepresentation: string,
  actualCanonicalRepresentation: string,
): ResolveReplayResult {

  const verified =
    expectedCanonicalRepresentation ===
    actualCanonicalRepresentation;

  return {

    status:
      verified
        ? ResolveReplayStatus.VERIFIED
        : ResolveReplayStatus.DIVERGED,

    verified,

    expectedCanonicalRepresentation,

    actualCanonicalRepresentation,

  };

}

// ============================================================
// ASSERT VERIFIED REPLAY
// ============================================================
//
// Strict replay assertion for engineering verification and
// future integrity-sensitive computation paths.
//
// Throws if deterministic replay diverges.
//
// ============================================================

export function assertResolveReplayVerified(
  result: ResolveReplayResult,
): void {

  if (
    result.status !==
      ResolveReplayStatus.VERIFIED
  ) {

    throw new Error(
      "Resolve deterministic replay verification failed: canonical computation diverged.",
    );

  }

}

// ============================================================
// END
// ============================================================