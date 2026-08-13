// ============================================================
// src/resolve/similarity/CanonicalKnowledgeComparability.ts
// P56C-C
// CANONICAL KNOWLEDGE PAIRWISE COMPARABILITY
//
// Deterministic pairwise comparability operator.
//
// This module decides whether a canonical feature dimension
// may legitimately participate in similarity computation.
//
// It does NOT:
//
//   • compute similarity
//   • modify Jaccard
//   • modify numeric similarity
//   • modify vector similarity
//   • infer historical technology
//   • infer missing evidence
//   • convert unavailable evidence to zero
//
// ============================================================

import {
  CanonicalFeatureAvailability,
  CanonicalFeatureDimension,
} from "../features/CanonicalKnowledgeFeatureTypes";

import type {
  CanonicalKnowledgeFeatureSet,
} from "../features/CanonicalKnowledgeFeatureTypes";

import {
  CanonicalFeatureComparability,
} from "./CanonicalKnowledgeComparabilityTypes";

import type {
  CanonicalFeatureComparabilityResult,
} from "./CanonicalKnowledgeComparabilityTypes";

// ============================================================
// RESULT HELPERS
// ============================================================

function comparable(
  dimension:
    CanonicalFeatureDimension,
  reason:
    string,
): CanonicalFeatureComparabilityResult {

  return {

    dimension,

    comparability:
      CanonicalFeatureComparability
        .COMPARABLE,

    reason,

  };

}

function indeterminate(
  dimension:
    CanonicalFeatureDimension,
  reason:
    string,
): CanonicalFeatureComparabilityResult {

  return {

    dimension,

    comparability:
      CanonicalFeatureComparability
        .INDETERMINATE,

    reason,

  };

}

// ============================================================
// RESOLVE PAIRWISE COMPARABILITY
// ============================================================
//
// This first policy establishes only feature sufficiency.
//
// If the canonical features required by the existing
// similarity operator are mutually available, the dimension
// is provisionally COMPARABLE.
//
// If required canonical features are unavailable,
// comparability is INDETERMINATE.
//
// IMPORTANT:
//
//   UNAVAILABLE does NOT imply NOT_COMPARABLE.
//
// NOT_COMPARABLE requires affirmative canonical evidence
// establishing that the comparison itself is illegitimate.
//
// Observation-regime policy is intentionally NOT implemented
// in this step.
//
// ============================================================

export function resolveCanonicalFeatureComparability(
  left:
    CanonicalKnowledgeFeatureSet,
  right:
    CanonicalKnowledgeFeatureSet,
  dimension:
    CanonicalFeatureDimension,
): CanonicalFeatureComparabilityResult {

  switch (
    dimension
  ) {

    // --------------------------------------------------------
    // NARRATIVE
    // --------------------------------------------------------

    case CanonicalFeatureDimension.NARRATIVE: {

      if (
        left.narrative.traits.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.narrative.traits.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Narrative traits are not mutually available.",
        );

      }

      return comparable(
        dimension,
        "Narrative traits are mutually available.",
      );

    }

       // --------------------------------------------------------
    // OBSERVABILITY
    // --------------------------------------------------------
    //
    // Observability comparison requires:
    //
    //   1. confidence mutually available
    //   2. duration mutually available
    //   3. observation regime mutually available
    //   4. observation regimes equal
    //
    // Equal regimes establish a homogeneous observational
    // basis for the existing confidence/duration comparison.
    //
    // Different regimes do NOT imply NOT_COMPARABLE.
    //
    // They establish that the current canonical evidence is
    // insufficient to justify direct observability comparison.
    //
    // Therefore:
    //
    //   same regime      -> COMPARABLE
    //   different regime -> INDETERMINATE
    //   missing regime   -> INDETERMINATE
    //
    // No sensor capabilities are inferred from regime labels.
    //
    // --------------------------------------------------------

    case CanonicalFeatureDimension.OBSERVABILITY: {

      if (
        left.observability.confidence.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        left.observability.durationMinutes.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.observability.confidence.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.observability.durationMinutes.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Confidence and duration are not mutually available.",
        );

      }

      if (
        left.observability.regime.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.observability.regime.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Canonical observation regime is not mutually available.",
        );

      }

      const leftRegime =
        left.observability.regime.value;

      const rightRegime =
        right.observability.regime.value;

      if (
        leftRegime !==
        rightRegime
      ) {

        return indeterminate(
          dimension,
          "Canonical observation regimes differ; direct observability comparison is not established.",
        );

      }

      return comparable(
        dimension,
        "Confidence, duration, and canonical observation regime are mutually comparable.",
      );

    }
    // --------------------------------------------------------
    // INFRASTRUCTURE
    // --------------------------------------------------------

    case CanonicalFeatureDimension.INFRASTRUCTURE: {

      if (
        left.infrastructure.entities.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.infrastructure.entities.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Infrastructure entities are not mutually available.",
        );

      }

      return comparable(
        dimension,
        "Infrastructure entities are mutually available.",
      );

    }

    // --------------------------------------------------------
    // TOPOLOGY
    // --------------------------------------------------------

    case CanonicalFeatureDimension.TOPOLOGY: {

      if (
        left.topology.state.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.topology.state.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Canonical topology state is not mutually available.",
        );

      }

      return comparable(
        dimension,
        "Canonical topology state is mutually available.",
      );

    }

    // --------------------------------------------------------
    // GEOGRAPHY
    // --------------------------------------------------------

    case CanonicalFeatureDimension.GEOGRAPHY: {

      if (
        left.geography.location.availability !==
          CanonicalFeatureAvailability.AVAILABLE ||
        right.geography.location.availability !==
          CanonicalFeatureAvailability.AVAILABLE
      ) {

        return indeterminate(
          dimension,
          "Geographic location is not mutually available.",
        );

      }

      const leftState =
        left.geography.location.value.state;

      const rightState =
        right.geography.location.value.state;

      if (
        typeof leftState !== "string" ||
        leftState.trim().length === 0 ||
        typeof rightState !== "string" ||
        rightState.trim().length === 0
      ) {

        return indeterminate(
          dimension,
          "Canonical geographic state is not mutually available.",
        );

      }

      return comparable(
        dimension,
        "Canonical geographic state is mutually available.",
      );

    }

  }

}

// ============================================================
// END
// ============================================================