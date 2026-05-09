# ============================================================
# kod_pipeline.py
# KOD — CANONICAL CONTEXTUAL COLLAPSE PIPELINE
# ============================================================

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.models.candidate import (
    Candidate,
)

from isees_uap.kod.kaod.engines.aviation_engine import (
    reconstruct_aviation_candidates,
)

from isees_uap.kod.kaod.engines.weather_engine import (
    reconstruct_weather_candidates,
)

from isees_uap.kod.fusion.candidate_fusion import (
    FusionResult,
    fuse_candidates,
)

from isees_uap.kod.residual.residual_engine import (
    ResidualResult,
    analyze_residual_emergence,
)


# ============================================================
# KOD PIPELINE RESULT
# ============================================================

@dataclass
class KODPipelineResult:
    """
    Canonical KOD execution result.
    """

    observation: ObservationContext

    candidates: List[Candidate] = field(
        default_factory=list
    )

    fusion: Optional[FusionResult] = None

    residual: Optional[ResidualResult] = None

    kod_complete: bool = False

    execution_summary: str = ""

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return {
            "observation":
                self.observation.summary(),

            "candidate_count":
                len(self.candidates),

            "candidates":
                [
                    c.summary()
                    for c in self.candidates
                ],

            "fusion":
                self.fusion.to_dict()
                if self.fusion
                else None,

            "residual":
                self.residual.to_dict()
                if self.residual
                else None,

            "kod_complete":
                self.kod_complete,

            "execution_summary":
                self.execution_summary,

            "metadata":
                self.metadata,
        }


# ============================================================
# MAIN PIPELINE
# ============================================================

def run_kod_pipeline(
    observation: ObservationContext,
    active_engines: Optional[List[str]] = None,
    policy: Optional[Any] = None,
) -> KODPipelineResult:

    """
    Canonical deterministic contextual collapse pipeline.

    Observation
    → Reconstruction
    → Candidate Fusion
    → Residual Emergence Extraction
    """

    result = KODPipelineResult(
        observation=observation
    )

    # --------------------------------------------------------
    # DEFAULT ENGINE STATE
    # --------------------------------------------------------

    if active_engines is None:

        active_engines = [
            "aviation_engine"
        ]

    # --------------------------------------------------------
    # ENGINE EXECUTION
    # --------------------------------------------------------

    engines_run = []

    # --------------------------------------------------------
    # AVIATION ENGINE
    # --------------------------------------------------------

    if "aviation_engine" in active_engines:

        aviation_candidates = (
            reconstruct_aviation_candidates(
                observation
            )
        )

        result.candidates.extend(
            aviation_candidates
        )

        engines_run.append(
            "aviation_engine"
        )

    # --------------------------------------------------------
    # ORBITAL ENGINE
    # --------------------------------------------------------

    if "orbital_engine" in active_engines:

        # future orbital reconstruction
        engines_run.append(
            "orbital_engine"
        )

    # --------------------------------------------------------
    # ASTRONOMY ENGINE
    # --------------------------------------------------------

    if "astronomy_engine" in active_engines:

        # future astronomy reconstruction
        engines_run.append(
            "astronomy_engine"
        )

    # --------------------------------------------------------
    # WEATHER ENGINE
    # --------------------------------------------------------

    if "weather_engine" in active_engines:

        weather_candidates = (
            reconstruct_weather_candidates(
                observation
            )
        )

        result.candidates.extend(
            weather_candidates
        )

        engines_run.append(
            "weather_engine"
        )

    # --------------------------------------------------------
    # SENSOR ENGINE
    # --------------------------------------------------------

    if "sensor_engine" in active_engines:

        # future sensor reconstruction
        engines_run.append(
            "sensor_engine"
        )

    # --------------------------------------------------------
    # TERRAIN ENGINE
    # --------------------------------------------------------

    if "terrain_engine" in active_engines:

        # future terrain reconstruction
        engines_run.append(
            "terrain_engine"
        )

    # --------------------------------------------------------
    # UPDATE OBSERVATION STATE
    # --------------------------------------------------------

    observation.candidate_count = (
        len(result.candidates)
    )

    # --------------------------------------------------------
    # FUSION
    # --------------------------------------------------------

    fusion = fuse_candidates(
        result.candidates
    )

    result.fusion = fusion

    # --------------------------------------------------------
    # RESIDUAL ANALYSIS
    # --------------------------------------------------------

    residual = analyze_residual_emergence(
        observation,
        fusion,
    )

    result.residual = residual

    # --------------------------------------------------------
    # UPDATE OBSERVATION STATE
    # --------------------------------------------------------

    observation.residual_score = (
        residual.residual_strength
    )

    observation.kod_complete = True

    # --------------------------------------------------------
    # EXECUTION SUMMARY
    # --------------------------------------------------------

    dominant = (
        fusion.dominant_candidate
    )

    if dominant:

        dominant_type = (
            dominant.candidate_type
        )

        dominant_alignment = (
            round(
                dominant.match_scores
                .overall_alignment * 100,
                1,
            )
        )

    else:

        dominant_type = "none"

        dominant_alignment = 0.0

    result.execution_summary = (
        f"KOD completed. "
        f"Dominant candidate: "
        f"{dominant_type}. "
        f"Alignment confidence: "
        f"{dominant_alignment}%. "
        f"Residual classification: "
        f"{residual.residual_classification}."
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    result.metadata = {
        "pipeline_version":
            "KOD_V3",

        "engine_count":
            len(engines_run),

        "engines_run":
            engines_run,

        "fusion_complete":
            result.fusion is not None,

        "residual_complete":
            result.residual is not None,

        "active_engines":
            active_engines,
    }

    # --------------------------------------------------------
    # FINALIZE
    # --------------------------------------------------------

    result.kod_complete = True

    return result


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    # --------------------------------------------------------
    # TEST OBSERVATION
    # --------------------------------------------------------

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.geo.city = "Medford"
    observation.geo.state = "Oregon"

    observation.object_shape = (
        "bright_white_light"
    )

    observation.object_color = (
        "white"
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

    observation.raw_description = (
        "Bright white object moving rapidly "
        "with impossible maneuvering and "
        "no audible sound."
    )

    # --------------------------------------------------------
    # ACTIVE ENGINES
    # --------------------------------------------------------

    active_engines = [
        "aviation_engine",
        "weather_engine",
    ]

    # --------------------------------------------------------
    # RUN PIPELINE
    # --------------------------------------------------------

    result = run_kod_pipeline(
        observation,
        active_engines=active_engines,
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("================================================")
    print("KOD PIPELINE")
    print("================================================")
    print()

    pprint(result.to_dict())

    print()