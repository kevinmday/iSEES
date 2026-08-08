// ============================================================
// src/resolve/engine/CanonicalUniverse.ts
//
// P55B
// CANONICAL COMPUTATIONAL UNIVERSE
//
// Constructs the deterministic Computational Universe consumed
// by the Resolve Engine.
//
// PURPOSE
//
// Runtime input may arrive in arbitrary collection order.
//
// Resolve computation MUST NOT depend upon:
//
//   • insertion order
//   • collection order
//   • UI order
//   • runtime traversal order
//
// This module establishes canonical ordering before computation.
//
// GOVERNING COMPUTATION
//
//                 M = g(L,T,S)
//
// where:
//
//   L = active computational layers
//   T = temporal context
//   S = investigative scale
//
// The Computational Universe supplies the deterministic source
// state from which that computation proceeds.
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
  CanonicalComputationalUniverse,
} from "./ResolveEngineTypes";

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

// ============================================================
// STRING COMPARATOR
// ============================================================
//
// Explicit comparator used instead of localeCompare().
//
// localeCompare() may vary according to locale/runtime behavior.
//
// Canonical computation requires a simple deterministic lexical
// ordering independent of user locale.
//
// ============================================================

function compareCanonicalStrings(
  left: string,
  right: string,
): number {

  if (left < right) {

    return -1;

  }

  if (left > right) {

    return 1;

  }

  return 0;

}

// ============================================================
// KNOWLEDGE OBJECT COMPARATOR
// ============================================================
//
// KnowledgeObject identity is canonically defined by:
//
//     object.identity.id
//
// ============================================================

function compareKnowledgeObjects(
  left: KnowledgeObject,
  right: KnowledgeObject,
): number {

  return compareCanonicalStrings(
    left.identity.id,
    right.identity.id,
  );

}

// ============================================================
// CANONICALIZE KNOWLEDGE OBJECTS
// ============================================================
//
// Never sort the runtime-owned array directly.
//
// A new array is created so canonicalization does not mutate
// Knowledge Runtime state.
//
// ============================================================

function canonicalizeKnowledgeObjects(
  knowledgeObjects: readonly KnowledgeObject[],
): readonly KnowledgeObject[] {

  return [
    ...knowledgeObjects,
  ].sort(
    compareKnowledgeObjects,
  );

}

// ============================================================
// CANONICALIZE ACTIVE LAYERS
// ============================================================
//
// Active layer ordering is computationally irrelevant.
//
// Therefore layers are sorted into deterministic lexical order.
//
// Duplicate layers are removed because computational activation
// is set-like:
//
//     layer active = true | false
//
// Repeated activation of the same layer must not alter M.
//
// ============================================================

function canonicalizeActiveLayers(
  activeLayers: readonly string[],
): readonly string[] {

  const uniqueLayers =
    new Set(
      activeLayers,
    );

  return [
    ...uniqueLayers,
  ].sort(
    compareCanonicalStrings,
  );

}

// ============================================================
// VALIDATE INVESTIGATION IDENTITY
// ============================================================

function validateInvestigationId(
  investigationId: string,
): void {

  if (
    investigationId.trim().length === 0
  ) {

    throw new Error(
      "Resolve canonicalization requires a non-empty investigation ID.",
    );

  }

}

// ============================================================
// VALIDATE KNOWLEDGE IDENTITIES
// ============================================================
//
// Deterministic ordering requires every participating Knowledge
// Object to possess a canonical identity.
//
// Duplicate identities are rejected.
//
// Silently accepting duplicate IDs would make provenance and
// replay ambiguous.
//
// ============================================================

function validateKnowledgeObjects(
  knowledgeObjects: readonly KnowledgeObject[],
): void {

  const identities =
    new Set<string>();

  for (
    const knowledgeObject
    of knowledgeObjects
  ) {

    const id =
      knowledgeObject.identity.id;

    if (
      id.trim().length === 0
    ) {

      throw new Error(
        "Resolve canonicalization requires every Knowledge Object to have a non-empty identity.id.",
      );

    }

    if (
      identities.has(id)
    ) {

      throw new Error(
        `Resolve canonicalization encountered duplicate Knowledge Object identity: ${id}`,
      );

    }

    identities.add(id);

  }

}

// ============================================================
// BUILD CANONICAL COMPUTATIONAL UNIVERSE
// ============================================================
//
// This is the canonical Runtime → Engine boundary.
//
// Runtime state enters here.
//
// Deterministically ordered computational state leaves here.
//
// The resulting object contains NO:
//
//   • execution ID
//   • execution timestamp
//   • runtime status
//   • history
//   • revision counter
//
// Those belong exclusively to Resolve Runtime.
//
// ============================================================

export function buildCanonicalComputationalUniverse(
  input: ResolveComputationInput,
): CanonicalComputationalUniverse {

  // ----------------------------------------------------------
  // Validate canonical identity
  // ----------------------------------------------------------

  validateInvestigationId(
    input.investigation.id,
  );

  validateKnowledgeObjects(
    input.knowledgeObjects,
  );

  // ----------------------------------------------------------
  // Canonicalize computational collections
  // ----------------------------------------------------------

  const knowledgeObjects =
    canonicalizeKnowledgeObjects(
      input.knowledgeObjects,
    );

  const activeLayers =
    canonicalizeActiveLayers(
      input.activeLayers,
    );

  // ----------------------------------------------------------
  // Construct Computational Universe
  //
  // IMPORTANT:
  //
  // temporalContext and investigativeScale remain opaque here.
  //
  // Their internal canonical representations belong to later
  // mathematical realization work. P55B must not invent those
  // semantics merely to serialize them.
  // ----------------------------------------------------------

  const universe: CanonicalComputationalUniverse = {

    investigationId:
      input.investigation.id,

    investigation:
      input.investigation,

    knowledgeObjects,

    activeLayers,

    temporalContext:
      input.temporalContext,

    investigativeScale:
      input.investigativeScale,

  };

  return universe;

}

// ============================================================
// EXTRACT CANONICAL KNOWLEDGE OBJECT IDS
// ============================================================
//
// Utility used by manifold construction.
//
// Because the Computational Universe has already been
// canonicalized, identifier order is deterministic.
//
// ============================================================

export function getCanonicalKnowledgeObjectIds(
  universe: CanonicalComputationalUniverse,
): readonly string[] {

  return universe.knowledgeObjects.map(
    (knowledgeObject) =>
      knowledgeObject.identity.id,
  );

}

// ============================================================
// END
// ============================================================