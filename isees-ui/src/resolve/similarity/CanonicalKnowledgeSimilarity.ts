// ============================================================
// src/resolve/similarity/CanonicalKnowledgeSimilarity.ts
//
// P56C-B
// CANONICAL KNOWLEDGE SIMILARITY
//
// Deterministic, availability-aware similarity computation
// over CanonicalKnowledgeFeatureSet.
//
// Computational boundary:
//
//        F_i + F_j
//             ↓
//       C(F_i, F_j)
//             ↓
//            S_ij
//
// IMPORTANT:
//
//   UNAVAILABLE != 0
//
// No legacy CorpusEvent.
// No CanonicalReplayEvent.
// No React.
// No persistence.
// No networking.
// No AI.
// No clocks.
// No randomness.
//
// ============================================================

import {
  CanonicalFeatureAvailability,
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

import type {
  CanonicalFeatureValue,
  CanonicalGeographicLocation,
  CanonicalInfrastructureEntityFeature,
  CanonicalKnowledgeFeatureSet,
  CanonicalTopologyState,
} from "../features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalSimilarityAvailability,
  DEFAULT_CANONICAL_SIMILARITY_WEIGHTS,
} from "./CanonicalKnowledgeSimilarityTypes";

import type {
  AvailableCanonicalDimensionSimilarity,
  CanonicalAggregateSimilarity,
  CanonicalDimensionSimilarity,
  CanonicalKnowledgeSimilarityCollection,
  CanonicalKnowledgeSimilarityResolution,
  CanonicalSimilarityDimensions,
  CanonicalSimilarityWeights,
} from "./CanonicalKnowledgeSimilarityTypes";

// ============================================================
// CONSTANTS
// ============================================================

const EPSILON =
  0.0000001;

// ============================================================
// PUBLIC API
// ============================================================

export function compareCanonicalKnowledgeFeatures(
  source:
    CanonicalKnowledgeFeatureSet,
  target:
    CanonicalKnowledgeFeatureSet,
  weights:
    CanonicalSimilarityWeights =
      DEFAULT_CANONICAL_SIMILARITY_WEIGHTS,
): CanonicalKnowledgeSimilarityResolution {

  const dimensions:
    CanonicalSimilarityDimensions = {

    narrative:
      compareNarrative(
        source.narrative.traits,
        target.narrative.traits,
        weights.narrative,
      ),

    observability:
      compareObservability(
        source.observability.confidence,
        source.observability.durationMinutes,
        target.observability.confidence,
        target.observability.durationMinutes,
        weights.observability,
      ),

    infrastructure:
      compareInfrastructure(
        source.infrastructure.entities,
        target.infrastructure.entities,
        weights.infrastructure,
      ),

    topology:
      compareTopology(
        source.topology.state,
        target.topology.state,
        weights.topology,
      ),

    geography:
      compareGeography(
        source.geography.location,
        target.geography.location,
        weights.geography,
      ),

  };

  const aggregate =
    computeAggregateSimilarity(
      dimensions,
    );

  return {

    sourceKnowledgeObjectId:
      source.knowledgeObjectId,

    targetKnowledgeObjectId:
      target.knowledgeObjectId,

    aggregate,

    dimensions,

    rationale:
      buildRationale(
        dimensions,
        aggregate,
      ),

  };

}

// ============================================================
// COLLECTION COMPARISON
// ============================================================

export function compareCanonicalKnowledgeFeatureCollection(
  source:
    CanonicalKnowledgeFeatureSet,
  targets:
    readonly CanonicalKnowledgeFeatureSet[],
  weights:
    CanonicalSimilarityWeights =
      DEFAULT_CANONICAL_SIMILARITY_WEIGHTS,
): CanonicalKnowledgeSimilarityCollection {

  const resolutions =
    targets
      .map(
        target =>
          compareCanonicalKnowledgeFeatures(
            source,
            target,
            weights,
          ),
      )
      .sort(
        compareResolutionOrder,
      );

  return {

    sourceKnowledgeObjectId:
      source.knowledgeObjectId,

    resolutions,

  };

}

// ============================================================
// NARRATIVE
// ============================================================
//
// Jaccard:
//
//              |A ∩ B|
//   J(A,B) = ---------
//              |A ∪ B|
//
// Availability is evaluated before Jaccard.
//
// ============================================================

function compareNarrative(
  source:
    CanonicalFeatureValue<
      readonly string[]
    >,
  target:
    CanonicalFeatureValue<
      readonly string[]
    >,
  weight:
    number,
): CanonicalDimensionSimilarity {

  if (
    source.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    target.availability !==
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.NARRATIVE,
      "Narrative traits are not mutually available.",
    );

  }

  return availableDimension(
    CanonicalFeatureDimension.NARRATIVE,
    jaccardSimilarity(
      source.value,
      target.value,
    ),
    weight,
  );

}

