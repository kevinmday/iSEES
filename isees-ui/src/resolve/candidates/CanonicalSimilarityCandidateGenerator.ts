// ============================================================
// src/resolve/candidates/CanonicalSimilarityCandidateGenerator.ts
//
// P56D-C
// CANONICAL SIMILARITY CANDIDATE GENERATOR
//
// Deterministically derives candidate propositions from the
// canonical similarity matrix.
//
// GOVERNING TRANSFORMATION
//
//     Canonical Similarity Matrix
//                 ↓
//     AVAILABLE aggregate pairs
//                 ↓
//     Canonical Similarity Candidates
//
// Candidate generation is intentionally lossless with respect
// to available similarity measurements.
//
// No threshold.
// No ranking.
// No similarity recomputation.
// No graph mutation.
// No Knowledge mutation.
// No AI inference.
// No clocks.
// No randomness.
//
// ============================================================

import {
  CanonicalSimilarityAvailability,
} from "../similarity/CanonicalKnowledgeSimilarityTypes";

import type {
  CanonicalKnowledgeSimilarityMatrix,
  CanonicalKnowledgeSimilarityPair,
} from "../similarity/CanonicalKnowledgeSimilarityMatrixTypes";

import {
  CanonicalSimilarityCandidateBasis,
} from "./CanonicalSimilarityCandidateTypes";

import type {
  CanonicalSimilarityCandidate,
  CanonicalSimilarityCandidateCollection,
  CanonicalSimilarityCandidateGeneratorContract,
} from "./CanonicalSimilarityCandidateTypes";

// ============================================================
// CANDIDATE ID PREFIX
// ============================================================
//
// Candidate identity is derived exclusively from canonical pair
// identity.
//
// Because the similarity matrix guarantees:
//
//     leftKnowledgeObjectId < rightKnowledgeObjectId
//
// no additional ordering decision is required here.
//
// ============================================================

export const CANONICAL_SIMILARITY_CANDIDATE_ID_PREFIX =
  "similarity-candidate" as const;

// ============================================================
// CREATE CANDIDATE ID
// ============================================================

export function createCanonicalSimilarityCandidateId(
  leftKnowledgeObjectId: string,
  rightKnowledgeObjectId: string,
): string {

  return (
    `${CANONICAL_SIMILARITY_CANDIDATE_ID_PREFIX}:` +
    `${leftKnowledgeObjectId}:` +
    `${rightKnowledgeObjectId}`
  );

}

// ============================================================
// VALIDATE PAIR IDENTITY
// ============================================================
//
// Candidate generation consumes the canonical matrix contract.
//
// We nevertheless fail loudly if a malformed pair crosses this
// boundary.
//
// This protects candidate identity from:
// 
//   • self-pairs
//   • reverse/noncanonical ordering
//
// ============================================================

function validateCanonicalPairIdentity(
  pair: CanonicalKnowledgeSimilarityPair,
): void {

  if (
    pair.leftKnowledgeObjectId ===
    pair.rightKnowledgeObjectId
  ) {

    throw new Error(
      "Canonical similarity candidate generation cannot consume a self-pair.",
    );

  }

  if (
    pair.leftKnowledgeObjectId >
    pair.rightKnowledgeObjectId
  ) {

    throw new Error(
      "Canonical similarity candidate generation requires lexically canonical pair ordering.",
    );

  }

}

// ============================================================
// VALIDATE RESOLUTION IDENTITY
// ============================================================
//
// The pair wrapper and contained similarity resolution must
// describe the same two canonical Knowledge Objects.
//
// Resolution source/target orientation is not required to match
// left/right orientation.
//
// The similarity operator may preserve source/target identities
// independently from canonical unordered pair identity.
//
// Therefore we validate set identity:
//
//     {left, right} = {source, target}
//
// ============================================================

function validateResolutionIdentity(
  pair: CanonicalKnowledgeSimilarityPair,
): void {

  const {
    sourceKnowledgeObjectId,
    targetKnowledgeObjectId,
  } = pair.resolution;

  const directMatch =
    sourceKnowledgeObjectId ===
      pair.leftKnowledgeObjectId &&
    targetKnowledgeObjectId ===
      pair.rightKnowledgeObjectId;

  const reverseMatch =
    sourceKnowledgeObjectId ===
      pair.rightKnowledgeObjectId &&
    targetKnowledgeObjectId ===
      pair.leftKnowledgeObjectId;

  if (
    !directMatch &&
    !reverseMatch
  ) {

    throw new Error(
      "Canonical similarity candidate generation encountered mismatched pair and resolution identities.",
    );

  }

}

// ============================================================
// CREATE CANDIDATE
// ============================================================
//
// This function assumes the aggregate has already been confirmed
// AVAILABLE.
//
// It does not inspect the numerical score.
//
// Therefore:
//
//     AVAILABLE 0
//
// remains fully candidate-eligible.
//
// ============================================================

function createCandidate(
  pair: CanonicalKnowledgeSimilarityPair,
): CanonicalSimilarityCandidate {

  return {

    id:
      createCanonicalSimilarityCandidateId(
        pair.leftKnowledgeObjectId,
        pair.rightKnowledgeObjectId,
      ),

    basis:
      CanonicalSimilarityCandidateBasis
        .AVAILABLE_SIMILARITY,

    leftKnowledgeObjectId:
      pair.leftKnowledgeObjectId,

    rightKnowledgeObjectId:
      pair.rightKnowledgeObjectId,

    similarityResolution:
      pair.resolution,

  };

}

// ============================================================
// GENERATE CANONICAL SIMILARITY CANDIDATES
// ============================================================
//
// Candidate ordering is inherited directly from canonical matrix
// pair ordering.
//
// We deliberately do NOT sort by:
//
//   • aggregate score
//   • participating weight
//   • number of participating dimensions
//   • rationale
//   • confidence
//
// The matrix owns canonical pair ordering.
//
// ============================================================

export function generateCanonicalSimilarityCandidates(
  similarityMatrix:
    CanonicalKnowledgeSimilarityMatrix,
): CanonicalSimilarityCandidateCollection {

  const candidates:
    CanonicalSimilarityCandidate[] = [];

  for (
    const pair of similarityMatrix.pairs
  ) {

    validateCanonicalPairIdentity(
      pair,
    );

    validateResolutionIdentity(
      pair,
    );

    if (
      pair.resolution.aggregate.availability !==
      CanonicalSimilarityAvailability.AVAILABLE
    ) {

      continue;

    }

    candidates.push(
      createCandidate(
        pair,
      ),
    );

  }

  return {

    sourcePairCount:
      similarityMatrix.pairCount,

    candidateCount:
      candidates.length,

    candidates,

  };

}

// ============================================================
// GENERATOR IMPLEMENTATION
// ============================================================

export class CanonicalSimilarityCandidateGenerator
implements CanonicalSimilarityCandidateGeneratorContract {

  generate(
    similarityMatrix:
      CanonicalKnowledgeSimilarityMatrix,
  ): CanonicalSimilarityCandidateCollection {

    return generateCanonicalSimilarityCandidates(
      similarityMatrix,
    );

  }

}

// ============================================================
// END
// ============================================================