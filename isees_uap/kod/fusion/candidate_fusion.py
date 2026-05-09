# ============================================================
# candidate_fusion.py
# KOD — CANDIDATE FUSION ENGINE (V3)
# ============================================================

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

from isees_uap.kod.models.candidate import (
    Candidate,
)


# ============================================================
# FUSION RESULT
# ============================================================

@dataclass
class FusionResult:
    """
    Final fused interpretation of all candidates.
    """

    dominant_candidate: Optional[
        Candidate
    ] = None

    ranked_candidates: List[
        Candidate
    ] = field(
        default_factory=list
    )

    ambiguity_score: float = 0.0

    residual_confidence: float = 0.0

    confidence_spread: float = 0.0

    unresolved: bool = True

    fusion_summary: str = ""

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return {
            "dominant_candidate":
                self.dominant_candidate.summary()
                if self.dominant_candidate
                else None,

            "ranked_candidates":
                [
                    c.summary()
                    for c in self.ranked_candidates
                ],

            "ambiguity_score":
                self.ambiguity_score,

            "residual_confidence":
                self.residual_confidence,

            "confidence_spread":
                self.confidence_spread,

            "unresolved":
                self.unresolved,

            "fusion_summary":
                self.fusion_summary,

            "metadata":
                self.metadata,
        }


# ============================================================
# COLLAPSE SCORING
# ============================================================

def calculate_collapse_score(
    candidate: Candidate,
) -> float:

    """
    Generalized manifold collapse score.

    Weighted normalized topology scoring.

    High alignment:
        increases collapse

    High explanatory completeness:
        increases collapse

    High contradiction:
        reduces collapse

    High residual:
        reduces collapse
    """

    alignment = (
        candidate.match_scores
        .overall_alignment
    )

    completeness = (
        candidate.match_scores
        .explanatory_completeness
    )

    contradiction = (
        candidate.match_scores
        .contradiction_pressure
    )

    residual = (
        candidate.match_scores
        .residual_pressure
    )

    # --------------------------------------------------------
    # NORMALIZED COLLAPSE TOPOLOGY
    # --------------------------------------------------------

    score = (
        (alignment * 0.40)
        +
        (completeness * 0.35)
        -
        (contradiction * 0.15)
        -
        (residual * 0.10)
    )

    # --------------------------------------------------------
    # NORMALIZE
    # --------------------------------------------------------

    score = max(
        0.0,
        min(1.0, score),
    )

    return round(score, 3)


# ============================================================
# HELPERS
# ============================================================

def calculate_confidence_spread(
    candidates: List[Candidate],
) -> float:

    """
    Difference between top candidate
    and second-best candidate.
    """

    if len(candidates) < 2:

        return 1.0

    top = (
        calculate_collapse_score(
            candidates[0]
        )
    )

    second = (
        calculate_collapse_score(
            candidates[1]
        )
    )

    spread = abs(top - second)

    return round(spread, 3)


def calculate_ambiguity_score(
    spread: float,
) -> float:

    """
    Lower spread = higher ambiguity.
    """

    ambiguity = 1.0 - spread

    ambiguity = max(
        0.0,
        min(1.0, ambiguity),
    )

    return round(ambiguity, 3)


def calculate_residual_confidence(
    dominant_candidate: Candidate,
) -> float:

    """
    Residual unexplained emergence.
    """

    return round(
        dominant_candidate
        .match_scores
        .residual_pressure,
        3,
    )


# ============================================================
# MAIN FUSION ENGINE
# ============================================================

def fuse_candidates(
    candidates: List[Candidate],
) -> FusionResult:

    """
    Main candidate fusion pipeline.
    """

    result = FusionResult()

    # --------------------------------------------------------
    # EMPTY CASE
    # --------------------------------------------------------

    if not candidates:

        result.unresolved = True

        result.fusion_summary = (
            "No reconstruction candidates "
            "available."
        )

        result.residual_confidence = 1.0

        return result

    # --------------------------------------------------------
    # SORT BY COLLAPSE SCORE
    # --------------------------------------------------------

    ranked = sorted(
        candidates,
        key=lambda c:
        calculate_collapse_score(c),
        reverse=True,
    )

    result.ranked_candidates = ranked

    # --------------------------------------------------------
    # DOMINANT CANDIDATE
    # --------------------------------------------------------

    dominant = ranked[0]

    result.dominant_candidate = dominant

    dominant_alignment = (
        dominant.match_scores
        .overall_alignment
    )

    dominant_collapse = (
        calculate_collapse_score(
            dominant
        )
    )

    # --------------------------------------------------------
    # CONFIDENCE SPREAD
    # --------------------------------------------------------

    spread = calculate_confidence_spread(
        ranked
    )

    result.confidence_spread = spread

    # --------------------------------------------------------
    # AMBIGUITY
    # --------------------------------------------------------

    ambiguity = calculate_ambiguity_score(
        spread
    )

    result.ambiguity_score = ambiguity

    # --------------------------------------------------------
    # RESIDUAL EMERGENCE
    # --------------------------------------------------------

    residual = (
        calculate_residual_confidence(
            dominant
        )
    )

    result.residual_confidence = residual

    # --------------------------------------------------------
    # RESOLUTION STATE
    # --------------------------------------------------------

    if dominant_collapse >= 0.50:

        result.unresolved = False

    else:

        result.unresolved = True

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    if result.unresolved:

        result.fusion_summary = (
            f"No dominant deterministic "
            f"collapse fully resolved the "
            f"observation. "
            f"Top candidate: "
            f"{dominant.candidate_type} "
            f"(collapse score "
            f"{round(dominant_collapse, 3)})."
        )

    else:

        result.fusion_summary = (
            f"Dominant manifold collapse "
            f"resolved as "
            f"{dominant.candidate_type} "
            f"with collapse score "
            f"{round(dominant_collapse, 3)}."
        )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    result.metadata = {
        "candidate_count":
            len(ranked),

        "dominant_candidate_id":
            dominant.candidate_id,

        "dominant_collapse_score":
            dominant_collapse,

        "fusion_version":
            "V3_NORMALIZED_TOPOLOGY",
    }

    return result


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    from isees_uap.kod.models.observation_context import (
        ObservationContext,
    )

    from isees_uap.kod.kaod.engines.aviation_engine import (
        reconstruct_aviation_candidates,
    )

    from isees_uap.kod.kaod.engines.weather_engine import (
        reconstruct_weather_candidates,
    )

    # --------------------------------------------------------
    # TEST OBSERVATION
    # --------------------------------------------------------

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.object_shape = (
        "bright_white_light"
    )

    observation.sound_description = (
        "silent"
    )

    observation.movement_description = (
        "instant vertical maneuvering"
    )

    observation.estimated_altitude_ft = (
        30000
    )

    observation.estimated_speed_kts = (
        420
    )

    # --------------------------------------------------------
    # GENERATE CANDIDATES
    # --------------------------------------------------------

    candidates = []

    candidates.extend(
        reconstruct_aviation_candidates(
            observation
        )
    )

    candidates.extend(
        reconstruct_weather_candidates(
            observation
        )
    )

    # --------------------------------------------------------
    # RUN FUSION
    # --------------------------------------------------------

    fusion = fuse_candidates(
        candidates
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("================================================")
    print("KOD CANDIDATE FUSION")
    print("================================================")
    print()

    pprint(fusion.to_dict())

    print()