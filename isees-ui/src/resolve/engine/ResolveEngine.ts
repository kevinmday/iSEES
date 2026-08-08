// ============================================================
// src/resolve/engine/ResolveEngine.ts
//
// P55B
// RESOLVE ENGINE
//
// Canonical deterministic computation engine.
//
// The Resolve Engine owns computational truth.
//
// It receives a Canonical Computational Universe and produces:
//
//   • a deterministic Canonical Manifold
//   • a canonical computational representation
//   • validated deterministic computational provenance
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// ENGINE INVARIANT
//
//   equivalent canonical input
//            ↓
//   equivalent deterministic output
//
// Therefore:
//
//   manifold(A)       ≡ manifold(A)
//   representation(A) ≡ representation(A)
//   provenance(A)     ≡ provenance(A)
//
// The engine owns:
//
//   • deterministic computation
//   • canonical manifold construction
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
  //                  ↓
  //       Canonical Representation
  //                  ↓
  //       Computational Provenance
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
    // --------------------------------------------------------

    const {
      manifold,
      canonicalRepresentation,
    } =
      computeCanonicalManifoldRepresentation(
        input.universe,
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
    // There are deliberately no:
    //
    //   • UUIDs
    //   • timestamps
    //   • runtime revisions
    //   • lifecycle states
    //
    // --------------------------------------------------------

    return {

      manifold,

      canonicalRepresentation,

      provenance,

    };

  }

}

// ============================================================
// END
// ============================================================