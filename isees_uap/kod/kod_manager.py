# ============================================================
# kod_manager.py
# KOD — EXECUTION GOVERNANCE LAYER (V3)
# ============================================================

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.kod_pipeline import (
    KODPipelineResult,
    run_kod_pipeline,
)


# ============================================================
# ENGINE REGISTRATION
# ============================================================

@dataclass
class EngineRegistration:
    """
    Registered KOD engine definition.
    """

    name: str

    enabled: bool = True

    priority: int = 100

    description: str = ""

    execution_mode: str = "standard"

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )


# ============================================================
# KOD EXECUTION POLICY
# ============================================================

@dataclass
class KODExecutionPolicy:
    """
    Pipeline execution behavior.
    """

    mode: str = "standard"

    enable_aviation: bool = True
    enable_orbital: bool = False
    enable_astronomy: bool = False
    enable_weather: bool = False
    enable_sensor: bool = False
    enable_terrain: bool = False

    fail_open: bool = True

    max_engine_failures: int = 3

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )


# ============================================================
# EXECUTION RESULT
# ============================================================

@dataclass
class KODManagerResult:
    """
    Top-level KOD execution result.
    """

    pipeline_result: Optional[
        KODPipelineResult
    ] = None

    engines_executed: List[str] = field(
        default_factory=list
    )

    engines_failed: List[str] = field(
        default_factory=list
    )

    execution_mode: str = "standard"

    execution_success: bool = False

    execution_summary: str = ""

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return {
            "execution_mode":
                self.execution_mode,

            "execution_success":
                self.execution_success,

            "engines_executed":
                self.engines_executed,

            "engines_failed":
                self.engines_failed,

            "execution_summary":
                self.execution_summary,

            "pipeline_result":
                self.pipeline_result.to_dict()
                if self.pipeline_result
                else None,

            "metadata":
                self.metadata,
        }


# ============================================================
# KOD MANAGER
# ============================================================

class KODManager:
    """
    Canonical KOD orchestration layer.

    Responsible for:

    - engine registration
    - execution governance
    - execution isolation
    - execution policy
    - future async orchestration
    - future multi-engine fusion
    """

    # ========================================================
    # INIT
    # ========================================================

    def __init__(self):

        self.engine_registry: Dict[
            str,
            EngineRegistration,
        ] = {}

        self.register_default_engines()

    # ========================================================
    # ENGINE REGISTRATION
    # ========================================================

    def register_engine(
        self,
        registration: EngineRegistration,
    ):

        self.engine_registry[
            registration.name
        ] = registration

    # ========================================================
    # DEFAULT ENGINES
    # ========================================================

    def register_default_engines(self):

        self.register_engine(
            EngineRegistration(
                name="aviation_engine",
                enabled=True,
                priority=1,
                description=(
                    "Aircraft reconstruction engine"
                ),
            )
        )

        self.register_engine(
            EngineRegistration(
                name="orbital_engine",
                enabled=False,
                priority=2,
                description=(
                    "Satellite and orbital analysis"
                ),
            )
        )

        self.register_engine(
            EngineRegistration(
                name="astronomy_engine",
                enabled=False,
                priority=3,
                description=(
                    "Astronomical object analysis"
                ),
            )
        )

        # ----------------------------------------------------
        # WEATHER ENGINE ENABLED
        # ----------------------------------------------------

        self.register_engine(
            EngineRegistration(
                name="weather_engine",
                enabled=True,
                priority=4,
                description=(
                    "Atmospheric and weather analysis"
                ),
            )
        )

        self.register_engine(
            EngineRegistration(
                name="sensor_engine",
                enabled=False,
                priority=5,
                description=(
                    "Sensor artifact analysis"
                ),
            )
        )

        self.register_engine(
            EngineRegistration(
                name="terrain_engine",
                enabled=False,
                priority=6,
                description=(
                    "Terrain and occlusion analysis"
                ),
            )
        )

    # ========================================================
    # ACTIVE ENGINE SELECTION
    # ========================================================

    def get_active_engines(
        self,
        policy: KODExecutionPolicy,
    ) -> List[str]:

        engines = []

        if (
            policy.enable_aviation
            and self.engine_registry[
                "aviation_engine"
            ].enabled
        ):

            engines.append(
                "aviation_engine"
            )

        if (
            policy.enable_orbital
            and self.engine_registry[
                "orbital_engine"
            ].enabled
        ):

            engines.append(
                "orbital_engine"
            )

        if (
            policy.enable_astronomy
            and self.engine_registry[
                "astronomy_engine"
            ].enabled
        ):

            engines.append(
                "astronomy_engine"
            )

        if (
            policy.enable_weather
            and self.engine_registry[
                "weather_engine"
            ].enabled
        ):

            engines.append(
                "weather_engine"
            )

        if (
            policy.enable_sensor
            and self.engine_registry[
                "sensor_engine"
            ].enabled
        ):

            engines.append(
                "sensor_engine"
            )

        if (
            policy.enable_terrain
            and self.engine_registry[
                "terrain_engine"
            ].enabled
        ):

            engines.append(
                "terrain_engine"
            )

        return engines

    # ========================================================
    # MAIN EXECUTION
    # ========================================================

    def execute(
        self,
        observation: ObservationContext,
        policy: Optional[
            KODExecutionPolicy
        ] = None,
    ) -> KODManagerResult:

        if policy is None:

            policy = KODExecutionPolicy()

        result = KODManagerResult()

        result.execution_mode = (
            policy.mode
        )

        # ----------------------------------------------------
        # ENGINE SELECTION
        # ----------------------------------------------------

        active_engines = (
            self.get_active_engines(
                policy
            )
        )

        # ----------------------------------------------------
        # EXECUTION
        # ----------------------------------------------------

        try:

            pipeline_result = (
                run_kod_pipeline(
                    observation,
                    active_engines=active_engines,
                    policy=policy,
                )
            )

            result.pipeline_result = (
                pipeline_result
            )

            result.engines_executed = (
                active_engines
            )

            result.execution_success = True

            result.execution_summary = (
                f"KOD manager completed "
                f"successfully using "
                f"{len(active_engines)} "
                f"engine(s)."
            )

        except Exception as e:

            result.execution_success = False

            result.engines_failed.extend(
                active_engines
            )

            result.execution_summary = (
                f"KOD execution failure: "
                f"{str(e)}"
            )

            if not policy.fail_open:

                raise

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------

        result.metadata = {
            "registered_engines":
                list(
                    self.engine_registry.keys()
                ),

            "active_engines":
                active_engines,

            "policy_mode":
                policy.mode,
        }

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
    # MANAGER
    # --------------------------------------------------------

    manager = KODManager()

    # --------------------------------------------------------
    # POLICY
    # --------------------------------------------------------

    policy = KODExecutionPolicy()

    policy.mode = "deep_analysis"

    policy.enable_aviation = True
    policy.enable_weather = True

    # --------------------------------------------------------
    # EXECUTION
    # --------------------------------------------------------

    result = manager.execute(
        observation,
        policy,
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("================================================")
    print("KOD MANAGER")
    print("================================================")
    print()

    pprint(result.to_dict())

    print()