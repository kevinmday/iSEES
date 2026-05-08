# ============================================================
# residual_engine.py
# KOD — RESIDUAL EMERGENCE ENGINE (V1)
# ============================================================

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.fusion.candidate_fusion import (
    FusionResult,
)


# ============================================================
# RESIDUAL RESULT
# ============================================================

@dataclass
class ResidualResult:
    """
    Residual unexplained emergence state after
    deterministic contextual collapse.
    """

    residual_strength: float = 0.0

    residual_classification: str = "unknown"

    unresolved_features: List[str] = field(
        default_factory=list
    )

    contradiction_score: float = 0.0

    emergence_density: float = 0.0

    anomaly_probability: float = 0.0

    residual_summary: str = ""

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return {
            "residual_strength":
                self.residual_strength,

            "residual_classification":
                self.residual_classification,

            "unresolved_features":
                self.unresolved_features,

            "contradiction_score":
                self.contradiction_score,

            "emergence_density":
                self.emergence_density,

            "anomaly_probability":
                self.anomaly_probability,

            "residual_summary":
                self.residual_summary,

            "metadata":
                self.metadata,
        }


# ============================================================
# CONTRADICTION ANALYSIS
# ============================================================

def analyze_contradictions(
    observation: ObservationContext,
    fusion: FusionResult,
) -> Dict[str, Any]:

    """
    Detect unresolved contradictions between
    observation and dominant reconstruction.
    """

    contradictions = []

    score = 0.0

    dominant = fusion.dominant_candidate

    if not dominant:
        return {
            "contradictions": [
                "no_dominant_candidate"
            ],
            "score": 1.0,
        }

    # --------------------------------------------------------
    # ALTITUDE CONTRADICTION
    # --------------------------------------------------------

    if (
        observation.estimated_altitude_ft
        and dominant.altitude_ft
    ):

        delta_alt = abs(
            observation.estimated_altitude_ft
            - dominant.altitude_ft
        )

        if delta_alt > 10000:

            contradictions.append(
                "major_altitude_mismatch"
            )

            score += 0.25

    # --------------------------------------------------------
    # SPEED CONTRADICTION
    # --------------------------------------------------------

    if (
        observation.estimated_speed_kts
        and dominant.speed_kts
    ):

        delta_speed = abs(
            observation.estimated_speed_kts
            - dominant.speed_kts
        )

        if delta_speed > 250:

            contradictions.append(
                "major_speed_mismatch"
            )

            score += 0.25

    # --------------------------------------------------------
    # SOUND CONTRADICTION
    # --------------------------------------------------------

    if (
        observation.sound_description
        and "silent"
        in observation.sound_description.lower()
    ):

        if dominant.candidate_type in [
            "aircraft",
            "helicopter",
        ]:

            contradictions.append(
                "silent_vs_known_aircraft"
            )

            score += 0.20

    # --------------------------------------------------------
    # MANEUVER CONTRADICTION
    # --------------------------------------------------------

    if observation.movement_description:

        movement = (
            observation.movement_description
            .lower()
        )

        keywords = [
            "instant",
            "impossible",
            "vertical",
            "hover",
            "zigzag",
            "teleport",
        ]

        if any(
            k in movement
            for k in keywords
        ):

            contradictions.append(
                "nonstandard_maneuver_profile"
            )

            score += 0.30

    # --------------------------------------------------------
    # NORMALIZE
    # --------------------------------------------------------

    score = max(0.0, min(1.0, score))

    return {
        "contradictions": contradictions,
        "score": round(score, 3),
    }


# ============================================================
# RESIDUAL CLASSIFICATION
# ============================================================

def classify_residual(
    strength: float,
) -> str:

    """
    Residual emergence classification.
    """

    if strength < 0.10:
        return "fully_resolved"

    elif strength < 0.25:
        return "weak_residual"

    elif strength < 0.45:
        return "moderate_residual"

    elif strength < 0.70:
        return "strong_residual"

    else:
        return "anomalous"


# ============================================================
# MAIN RESIDUAL ENGINE
# ============================================================

