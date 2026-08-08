// ============================================================
// src/resolve/engine/ResolveProvenance.ts
//
// P55B
// DETERMINISTIC RESOLVE PROVENANCE
//
// Canonical computational provenance for Resolve-Dissolve
// Computation.
//
// PURPOSE
//
// A computed manifold must be able to describe:
//
//   • which investigation produced it
//   • which Knowledge Objects participated
//   • which computational layers were active
//   • which temporal context participated
//   • which investigative scale participated
//   • which governing equation produced the manifold
//   • which engine contract produced the result
//   • what canonical computational representation resulted
//
// CRITICAL ARCHITECTURAL DISTINCTION
//
// Computational provenance is NOT execution history.
//
// Computational provenance describes:
//
//       WHAT COMPUTATION PRODUCED THIS RESULT?
//
// Runtime execution history describes:
//
//       WHEN / WHERE / UNDER WHICH EXECUTION DID IT RUN?
//
// Therefore deterministic provenance MUST NOT contain:
//
//   • execution UUIDs
//   • wall-clock timestamps
//   • runtime status
//   • runtime revision counters
//   • UI state
//   • random values
//
// Equivalent canonical computation MUST produce equivalent
// provenance.
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

import {
  RESOLVE_GOVERNING_EQUATION,
} from "./ResolveEngineTypes";

import type {
  CanonicalComputationalUniverse,
  CanonicalManifold,
  ResolveGoverningEquation,
} from "./ResolveEngineTypes";

// ============================================================
// ENGINE CONTRACT VERSION
// ============================================================
//
// This identifies the deterministic computational contract.
//
// It is intentionally NOT:
//
//   • application version
//   • Git commit
//   • runtime revision
//   • execution revision
//
// Any future change that alters the canonical meaning of
// Resolve computation should deliberately advance this value.
//
// ============================================================

export const RESOLVE_ENGINE_CONTRACT_VERSION =
  "P55B.1" as const;

export type ResolveEngineContractVersion =
  typeof RESOLVE_ENGINE_CONTRACT_VERSION;

// ============================================================
// PROVENANCE TYPE
// ============================================================

export interface ResolveProvenance {

  // ----------------------------------------------------------
  // Deterministic engine identity
  // ----------------------------------------------------------

  engineContractVersion:
    ResolveEngineContractVersion;

  // ----------------------------------------------------------
  // Governing computation
  // ----------------------------------------------------------

  governingEquation:
    ResolveGoverningEquation;

  // ----------------------------------------------------------
  // Investigation identity
  // ----------------------------------------------------------

  investigationId:
    string;

  // ----------------------------------------------------------
  // Participating Knowledge Objects
  //
  // These identifiers MUST already be canonically ordered.
  // ----------------------------------------------------------

  knowledgeObjectIds:
    readonly string[];

  // ----------------------------------------------------------
  // L — Active computational layers
  //
  // These MUST already be canonically ordered and deduplicated.
  // ----------------------------------------------------------

  activeLayers:
    readonly string[];

  // ----------------------------------------------------------
  // T — Temporal computational context
  // ----------------------------------------------------------

  temporalContext:
    unknown;

  // ----------------------------------------------------------
  // S — Investigative scale
  // ----------------------------------------------------------

  investigativeScale:
    unknown;

  // ----------------------------------------------------------
  // Canonical computational result
  //
  // This is the deterministic byte-comparable representation
  // of the resulting manifold.
  // ----------------------------------------------------------

  canonicalRepresentation:
    string;

}

// ============================================================
// PROVENANCE INPUT
// ============================================================
//
// Provenance is derived from already-canonical computational
// state.
//
// Runtime input must not be accepted here directly.
//
// ============================================================

export interface ResolveProvenanceInput {

  universe:
    CanonicalComputationalUniverse;

  manifold:
    CanonicalManifold;

  canonicalRepresentation:
    string;

}

// ============================================================
// VALIDATE MANIFOLD / UNIVERSE IDENTITY
// ============================================================
//
// A provenance record may only describe a manifold belonging
// to the same canonical investigation universe.
//
// ============================================================

function validateInvestigationIdentity(
  universe: CanonicalComputationalUniverse,
  manifold: CanonicalManifold,
): void {

  if (
    universe.investigationId !==
    manifold.investigationId
  ) {

    throw new Error(
      "Resolve provenance cannot be created from mismatched universe and manifold investigation identities.",
    );

  }

}

// ============================================================
// VALIDATE GOVERNING EQUATION
// ============================================================
//
// Prevents provenance from silently describing a manifold
// produced under a different computational equation contract.
//
// ============================================================

function validateGoverningEquation(
  manifold: CanonicalManifold,
): void {

  if (
    manifold.equation !==
    RESOLVE_GOVERNING_EQUATION
  ) {

    throw new Error(
      "Resolve provenance encountered an unsupported governing equation.",
    );

  }

}

