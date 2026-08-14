// ============================================================
// src/resolve/engine/ResolveEngine.ts
//
// P56D-C
// RESOLVE ENGINE
//
// Canonical deterministic computation engine.
//
// The Resolve Engine owns computational truth.
//
// It receives a Canonical Computational Universe and produces:
//
//   • a deterministic Canonical Manifold
//   • deterministic canonical similarity candidates
//   • a canonical computational representation
//   • validated deterministic computational provenance
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// Candidate derivation:
//
//                 C = h(M.similarityMatrix)
//
// where:
//
//   M = deterministic computed world state
//   C = deterministic downstream candidate population
//
// Candidate derivation does NOT alter the governing manifold
// equation. Candidates are derived downstream from measurements
// already present in the canonical manifold.
//
// ENGINE INVARIANT
//
//   equivalent canonical input
//            ↓
//   equivalent deterministic output
//
// Therefore:
//
//   manifold(A)             ≡ manifold(A)
//   similarityCandidates(A) ≡ similarityCandidates(A)
//   representation(A)       ≡ representation(A)
//   provenance(A)           ≡ provenance(A)
//
// The engine owns:
//
//   • deterministic computation
//   • canonical manifold construction
//   • canonical similarity candidate derivation
//   • canonical result serialization
//   • computational provenance
//   • computational lineage validation
//
// The engine explicitly does NOT own:
//
//   • execution identity
//   • timestamps
//   • runtime lifecycle
//   • runtime history
//   • runtime revision
//   • React
//   • UI
//   • graph rendering
//   • persistence
//   • networking
//   • AI inference
//   • heuristic reasoning
//
// No clocks.
// No random values.
// No external mutable state.
//
// ============================================================

import type {
  ResolveEngineContract,
  ResolveEngineInput,
  ResolveEngineOutput,
} from "./ResolveEngineTypes";

import {
  computeCanonicalManifoldRepresentation,
} from "./CanonicalManifold";

import {
  generateCanonicalSimilarityCandidates,
} from "../candidates/CanonicalSimilarityCandidateGenerator";

import {
  createResolveProvenance,
} from "./ResolveProvenance";

// ============================================================
// ENGINE
// ============================================================

export class ResolveEngine
implements ResolveEngineContract {

  // ==========================================================
  // EXECUTE
  // ==========================================================
  //
  // Pure deterministic computation:
  //
  //     Canonical Computational Universe
  //                  ↓
  //              g(L,T,S)
  //                  ↓
  //          Canonical Manifold
  //             ↙          ↘
  //            ↓            ↓
  //   Similarity Matrix   Canonical
  //            ↓          Representation
  //   Candidate Generator     ↓
  //            ↓          Computational
  //   Similarity Candidates  Provenance
  //
  // Candidate generation consumes similarity measurements
  // already computed inside the canonical manifold.
  //
  // It does not modify the manifold or its canonical
  // representation.
  //
  // No runtime metadata is introduced anywhere in this path.
  //
  // ==========================================================

  execute(
    input: ResolveEngineInput,
  ): ResolveEngineOutput {

    // --------------------------------------------------------
    // COMPUTE MANIFOLD
    // --------------------------------------------------------
    //
    // The canonical universe has already crossed the
    // Runtime → Engine canonicalization boundary.
    //
    // g(L,T,S) therefore operates exclusively on canonical
    // computational state.
    //
    // Canonical similarity is computed as part of manifold
    // construction and survives inside:
    //
    //     manifold.similarityMatrix
    //
    // --------------------------------------------------------

    const {
      manifold,
      canonicalRepresentation,
    } =
      computeCanonicalManifoldRepresentation(
        input.universe,
      );

    // --------------------------------------------------------
    // GENERATE CANONICAL SIMILARITY CANDIDATES
    // --------------------------------------------------------
    //
    // Candidate generation occurs strictly downstream of the
    // canonical manifold similarity computation.
    //
    //     CanonicalManifold
    //            ↓
    //     similarityMatrix
    //            ↓
    //     similarityCandidates
    //
    // The candidate generator consumes the already-computed
    // canonical similarity matrix.
    //
    // It does NOT:
    //
    //   • recompute similarity
    //   • apply a numerical threshold
    //   • rank candidates by score
    //   • create Knowledge relationships
    //   • create topology edges
    //   • mutate Knowledge
    //   • mutate topology
    //   • mutate the manifold
    //   • perform causal inference
    //   • perform AI inference
    //
    // Candidate eligibility means only:
    //
    //     AVAILABLE aggregate similarity
    //                  ↓
    //             one candidate
    //
    // Therefore:
    //
    //     AVAILABLE score 0
    //
    // remains candidate-eligible.
    //
    // Whereas:
    //
    //     UNAVAILABLE aggregate
    //
    // produces no candidate.
    //
    // Candidate generation is therefore availability-based,
    // not magnitude-based.
    //
    // --------------------------------------------------------

    const similarityCandidates =
      generateCanonicalSimilarityCandidates(
        manifold.similarityMatrix,
      );

    // --------------------------------------------------------
    // COMPUTE PROVENANCE
    // --------------------------------------------------------
    //
    // Provenance is created INSIDE the deterministic engine
    // boundary.
    //
    // This is important:
    //
    // provenance is not metadata attached later by runtime.
    //
    // It is part of the deterministic computational result and
    // describes the validated lineage:
    //
    //   universe
    //      ↓
    //   manifold
    //      ↓
    //   canonical representation
    //
    // similarityCandidates are a sibling deterministic product
    // derived from manifold similarity state.
    //
    // They are deliberately NOT inserted into the manifold's
    // canonical representation at this stage.
    //
    // createResolveProvenance() validates that the manifold
    // remains consistent with its source universe before the
    // provenance record can exist.
    //
    // --------------------------------------------------------

    const provenance =
      createResolveProvenance({

        universe:
          input.universe,

        manifold,

        canonicalRepresentation,

      });

    // --------------------------------------------------------
    // DETERMINISTIC ENGINE PRODUCT
    // --------------------------------------------------------
    //
    // Every property returned here is deterministic.
    //
    // The product now contains two deliberately distinct
    // computational layers:
    //
    //   manifold
    //       = measured/computed canonical world state
    //
    //   similarityCandidates
    //       = downstream propositions made eligible by
    //         available similarity measurements
    //
    // A candidate is NOT a canonical relationship.
    // A candidate is NOT a topology edge.
    // A candidate is NOT an accepted proposition.
    //
    // There are deliberately no:
    //
    //   • UUIDs
    //   • timestamps
    //   • runtime revisions
    //   • lifecycle states
    //   • random values
    //
    // --------------------------------------------------------

    return {

      manifold,

      similarityCandidates,

      canonicalRepresentation,

      provenance,

    };

  }

}

// ============================================================
// END
// ============================================================