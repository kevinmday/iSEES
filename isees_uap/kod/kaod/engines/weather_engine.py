# ============================================================
# weather_engine.py
# WEATHER DECONFLICTION ENGINE
# ============================================================

from typing import List

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.models.candidate import (
    Candidate,
)


# ============================================================
# WEATHER CANDIDATE GENERATION
# ============================================================

def reconstruct_weather_candidates(
    observation: ObservationContext,
) -> List[Candidate]:

    """
    Deterministic atmospheric and weather
    deconfliction engine.

    Generates possible atmospheric explanation
    candidates which contribute explanatory
    pressure into manifold collapse.

    This engine DOES NOT conclude.

    It contributes:
    - alignment pressure
    - contradiction pressure
    - environmental plausibility
    """

    candidates = []

    # --------------------------------------------------------
    # LIGHT SCATTER EVENT
    # --------------------------------------------------------

    if (
        observation.object_shape
        in [
            "bright_white_light",
            "diffuse_glow",
            "orb",
        ]
    ):

        candidate = Candidate()

        candidate.candidate_type = (
            "light_scatter_event"
        )

        candidate.source_engine = (
            "weather_engine"
        )

        candidate.source_provider = (
            "deterministic_ruleset"
        )

        candidate.confidence_score = 0.34

        # ----------------------------------------------------
        # MATCHING
        # ----------------------------------------------------

        candidate.match_scores.overall_alignment = (
            0.34
        )

        candidate.match_scores.anomaly_conflict = (
            0.66
        )

        candidate.match_scores.contradiction_pressure = (
            0.66
        )

        candidate.match_scores.explanatory_completeness = (
            0.34
        )

        candidate.match_scores.residual_pressure = (
            0.66
        )

        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        candidate.status.likely_match = False

        candidate.status.partial_match = True

        candidate.status.unresolved = True

        candidate.status.elimination_confidence = (
            0.34
        )

        candidate.status.anomaly_conflict_score = (
            0.66
        )

        candidate.status.contradiction_summary = [
            "instant_maneuver_profile",
        ]

        candidate.status.unresolved_features = [
            "persistent_visual_tracking",
        ]

        # ----------------------------------------------------
        # EXPLANATION
        # ----------------------------------------------------

        candidate.explanation = (
            "Possible atmospheric light "
            "scatter phenomenon."
        )

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------

        candidate.metadata = {
            "supports": [
                "brightness",
                "silent_behavior",
            ],

            "contradictions": [
                "persistent_directional_tracking",
                "instant_maneuver_profile",
            ],

            "weather_hypothesis":
                "light_scatter_event",
        }

        candidates.append(
            candidate
        )

    # --------------------------------------------------------
    # TEMPERATURE INVERSION
    # --------------------------------------------------------

    if (
        observation.sound_description
        == "silent"
    ):

        candidate = Candidate()

        candidate.candidate_type = (
            "temperature_inversion"
        )

        candidate.source_engine = (
            "weather_engine"
        )

        candidate.source_provider = (
            "deterministic_ruleset"
        )

        candidate.confidence_score = 0.22

        # ----------------------------------------------------
        # MATCHING
        # ----------------------------------------------------

        candidate.match_scores.overall_alignment = (
            0.22
        )

        candidate.match_scores.anomaly_conflict = (
            0.78
        )

        candidate.match_scores.contradiction_pressure = (
            0.78
        )

        candidate.match_scores.explanatory_completeness = (
            0.22
        )

        candidate.match_scores.residual_pressure = (
            0.78
        )

        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        candidate.status.likely_match = False

        candidate.status.partial_match = True

        candidate.status.unresolved = True

        candidate.status.elimination_confidence = (
            0.22
        )

        candidate.status.anomaly_conflict_score = (
            0.78
        )

        candidate.status.contradiction_summary = [
            "extreme_maneuverability",
        ]

        candidate.status.unresolved_features = [
            "rapid_altitude_change",
        ]

        # ----------------------------------------------------
        # EXPLANATION
        # ----------------------------------------------------

        candidate.explanation = (
            "Possible atmospheric temperature "
            "inversion effect."
        )

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------

        candidate.metadata = {
            "supports": [
                "sound_suppression",
                "distance_distortion",
            ],

            "contradictions": [
                "extreme_maneuverability",
                "rapid_altitude_change",
            ],

            "weather_hypothesis":
                "temperature_inversion",
        }

        candidates.append(
            candidate
        )

    # --------------------------------------------------------
    # RADAR DUCTING
    # --------------------------------------------------------

    if (
        observation.estimated_altitude_ft
        and observation.estimated_altitude_ft
        > 20000
    ):

        candidate = Candidate()

        candidate.candidate_type = (
            "radar_ducting"
        )

        candidate.source_engine = (
            "weather_engine"
        )

        candidate.source_provider = (
            "deterministic_ruleset"
        )

        candidate.confidence_score = 0.18

        # ----------------------------------------------------
        # MATCHING
        # ----------------------------------------------------

        candidate.match_scores.overall_alignment = (
            0.18
        )

        candidate.match_scores.anomaly_conflict = (
            0.82
        )

        candidate.match_scores.contradiction_pressure = (
            0.82
        )

        candidate.match_scores.explanatory_completeness = (
            0.18
        )

        candidate.match_scores.residual_pressure = (
            0.82
        )

        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        candidate.status.likely_match = False

        candidate.status.partial_match = True

        candidate.status.unresolved = True

        candidate.status.elimination_confidence = (
            0.18
        )

        candidate.status.anomaly_conflict_score = (
            0.82
        )

        candidate.status.contradiction_summary = [
            "visual_confirmation_conflict",
        ]

        candidate.status.unresolved_features = [
            "stable_visual_tracking",
        ]

        # ----------------------------------------------------
        # EXPLANATION
        # ----------------------------------------------------

        candidate.explanation = (
            "Possible radar propagation "
            "distortion event."
        )

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------

        candidate.metadata = {
            "supports": [
                "possible_radar_distortion",
                "long_range_reflection",
            ],

            "contradictions": [
                "visual_confirmation",
                "stable_visual_tracking",
            ],

            "weather_hypothesis":
                "radar_ducting",
        }

        candidates.append(
            candidate
        )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return candidates


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    observation = ObservationContext()

    observation.object_shape = (
        "bright_white_light"
    )

    observation.sound_description = (
        "silent"
    )

    observation.estimated_altitude_ft = (
        30000
    )

    candidates = (
        reconstruct_weather_candidates(
            observation
        )
    )

    print()
    print("================================================")
    print("WEATHER ENGINE")
    print("================================================")
    print()

    for candidate in candidates:

        pprint(
            candidate.summary()
        )

        print()