// ============================================================
// OBSERVABILITY
// ============================================================
//
// Historical P24.2 parity:
//
//   C = max(0, 1 - |c_a - c_b|)
//
//   D = max(
//         0,
//         1 - |d_a - d_b| / 100
//       )
//
//   O = (C + D) / 2
//
// Both canonical observability dimensions must be mutually
// available.
//
// Missing confidence or duration does NOT become zero.
//
// ============================================================

function compareObservability(
  sourceConfidence:
    CanonicalFeatureValue<number>,
  sourceDuration:
    CanonicalFeatureValue<number>,
  targetConfidence:
    CanonicalFeatureValue<number>,
  targetDuration:
    CanonicalFeatureValue<number>,
  weight:
    number,
): CanonicalDimensionSimilarity {

  if (
    sourceConfidence.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    sourceDuration.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    targetConfidence.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    targetDuration.availability !==
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.OBSERVABILITY,
      "Confidence and duration are not mutually available.",
    );

  }

  const confidenceSimilarity =
    numericSimilarity(
      sourceConfidence.value,
      targetConfidence.value,
      1,
    );

  const durationSimilarity =
    numericSimilarity(
      sourceDuration.value,
      targetDuration.value,
      100,
    );

  return availableDimension(
    CanonicalFeatureDimension.OBSERVABILITY,
    (
      confidenceSimilarity +
      durationSimilarity
    ) /
      2,
    weight,
  );

}

// ============================================================
// INFRASTRUCTURE
// ============================================================
//
// Historical comparison used facility types.
//
// Canonical Knowledge preserves infrastructure entity identity
// and facility classification.
//
// For P56C-B migration parity:
//
//   canonical entity
//          ↓
//     facilityType
//          ↓
//       Jaccard
//
// ============================================================

function compareInfrastructure(
  source:
    CanonicalFeatureValue<
      readonly CanonicalInfrastructureEntityFeature[]
    >,
  target:
    CanonicalFeatureValue<
      readonly CanonicalInfrastructureEntityFeature[]
    >,
  weight:
    number,
): CanonicalDimensionSimilarity {

  if (
    source.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    target.availability !==
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.INFRASTRUCTURE,
      "Infrastructure entities are not mutually available.",
    );

  }

  const sourceTypes =
    source.value.map(
      entity =>
        entity.facilityType,
    );

  const targetTypes =
    target.value.map(
      entity =>
        entity.facilityType,
    );

  return availableDimension(
    CanonicalFeatureDimension.INFRASTRUCTURE,
    jaccardSimilarity(
      sourceTypes,
      targetTypes,
    ),
    weight,
  );

}

// ============================================================
// TOPOLOGY
// ============================================================
//
// Canonical topology vector:
//
//     T = (Dc, Ri, Es, Fc)
//
// Dc = contradiction density
// Ri = residual instability
// Es = entanglement score
// Fc = cluster fragmentation
//
// ============================================================

function compareTopology(
  source:
    CanonicalFeatureValue<
      CanonicalTopologyState
    >,
  target:
    CanonicalFeatureValue<
      CanonicalTopologyState
    >,
  weight:
    number,
): CanonicalDimensionSimilarity {

  if (
    source.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    target.availability !==
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.TOPOLOGY,
      "Canonical topology state is not mutually available.",
    );

  }

  const sourceVector = [

    source.value
      .contradictionDensity,

    source.value
      .residualInstability,

    source.value
      .entanglementScore,

    source.value
      .clusterFragmentation,

  ];

  const targetVector = [

    target.value
      .contradictionDensity,

    target.value
      .residualInstability,

    target.value
      .entanglementScore,

    target.value
      .clusterFragmentation,

  ];

  return availableDimension(
    CanonicalFeatureDimension.TOPOLOGY,
    vectorSimilarity(
      sourceVector,
      targetVector,
    ),
    weight,
  );

}

// ============================================================
// GEOGRAPHY
// ============================================================
//
// Initial parity behavior:
//
//   same canonical state      -> 1
//   different canonical state -> 0
//
// Missing state is UNAVAILABLE.
//
// ============================================================

function compareGeography(
  source:
    CanonicalFeatureValue<
      CanonicalGeographicLocation
    >,
  target:
    CanonicalFeatureValue<
      CanonicalGeographicLocation
    >,
  weight:
    number,
): CanonicalDimensionSimilarity {

  if (
    source.availability !==
      CanonicalFeatureAvailability.AVAILABLE ||
    target.availability !==
      CanonicalFeatureAvailability.AVAILABLE
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.GEOGRAPHY,
      "Geographic location is not mutually available.",
    );

  }

  const sourceState =
    normalizeOptionalString(
      source.value.state,
    );

  const targetState =
    normalizeOptionalString(
      target.value.state,
    );

  if (
    sourceState === undefined ||
    targetState === undefined
  ) {

    return unavailableDimension(
      CanonicalFeatureDimension.GEOGRAPHY,
      "Canonical geographic state is not mutually available.",
    );

  }

  return availableDimension(
    CanonicalFeatureDimension.GEOGRAPHY,
    sourceState ===
      targetState
      ? 1
      : 0,
    weight,
  );

}

