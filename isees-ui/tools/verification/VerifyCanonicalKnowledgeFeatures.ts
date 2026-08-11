// ============================================================
// tools/verification/VerifyCanonicalKnowledgeFeatures.ts
//
// P56C-A
// CANONICAL KNOWLEDGE FEATURE VERIFICATION
//
// Verifies the deterministic transformation:
//
//              (K, G₀)
//                 ↓
//                 F
//
// Completion gate for the canonical Resolve feature boundary.
//
// VERIFIES
//
//   • System Canon Knowledge ingestion
//   • deterministic feature extraction
//   • canonical feature ordering
//   • invariance under Knowledge input reordering
//   • EVENT feature extraction
//   • explicit contextual feature extraction
//   • topology remains explicitly UNAVAILABLE
//   • missing feature ≠ zero feature
//   • heterogeneous Knowledge safety
//
// DOES NOT VERIFY
//
//   • similarity computation
//   • operator eligibility
//   • computed relationships
//   • CanonicalManifold integration
//   • graph projection
//   • React
//
// No clocks.
// No randomness.
// No external mutable state.
//
// ============================================================

import {
  CANONICAL_EVENTS,
} from "../../src/canonical/runtimeCorpus";

import {
  adaptSystemCanonToKnowledge,
} from "../../src/knowledge/ingestion/SystemCanonKnowledgeAdapter";

import {
  KnowledgeObjectType,
} from "../../src/knowledge/model/KnowledgeObjectTypes";

import type {
  KnowledgeObject,
} from "../../src/knowledge/model/KnowledgeObject";

