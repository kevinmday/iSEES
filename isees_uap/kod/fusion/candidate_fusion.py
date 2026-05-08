# ============================================================
# candidate_fusion.py
# KOD — CANDIDATE FUSION ENGINE (V1)
# ============================================================

from dataclasses import dataclass, field, asdict
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

    dominant_candidate: Optional[Candidate] = None

    ranked_candidates: List[Candidate] = field(
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
                [c.summary() for c in self.ranked_candidates],

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

    top = candidates[0].match_scores.overall_alignment

    second = candidates[1].match_scores.overall_alignment

    spread = abs(top - second)

    return round(spread, 3)


def calculate_ambiguity_score(
    spread: float,
) -> float:

    """
    Lower spread = higher ambiguity.
    """

    ambiguity = 1.0 - spread

    ambiguity = max(0.0, min(1.0, ambiguity))

    return round(ambiguity, 3)


def calculate_residual_confidence(
    dominant_alignment: float,
) -> float:

    """
    Residual unexplained emergence.

    High candidate alignment:
        low residual emergence

    Low candidate alignment:
        high residual emergence
    """

    residual = 1.0 - dominant_alignment

    residual = max(0.0, min(1.0, residual))

    return round(residual, 3)


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
            "No reconstruction candidates available."
        )

        result.residual_confidence = 1.0

        return result

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    ranked = sorted(
        candidates,
        key=lambda c:
        c.match_scores.overall_alignment,
        reverse=True,
    )

    result.ranked_candidates = ranked

    # --------------------------------------------------------
    # DOMINANT CANDIDATE
    # --------------------------------------------------------

    dominant = ranked[0]

    result.dominant_candidate = dominant

    dominant_alignment = (
        dominant.match_scores.overall_alignment
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

    residual = calculate_residual_confidence(
        dominant_alignment
    )

    result.residual_confidence = residual

    # --------------------------------------------------------
    # RESOLUTION STATE
    # --------------------------------------------------------

    if dominant_alignment >= 0.80:

        result.unresolved = False

    else:

        result.unresolved = True

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    if result.unresolved:

        result.fusion_summary = (
            f"No dominant deterministic explanation "
            f"fully resolved the observation. "
            f"Top candidate: "
            f"{dominant.candidate_type} "
            f"({round(dominant_alignment * 100, 1)}%)."
        )

    else:

        result.fusion_summary = (
            f"Dominant candidate resolved as "
            f"{dominant.candidate_type} "
            f"with "
            f"{round(dominant_alignment * 100, 1)}% "
            f"alignment confidence."
        )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    result.metadata = {
        "candidate_count": len(ranked),
        "dominant_candidate_id":
            dominant.candidate_id,
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

    from isees_uap.kod.engines.aviation_engine import (
        reconstruct_aviation_candidates,
    )

    # --------------------------------------------------------
    # TEST OBSERVATION
    # --------------------------------------------------------

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.estimated_altitude_ft = 30000
    observation.estimated_speed_kts = 420

    # --------------------------------------------------------
    # GENERATE CANDIDATES
    # --------------------------------------------------------

    candidates = reconstruct_aviation_candidates(
        observation
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