// ============================================================
// AGGREGATE
// ============================================================
//
// Available dimension set:
//
//     A(i,j)
//
// Aggregate:
//
//                 Σ w_d s_d
//                d∈A
//     S(i,j) = -------------
//                   Σ w_d
//                  d∈A
//
// No participating dimensions:
//
//     aggregate = UNAVAILABLE
//
// ============================================================

function computeAggregateSimilarity(
  dimensions:
    CanonicalSimilarityDimensions,
): CanonicalAggregateSimilarity {

  const ordered:
    readonly CanonicalDimensionSimilarity[] = [

    dimensions.narrative,

    dimensions.observability,

    dimensions.infrastructure,

    dimensions.topology,

    dimensions.geography,

  ];

  const available =
    ordered.filter(
      (
        dimension,
      ): dimension is
        AvailableCanonicalDimensionSimilarity =>
          dimension.availability ===
          CanonicalSimilarityAvailability.AVAILABLE,
    );

  if (
    available.length ===
    0
  ) {

    return {

      availability:
        CanonicalSimilarityAvailability.UNAVAILABLE,

      reason:
        "No canonical feature dimensions are mutually available for comparison.",

    };

  }

  let weightedTotal =
    0;

  let participatingWeight =
    0;

  for (
    const dimension
    of available
  ) {

    weightedTotal +=
      dimension.similarity *
      dimension.weight;

    participatingWeight +=
      dimension.weight;

  }

  if (
    participatingWeight <=
    EPSILON
  ) {

    return {

      availability:
        CanonicalSimilarityAvailability.UNAVAILABLE,

      reason:
        "Mutually available dimensions have no positive participating weight.",

    };

  }

  return {

    availability:
      CanonicalSimilarityAvailability.AVAILABLE,

    score:
      clamp01(
        weightedTotal /
        participatingWeight,
      ),

    participatingWeight,

    participatingDimensions:
      available.map(
        dimension =>
          dimension.dimension,
      ),

  };

}

// ============================================================
// RATIONALE
// ============================================================

function buildRationale(
  dimensions:
    CanonicalSimilarityDimensions,
  aggregate:
    CanonicalAggregateSimilarity,
): readonly string[] {

  const rationale:
    string[] = [];

  if (
    isAvailableDimension(
      dimensions.narrative,
    ) &&
    dimensions.narrative
      .similarity >=
      0.70
  ) {

    rationale.push(
      "Strong narrative signature overlap",
    );

  }

  if (
    isAvailableDimension(
      dimensions.topology,
    ) &&
    dimensions.topology
      .similarity >=
      0.70
  ) {

    rationale.push(
      "Topology state alignment",
    );

  }

  if (
    isAvailableDimension(
      dimensions.infrastructure,
    ) &&
    dimensions.infrastructure
      .similarity >=
      0.70
  ) {

    rationale.push(
      "Infrastructure context similarity",
    );

  }

  if (
    aggregate.availability ===
    CanonicalSimilarityAvailability.UNAVAILABLE
  ) {

    rationale.push(
      "Aggregate similarity unavailable because no positively weighted canonical dimensions could participate.",
    );

  }

  return rationale;

}

// ============================================================
// RESULT ORDERING
// ============================================================

function compareResolutionOrder(
  left:
    CanonicalKnowledgeSimilarityResolution,
  right:
    CanonicalKnowledgeSimilarityResolution,
): number {

  const leftAvailable =
    left.aggregate.availability ===
    CanonicalSimilarityAvailability.AVAILABLE;

  const rightAvailable =
    right.aggregate.availability ===
    CanonicalSimilarityAvailability.AVAILABLE;

  if (
    leftAvailable &&
    !rightAvailable
  ) {

    return -1;

  }

  if (
    !leftAvailable &&
    rightAvailable
  ) {

    return 1;

  }

  if (
    leftAvailable &&
    rightAvailable
  ) {

    const leftScore =
      left.aggregate.availability ===
        CanonicalSimilarityAvailability.AVAILABLE
        ? left.aggregate.score
        : 0;

    const rightScore =
      right.aggregate.availability ===
        CanonicalSimilarityAvailability.AVAILABLE
        ? right.aggregate.score
        : 0;

    if (
      Math.abs(
        leftScore -
        rightScore,
      ) >
      EPSILON
    ) {

      return (
        rightScore -
        leftScore
      );

    }

  }

  return compareCanonicalStrings(
    left.targetKnowledgeObjectId,
    right.targetKnowledgeObjectId,
  );

}