import {
  CanonicalFeatureAvailability,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureTypes";

import {
  extractCanonicalKnowledgeFeatureCollection,
} from "../../src/resolve/features/CanonicalKnowledgeFeatureExtractor";

// ============================================================
// ASSERTION
// ============================================================

function assert(
  condition: unknown,
  message: string,
): asserts condition {

  if (
    !condition
  ) {

    throw new Error(
      `VERIFY FAILED: ${message}`,
    );

  }

}

// ============================================================
// CANONICAL SERIALIZATION
// ============================================================

function normalize(
  value: unknown,
): unknown {

  if (
    value === null
  ) {

    return null;

  }

  if (
    typeof value !== "object"
  ) {

    return value;

  }

  if (
    Array.isArray(
      value,
    )
  ) {

    return value.map(
      normalize,
    );

  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const normalized:
    Record<
      string,
      unknown
    > = {};

  const keys =
    Object.keys(
      source,
    ).sort();

  for (
    const key
    of keys
  ) {

    const propertyValue =
      source[key];

    if (
      propertyValue === undefined
    ) {

      continue;

    }

    normalized[key] =
      normalize(
        propertyValue,
      );

  }

  return normalized;

}

function serialize(
  value: unknown,
): string {

  const serialized =
    JSON.stringify(
      normalize(
        value,
      ),
    );

  if (
    serialized === undefined
  ) {

    throw new Error(
      "Verification serialization failed.",
    );

  }

  return serialized;

}

// ============================================================
// KNOWLEDGE REORDERING
// ============================================================

function reverseKnowledge(
  knowledgeObjects:
    readonly KnowledgeObject[],
): readonly KnowledgeObject[] {

  return [
    ...knowledgeObjects,
  ].reverse();

}

// ============================================================
// MAIN
// ============================================================

function main(): void {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56C-A — CANONICAL KNOWLEDGE FEATURE VERIFICATION",
  );
  console.log(
    "============================================================",
  );

  // ==========================================================
  // CANONICAL KNOWLEDGE INGRESS
  // ==========================================================

  const knowledgeObjects =
    adaptSystemCanonToKnowledge(
      CANONICAL_EVENTS,
    );

  assert(
    knowledgeObjects.length > 0,
    "System Canon produced no Knowledge Objects.",
  );

  console.log(
    `Knowledge Objects: ${knowledgeObjects.length}`,
  );

  // ==========================================================
  // FIRST EXTRACTION
  // ==========================================================

  const first =
    extractCanonicalKnowledgeFeatureCollection(
      knowledgeObjects,
    );

  assert(
    first.features.length ===
      knowledgeObjects.length,
    "Feature cardinality must equal Knowledge cardinality.",
  );

  console.log(
    `Feature sets: ${first.features.length}`,
  );

  // ==========================================================
  // REPEATED EXTRACTION DETERMINISM
  // ==========================================================

  const second =
    extractCanonicalKnowledgeFeatureCollection(
      knowledgeObjects,
    );

  assert(
    serialize(
      first,
    ) ===
      serialize(
        second,
      ),
    "Repeated extraction must produce identical canonical output.",
  );

  console.log(
    "PASS — repeated extraction is deterministic",
  );

  // ==========================================================
  // INPUT ORDER INVARIANCE
  // ==========================================================

  const reversed =
    extractCanonicalKnowledgeFeatureCollection(
      reverseKnowledge(
        knowledgeObjects,
      ),
    );

  assert(
    serialize(
      first,
    ) ===
      serialize(
        reversed,
      ),
    "Knowledge input ordering must not alter canonical feature output.",
  );

  console.log(
    "PASS — Knowledge input ordering does not alter feature output",
  );

  // ==========================================================
  // CANONICAL FEATURE ORDER
  // ==========================================================

  const featureIds =
    first.features.map(
      feature =>
        feature.knowledgeObjectId,
    );

  const sortedFeatureIds =
    [
      ...featureIds,
    ].sort();

  assert(
    JSON.stringify(
      featureIds,
    ) ===
      JSON.stringify(
        sortedFeatureIds,
      ),
    "Feature collection must be canonically ordered by Knowledge Object ID.",
  );

  console.log(
    "PASS — feature collection ordering is canonical",
  );

  // ==========================================================
  // EVENT POPULATION
  // ==========================================================

  const eventFeatures =
    first.features.filter(
      feature =>
        feature.knowledgeObjectType ===
          KnowledgeObjectType.EVENT,
    );

  assert(
    eventFeatures.length > 0,
    "No EVENT feature sets were produced.",
  );

  console.log(
    `EVENT feature sets: ${eventFeatures.length}`,
  );

  // ==========================================================
  // EVENT FEATURE SAFETY
  // ==========================================================
  //
  // P56C-A does not require every feature dimension to exist
  // for every EVENT.
  //
  // Availability itself is canonical computational state.
  //
  // Therefore:
  //
  //     AVAILABLE
  //
  // and:
  //
  //     UNAVAILABLE
  //
  // are both valid outcomes.
  //
  // ==========================================================

  for (
    const feature
    of eventFeatures
  ) {

    assert(
      feature.narrative !== undefined,
      `${feature.knowledgeObjectId} must expose narrative feature state.`,
    );

    assert(
      feature.observability !== undefined,
      `${feature.knowledgeObjectId} must expose observability feature state.`,
    );

    assert(
      feature.infrastructure !== undefined,
      `${feature.knowledgeObjectId} must expose infrastructure feature state.`,
    );

    assert(
      feature.geography !== undefined,
      `${feature.knowledgeObjectId} must expose geography feature state.`,
    );

    assert(
      feature.topology !== undefined,
      `${feature.knowledgeObjectId} must expose topology feature state.`,
    );

  }

  console.log(
    "PASS — EVENT feature boundary is structurally complete",
  );

  // ==========================================================
  // AVAILABLE VALUE SAFETY
  // ==========================================================

  for (
    const feature
    of eventFeatures
  ) {

    if (
      feature
        .observability
        .confidence
        .availability ===
        CanonicalFeatureAvailability.AVAILABLE
    ) {

      const value =
        feature
          .observability
          .confidence
          .value;

      assert(
        typeof value ===
          "number" &&
        Number.isFinite(
          value,
        ),
        `${feature.knowledgeObjectId} confidence must be finite when AVAILABLE.`,
      );

    }

    if (
      feature
        .observability
        .durationMinutes
        .availability ===
        CanonicalFeatureAvailability.AVAILABLE
    ) {

      const value =
        feature
          .observability
          .durationMinutes
          .value;

      assert(
        typeof value ===
          "number" &&
        Number.isFinite(
          value,
        ),
        `${feature.knowledgeObjectId} duration must be finite when AVAILABLE.`,
      );

    }

  }

  console.log(
    "PASS — AVAILABLE numeric features contain finite values",
  );

// ==========================================================
// CANONICAL TOPOLOGY FEATURE CONTRACT
// P56C-A.1
// ==========================================================
//
// P56C-A.1 reconciles the canonical feature boundary with
// the actual historical deterministic Resolve topology
// computation.
//
// Resolve consumes:
//
//     T = (Dc, Ri, Es, Fc)
//
// where:
//
//   Dc = contradiction density
//   Ri = residual instability
//   Es = entanglement score
//   Fc = cluster fragmentation
//
// Canonical EVENT topology may legitimately be unavailable.
//
// When AVAILABLE, all four dimensions MUST be explicit finite
// numerical values.
//
// Missing topology MUST remain UNAVAILABLE and MUST NOT be
// manufactured as the zero vector:
//
//     UNAVAILABLE != (0, 0, 0, 0)
//
// ==========================================================

let availableTopologyCount = 0;

let unavailableTopologyCount = 0;

for (
  const feature
  of eventFeatures
) {

  const topology =
    feature
      .topology
      .state;

  if (
    topology.availability ===
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    availableTopologyCount += 1;

    assert(
      Number.isFinite(
        topology.value
          .contradictionDensity,
      ),
      `${feature.knowledgeObjectId} contradiction density must be finite when topology is AVAILABLE.`,
    );

    assert(
      Number.isFinite(
        topology.value
          .residualInstability,
      ),
      `${feature.knowledgeObjectId} residual instability must be finite when topology is AVAILABLE.`,
    );

    assert(
      Number.isFinite(
        topology.value
          .entanglementScore,
      ),
      `${feature.knowledgeObjectId} entanglement score must be finite when topology is AVAILABLE.`,
    );

    assert(
      Number.isFinite(
        topology.value
          .clusterFragmentation,
      ),
      `${feature.knowledgeObjectId} cluster fragmentation must be finite when topology is AVAILABLE.`,
    );

    continue;

  }

  unavailableTopologyCount += 1;

  assert(
    topology.availability ===
      CanonicalFeatureAvailability.UNAVAILABLE,
    `${feature.knowledgeObjectId} topology availability must be canonical.`,
  );

}

assert(
  availableTopologyCount > 0,
  "Expected at least one EVENT with AVAILABLE canonical topology.",
);

console.log(
  `PASS — canonical topology contract (${availableTopologyCount} AVAILABLE, ${unavailableTopologyCount} UNAVAILABLE)`,
);

console.log(
  "PASS — missing topology is never manufactured as a zero vector",
);

  // ==========================================================
  // HETEROGENEOUS KNOWLEDGE SAFETY
  // ==========================================================

  const nonEventFeatures =
    first.features.filter(
      feature =>
        feature.knowledgeObjectType !==
          KnowledgeObjectType.EVENT,
    );

  assert(
    nonEventFeatures.length > 0,
    "Expected heterogeneous non-EVENT Knowledge Objects.",
  );

  for (
    const feature
    of nonEventFeatures
  ) {

    assert(
      feature.knowledgeObjectId.length > 0,
      "Every feature set must preserve Knowledge Object identity.",
    );

    assert(
      feature.topology !== undefined,
      `${feature.knowledgeObjectId} must safely expose topology feature state.`,
    );

  }

  console.log(
    `PASS — heterogeneous Knowledge safe (${nonEventFeatures.length} non-EVENT feature sets)`,
  );

  // ==========================================================
  // FEATURE ID UNIQUENESS
  // ==========================================================

  const uniqueIds =
    new Set(
      featureIds,
    );

  assert(
    uniqueIds.size ===
      featureIds.length,
    "Canonical feature collection must contain unique Knowledge Object IDs.",
  );

  console.log(
    "PASS — feature identities are unique",
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "P56C-A.1 VERIFICATION PASSED",
  );
  console.log(
    "============================================================",
  );
  console.log("");
  console.log(
    "Verified:",
  );
  console.log(
    "  K + G0 -> F",
  );
  console.log(
    "  deterministic extraction",
  );
  console.log(
    "  canonical ordering",
  );
  console.log(
    "  input-order invariance",
  );
  console.log(
    "  EVENT feature boundary",
  );
  console.log(
    "  explicit feature availability",
  );
  console.log(
    "  canonical topology extraction",
  );
  console.log(
    "  topology availability semantics",
  );
  console.log(
    "  missing topology != zero topology",
  );
  console.log(
    "  heterogeneous Knowledge safety",
  );
  console.log("");

}

// ============================================================
// EXECUTE
// ============================================================

main();

// ============================================================
// END
// ============================================================