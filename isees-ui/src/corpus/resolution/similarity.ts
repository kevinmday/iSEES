// ============================================================
// src/corpus/resolution/similarity.ts
// P24.2 RESOLUTION ENGINE FOUNDATION
// DETERMINISTIC SIMILARITY MATH
// FULL DROP-IN FILE
// ============================================================

// ============================================================
// JACCARD SIMILARITY
// ============================================================

export function jaccardSimilarity(
  a: string[] = [],
  b: string[] = []
): number {

  const setA =
    new Set(
      a.map((v) =>
        v.toLowerCase().trim()
      )
    );

  const setB =
    new Set(
      b.map((v) =>
        v.toLowerCase().trim()
      )
    );

  if (
    setA.size === 0 &&
    setB.size === 0
  ) {
    return 1;
  }

  const intersection =
    [...setA].filter((item) =>
      setB.has(item)
    );

  const union =
    new Set([
      ...setA,
      ...setB,
    ]);

  return (
    intersection.length /
    Math.max(union.size, 1)
  );
}

// ============================================================
// ARRAY OVERLAP
// ============================================================

export function arrayOverlapScore(
  a: string[] = [],
  b: string[] = []
): number {

  const setA =
    new Set(
      a.map((v) =>
        v.toLowerCase().trim()
      )
    );

  const setB =
    new Set(
      b.map((v) =>
        v.toLowerCase().trim()
      )
    );

  if (
    setA.size === 0 ||
    setB.size === 0
  ) {
    return 0;
  }

  const overlap =
    [...setA].filter((item) =>
      setB.has(item)
    ).length;

  return (
    overlap /
    Math.min(
      setA.size,
      setB.size
    )
  );
}

// ============================================================
// NUMERIC DISTANCE SIMILARITY
// ============================================================

export function numericSimilarity(
  a: number,
  b: number,
  maxDistance = 1
): number {

  const distance =
    Math.abs(a - b);

  const similarity =
    1 -
    Math.min(
      distance /
        Math.max(
          maxDistance,
          0.00001
        ),
      1
    );

  return clamp01(
    similarity
  );
}

// ============================================================
// NORMALIZED VECTOR SIMILARITY
// ============================================================

export function vectorSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {

  if (
    vectorA.length === 0 ||
    vectorB.length === 0
  ) {
    return 0;
  }

  if (
    vectorA.length !==
    vectorB.length
  ) {
    return 0;
  }

  let total = 0;

  for (
    let i = 0;
    i < vectorA.length;
    i++
  ) {

    total +=
      numericSimilarity(
        vectorA[i],
        vectorB[i]
      );
  }

  return (
    total /
    vectorA.length
  );
}

// ============================================================
// WEIGHTED SCORE
// ============================================================

export function weightedScore(
  values: number[],
  weights: number[]
): number {

  if (
    values.length === 0 ||
    weights.length === 0
  ) {
    return 0;
  }

  if (
    values.length !==
    weights.length
  ) {
    throw new Error(
      "weightedScore: values and weights length mismatch"
    );
  }

  let weightedTotal = 0;
  let weightTotal = 0;

  for (
    let i = 0;
    i < values.length;
    i++
  ) {

    weightedTotal +=
      values[i] *
      weights[i];

    weightTotal +=
      weights[i];
  }

  if (
    weightTotal === 0
  ) {
    return 0;
  }

  return (
    weightedTotal /
    weightTotal
  );
}

// ============================================================
// FACILITY TYPE SIMILARITY
// ============================================================

export function facilitySimilarity(
  facilityTypesA: string[] = [],
  facilityTypesB: string[] = []
): number {

  return jaccardSimilarity(
    facilityTypesA,
    facilityTypesB
  );
}

// ============================================================
// TOPOLOGY VECTOR SIMILARITY
// ============================================================

export function topologySimilarity(
  topologyA: {
    contradiction_density?: number;
    residual_instability?: number;
    entanglement_score?: number;
    cluster_fragmentation?: number;
  },
  topologyB: {
    contradiction_density?: number;
    residual_instability?: number;
    entanglement_score?: number;
    cluster_fragmentation?: number;
  }
): number {

  const vectorA = [

    topologyA
      .contradiction_density ?? 0,

    topologyA
      .residual_instability ?? 0,

    topologyA
      .entanglement_score ?? 0,

    topologyA
      .cluster_fragmentation ?? 0,
  ];

  const vectorB = [

    topologyB
      .contradiction_density ?? 0,

    topologyB
      .residual_instability ?? 0,

    topologyB
      .entanglement_score ?? 0,

    topologyB
      .cluster_fragmentation ?? 0,
  ];

  return vectorSimilarity(
    vectorA,
    vectorB
  );
}

// ============================================================
// CLAMP
// ============================================================

export function clamp01(
  value: number
): number {

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}