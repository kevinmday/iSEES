// ============================================================
// src/resolve/engine/ResolveEngine.ts
//
// P56D-D
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
//   • deterministic canonical candidate evaluations
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
// Candidate evaluation:
//
//                 E = q(C)
//
// Complete deterministic derivation:
//
//                 U -> M -> C -> E
//
// where:
//
//   U = canonical computational universe
//   M = deterministic computed world state
//   C = deterministic downstream candidate population
//   E = deterministic explanatory evaluation population
//
// Candidate derivation and candidate evaluation do NOT alter
// the governing manifold equation.
//
// Candidates are derived downstream from measurements already
// present in the canonical manifold.
//
// Evaluations are derived downstream from candidates.
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
//   candidateEvaluations(A) ≡ candidateEvaluations(A)
//   representation(A)       ≡ representation(A)
//   provenance(A)           ≡ provenance(A)
//
// The engine owns:
//
//   • deterministic computation
//   • canonical manifold construction
//   • canonical similarity candidate derivation
//   • canonical candidate evaluation
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
//   • Research Vector generation
//   • REX execution
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
  evaluateCanonicalSimilarityCandidates,
} from "../evaluation/CanonicalSimilarityCandidateEvaluator";

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
  //            ↓
  //   Candidate Evaluator
  //            ↓
  //   Candidate Evaluations
  //
  // More compactly:
  //
  //          U -> M -> C -> E
  //
  // Candidate generation consumes similarity measurements
  // already computed inside the canonical manifold.
  //
  // Candidate evaluation consumes candidates and their
  // authoritative similarity resolutions.
  //
  // Neither operation modifies the manifold or its canonical
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
    // Or:
    //
    //     C = h(M.similarityMatrix)
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
    // EVALUATE CANONICAL SIMILARITY CANDIDATES
    // --------------------------------------------------------
    //
    // Candidate evaluation occurs strictly downstream of
    // candidate generation:
    //
    //     similarityCandidates
    //            ↓
    //     candidateEvaluations
    //
    // Or:
    //
    //     E = q(C)
    //
    // Evaluation answers:
    //
    //     "Why did this candidate surface?"
    //
    // The evaluator consumes deterministic facts already
    // preserved by each candidate and its authoritative
    // similarity resolution.
    //
    // It does NOT:
    //
    //   • recompute similarity
    //   • alter candidate identity
    //   • alter Knowledge pair lineage
    //   • modify the manifold
    //   • modify topology
    //   • create a graph edge
    //   • assert a relationship
    //   • promote Knowledge
    //   • generate a Research Vector
    //   • execute REX
    //   • recommend a research action
    //   • perform AI inference
    //   • perform heuristic reasoning
    //
    // The epistemic boundary therefore remains:
    //
    //   measurement
    //      !=
    //   candidate
    //      !=
    //   evaluation
    //      !=
    //   relationship
    //      !=
    //   accepted Knowledge
    //
    // --------------------------------------------------------

    const candidateEvaluations =
      evaluateCanonicalSimilarityCandidates(
        similarityCandidates.candidates,
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
    // similarityCandidates and candidateEvaluations are sibling
    // deterministic products derived downstream from manifold
    // similarity state.
    //
    // They are deliberately NOT inserted into the manifold's
    // canonical representation at this stage.
    //
    // This allows complete-product replay to verify:
    //
    //   • manifold bytes
    //   • candidate product
    //   • evaluation product
    //
    // independently.
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
    // The product now contains three deliberately distinct
    // computational layers:
    //
    //   manifold
    //       = measured/computed canonical world state
    //
    //   similarityCandidates
    //       = downstream propositions made eligible by
    //         available similarity measurements
    //
    //   candidateEvaluations
    //       = deterministic explanatory state describing why
    //         those candidate propositions surfaced
    //
    // Neither a candidate nor an evaluation is a canonical
    // relationship.
    //
    // Neither is a topology edge.
    //
    // Neither is accepted Knowledge.
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

      candidateEvaluations,

      canonicalRepresentation,

      provenance,

    };

  }

}

// ============================================================
// END
// ============================================================