def analyze_residual_emergence(
    observation: ObservationContext,
    fusion: FusionResult,
) -> ResidualResult:

    """
    Main residual emergence pipeline.
    """

    result = ResidualResult()

    # --------------------------------------------------------
    # BASE RESIDUAL
    # --------------------------------------------------------

    base_residual = (
        fusion.residual_confidence
    )

    # --------------------------------------------------------
    # CONTRADICTION ANALYSIS
    # --------------------------------------------------------

    contradiction_result = (
        analyze_contradictions(
            observation,
            fusion,
        )
    )

    contradiction_score = (
        contradiction_result["score"]
    )

    contradictions = (
        contradiction_result["contradictions"]
    )

    # --------------------------------------------------------
    # EMERGENCE DENSITY
    # --------------------------------------------------------

    emergence_density = (
        base_residual * 0.60
        + contradiction_score * 0.40
    )

    emergence_density = round(
        emergence_density,
        3,
    )

    # --------------------------------------------------------
    # RESIDUAL STRENGTH
    # --------------------------------------------------------

    residual_strength = max(
        base_residual,
        emergence_density,
    )

    residual_strength = round(
        residual_strength,
        3,
    )

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    classification = classify_residual(
        residual_strength
    )

    # --------------------------------------------------------
    # ANOMALY PROBABILITY
    # --------------------------------------------------------

    anomaly_probability = round(
        residual_strength
        * (1.0 + contradiction_score),
        3,
    )

    anomaly_probability = min(
        anomaly_probability,
        1.0,
    )

    # --------------------------------------------------------
    # BUILD RESULT
    # --------------------------------------------------------

    result.residual_strength = (
        residual_strength
    )

    result.residual_classification = (
        classification
    )

    result.unresolved_features = (
        contradictions
    )

    result.contradiction_score = (
        contradiction_score
    )

    result.emergence_density = (
        emergence_density
    )

    result.anomaly_probability = (
        anomaly_probability
    )

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    if contradictions:

        contradiction_text = (
            ", ".join(contradictions)
        )

    else:

        contradiction_text = (
            "no major contradictions"
        )

    result.residual_summary = (
        f"Residual classification: "
        f"{classification}. "
        f"Residual strength: "
        f"{round(residual_strength * 100, 1)}%. "
        f"Contradictions: "
        f"{contradiction_text}."
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    result.metadata = {
        "base_residual":
            base_residual,

        "fusion_ambiguity":
            fusion.ambiguity_score,

        "dominant_candidate":
            fusion.dominant_candidate.candidate_type
            if fusion.dominant_candidate
            else None,
    }

    return result


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    from isees_uap.kod.engines.aviation_engine import (
        reconstruct_aviation_candidates,
    )

    from isees_uap.kod.fusion.candidate_fusion import (
        fuse_candidates,
    )

    # --------------------------------------------------------
    # TEST OBSERVATION
    # --------------------------------------------------------

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.object_shape = "bright_light"

    observation.estimated_altitude_ft = 30000

    observation.estimated_speed_kts = 420

    observation.sound_description = (
        "silent"
    )

    observation.movement_description = (
        "moving instantly with impossible "
        "vertical maneuvering"
    )

    # --------------------------------------------------------
    # RECONSTRUCTION
    # --------------------------------------------------------

    candidates = (
        reconstruct_aviation_candidates(
            observation
        )
    )

    # --------------------------------------------------------
    # FUSION
    # --------------------------------------------------------

    fusion = fuse_candidates(
        candidates
    )

    # --------------------------------------------------------
    # RESIDUAL ANALYSIS
    # --------------------------------------------------------

    residual = analyze_residual_emergence(
        observation,
        fusion,
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("================================================")
    print("KOD RESIDUAL ENGINE")
    print("================================================")
    print()

    print("FUSION SUMMARY")
    print("----------------")
    print()

    pprint(fusion.to_dict())

    print()
    print("RESIDUAL ANALYSIS")
    print("-----------------")
    print()

    pprint(residual.to_dict())

    print()