// ============================================================
// RESULT FACTORIES
// ============================================================

function availableDimension(
  dimension:
    CanonicalFeatureDimension,
  similarity:
    number,
  weight:
    number,
): AvailableCanonicalDimensionSimilarity {

  if (
    !Number.isFinite(
      similarity,
    )
  ) {

    throw new Error(
      `Canonical similarity for ${dimension} must be finite.`,
    );

  }

  if (
    !Number.isFinite(
      weight,
    ) ||
    weight < 0
  ) {

    throw new Error(
      `Canonical similarity weight for ${dimension} must be finite and non-negative.`,
    );

  }

  return {

    availability:
      CanonicalSimilarityAvailability.AVAILABLE,

    dimension,

    similarity:
      clamp01(
        similarity,
      ),

    weight,

  };

}

function unavailableDimension(
  dimension:
    CanonicalFeatureDimension,
  reason:
    string,
): CanonicalDimensionSimilarity {

  return {

    availability:
      CanonicalSimilarityAvailability.UNAVAILABLE,

    dimension,

    reason,

  };

}

function isAvailableDimension(
  dimension:
    CanonicalDimensionSimilarity,
): dimension is
  AvailableCanonicalDimensionSimilarity {

  return (
    dimension.availability ===
    CanonicalSimilarityAvailability.AVAILABLE
  );

}

// ============================================================
// JACCARD
// ============================================================
//
// AVAILABLE([]) remains distinct from UNAVAILABLE.
//
// Historical behavior:
//
//     J(empty, empty) = 1
//
// ============================================================

function jaccardSimilarity(
  left:
    readonly string[],
  right:
    readonly string[],
): number {

  const leftSet =
    new Set(
      left.map(
        normalizeString,
      ),
    );

  const rightSet =
    new Set(
      right.map(
        normalizeString,
      ),
    );

  if (
    leftSet.size ===
      0 &&
    rightSet.size ===
      0
  ) {

    return 1;

  }

  let intersectionSize =
    0;

  for (
    const value
    of leftSet
  ) {

    if (
      rightSet.has(
        value,
      )
    ) {

      intersectionSize +=
        1;

    }

  }

  const union =
    new Set([
      ...leftSet,
      ...rightSet,
    ]);

  return clamp01(
    intersectionSize /
      Math.max(
        union.size,
        1,
      ),
  );

}

// ============================================================
// NUMERIC SIMILARITY
// ============================================================

function numericSimilarity(
  left:
    number,
  right:
    number,
  maxDistance:
    number,
): number {

  if (
    !Number.isFinite(
      left,
    ) ||
    !Number.isFinite(
      right,
    )
  ) {

    throw new Error(
      "Canonical numeric similarity requires finite values.",
    );

  }

  if (
    !Number.isFinite(
      maxDistance,
    ) ||
    maxDistance <=
      0
  ) {

    throw new Error(
      "Canonical numeric similarity requires positive finite maxDistance.",
    );

  }

  return clamp01(
    1 -
      Math.min(
        Math.abs(
          left -
          right,
        ) /
          maxDistance,
        1,
      ),
  );

}

// ============================================================
// VECTOR SIMILARITY
// ============================================================

function vectorSimilarity(
  left:
    readonly number[],
  right:
    readonly number[],
): number {

  if (
    left.length ===
      0 ||
    right.length ===
      0
  ) {

    throw new Error(
      "Canonical vector similarity requires non-empty vectors.",
    );

  }

  if (
    left.length !==
    right.length
  ) {

    throw new Error(
      "Canonical vector similarity requires equal vector dimensions.",
    );

  }

  let total =
    0;

  for (
    let index = 0;
    index <
      left.length;
    index +=
      1
  ) {

    total +=
      numericSimilarity(
        left[index],
        right[index],
        1,
      );

  }

  return clamp01(
    total /
      left.length,
  );

}

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeString(
  value:
    string,
): string {

  return value
    .toLowerCase()
    .trim();

}

function normalizeOptionalString(
  value:
    string | undefined,
): string | undefined {

  if (
    typeof value !==
    "string"
  ) {

    return undefined;

  }

  const normalized =
    normalizeString(
      value,
    );

  return normalized.length >
    0
    ? normalized
    : undefined;

}

// ============================================================
// CANONICAL STRING ORDER
// ============================================================

function compareCanonicalStrings(
  left:
    string,
  right:
    string,
): number {

  if (
    left <
    right
  ) {

    return -1;

  }

  if (
    left >
    right
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// CLAMP
// ============================================================

function clamp01(
  value:
    number,
): number {

  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  );

}

// ============================================================
// END
// ============================================================