// ============================================================
// VALIDATE KNOWLEDGE POPULATION
// ============================================================
//
// The canonical manifold must describe exactly the same
// Knowledge Object population as its source universe.
//
// Because the universe is canonicalized before computation,
// direct ordered comparison is deterministic.
//
// ============================================================

function validateKnowledgePopulation(
  universe: CanonicalComputationalUniverse,
  manifold: CanonicalManifold,
): void {

  const universeKnowledgeObjectIds =
    universe.knowledgeObjects.map(
      (knowledgeObject) =>
        knowledgeObject.identity.id,
    );

  if (
    universeKnowledgeObjectIds.length !==
    manifold.knowledgeObjectIds.length
  ) {

    throw new Error(
      "Resolve provenance cannot be created from mismatched Knowledge Object populations.",
    );

  }

  for (
    let index = 0;
    index < universeKnowledgeObjectIds.length;
    index += 1
  ) {

    if (
      universeKnowledgeObjectIds[index] !==
      manifold.knowledgeObjectIds[index]
    ) {

      throw new Error(
        "Resolve provenance cannot be created from mismatched Knowledge Object populations.",
      );

    }

  }

}

// ============================================================
// VALIDATE ACTIVE LAYERS
// ============================================================
//
// The manifold's L dimension must correspond exactly to the
// canonical universe's active layer state.
//
// ============================================================

function validateActiveLayers(
  universe: CanonicalComputationalUniverse,
  manifold: CanonicalManifold,
): void {

  if (
    universe.activeLayers.length !==
    manifold.layers.length
  ) {

    throw new Error(
      "Resolve provenance cannot be created from mismatched active computational layers.",
    );

  }

  for (
    let index = 0;
    index < universe.activeLayers.length;
    index += 1
  ) {

    if (
      universe.activeLayers[index] !==
      manifold.layers[index]
    ) {

      throw new Error(
        "Resolve provenance cannot be created from mismatched active computational layers.",
      );

    }

  }

}

// ============================================================
// CREATE RESOLVE PROVENANCE
// ============================================================
//
// Creates deterministic computational lineage for a canonical
// Resolve result.
//
// Pipeline:
//
//   Canonical Computational Universe
//                 +
//        Canonical Manifold
//                 +
//     Canonical Representation
//                 ↓
//       Resolve Provenance
//
// No runtime metadata is introduced.
//
// ============================================================

export function createResolveProvenance(
  input: ResolveProvenanceInput,
): ResolveProvenance {

  const {
    universe,
    manifold,
    canonicalRepresentation,
  } = input;

  // ----------------------------------------------------------
  // Validate computational lineage
  // ----------------------------------------------------------

  validateInvestigationIdentity(
    universe,
    manifold,
  );

  validateGoverningEquation(
    manifold,
  );

  validateKnowledgePopulation(
    universe,
    manifold,
  );

  validateActiveLayers(
    universe,
    manifold,
  );

  // ----------------------------------------------------------
  // Validate canonical representation presence
  // ----------------------------------------------------------

  if (
    canonicalRepresentation.length === 0
  ) {

    throw new Error(
      "Resolve provenance requires a canonical computational representation.",
    );

  }

  // ----------------------------------------------------------
  // Construct deterministic provenance
  // ----------------------------------------------------------

  return {

    engineContractVersion:
      RESOLVE_ENGINE_CONTRACT_VERSION,

    governingEquation:
      RESOLVE_GOVERNING_EQUATION,

    investigationId:
      universe.investigationId,

    knowledgeObjectIds:
      [
        ...manifold.knowledgeObjectIds,
      ],

    activeLayers:
      [
        ...manifold.layers,
      ],

    temporalContext:
      manifold.temporalContext,

    investigativeScale:
      manifold.investigativeScale,

    canonicalRepresentation,

  };

}

// ============================================================
// PROVENANCE EQUIVALENCE
// ============================================================
//
// Determines whether two provenance records describe the same
// deterministic computational result.
//
// Runtime metadata cannot affect this comparison because it is
// structurally absent from ResolveProvenance.
//
// ============================================================

export function areResolveProvenanceEquivalent(
  left: ResolveProvenance,
  right: ResolveProvenance,
): boolean {

  if (
    left.engineContractVersion !==
    right.engineContractVersion
  ) {

    return false;

  }

  if (
    left.governingEquation !==
    right.governingEquation
  ) {

    return false;

  }

  if (
    left.investigationId !==
    right.investigationId
  ) {

    return false;

  }

  if (
    left.canonicalRepresentation !==
    right.canonicalRepresentation
  ) {

    return false;

  }

  return true;

}

// ============================================================
// ASSERT PROVENANCE EQUIVALENCE
// ============================================================

export function assertResolveProvenanceEquivalent(
  left: ResolveProvenance,
  right: ResolveProvenance,
): void {

  if (
    !areResolveProvenanceEquivalent(
      left,
      right,
    )
  ) {

    throw new Error(
      "Resolve provenance equivalence verification failed: deterministic computational lineage diverged.",
    );

  }

}

// ============================================================
// END
// ============================================================