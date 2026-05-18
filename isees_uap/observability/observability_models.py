# ============================================================
# observability_models.py
# iSEES — OBSERVABILITY SUBSYSTEM
# CANONICAL OBSERVABILITY MODELS
# ============================================================

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional, List
from datetime import datetime, UTC
import uuid

from isees_uap.observability.observability_types import (

    InfrastructureEpoch,

    AuthorityState,

    ReconstructionMode,

    ConservationConstraint,

    EpistemicState,
)


# ============================================================
# OBSERVABILITY COMPONENT
# ============================================================

@dataclass
class ObservabilityComponent:
    """
    Individual observability dimension.

    Represents one deterministic topology layer
    contributing to overall observability geometry.
    """

    component_name: str

    score: float = 0.0

    confidence: float = 0.5

    source: Optional[str] = None

    provider: Optional[str] = None

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# CONSTRAINT PROFILE
# ============================================================

@dataclass
class ConstraintProfile:
    """
    Immutable manifold conservation profile.

    Defines which dimensions of reality are
    preserved during reconstruction and
    topology comparison.
    """

    preserve_spatial: bool = True

    preserve_temporal: bool = True

    preserve_epoch: bool = True

    preserve_authority_state: bool = True

    preserve_observability_field: bool = True

    preserve_infrastructure_maturity: bool = True

    preserve_sensor_capability: bool = True

    preserve_reporting_survivability: bool = True

    preserve_archival_persistence: bool = True

    constraints: List[
        ConservationConstraint
    ] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# RECONSTRUCTION PROFILE
# ============================================================

@dataclass
class ReconstructionProfile:
    """
    Canonical replay reconstruction profile.

    Defines how the backend reconstructs
    epistemic topology and manifold comparison.
    """

    reconstruction_mode: ReconstructionMode = (
        ReconstructionMode.STRICT_HISTORICAL
    )

    epistemic_state: EpistemicState = (
        EpistemicState.PERIOD_CORRECT
    )

    infrastructure_epoch: InfrastructureEpoch = (
        InfrastructureEpoch.MODERN_SENSOR_FUSION
    )

    authority_state: AuthorityState = (
        AuthorityState.UNKNOWN
    )

    constraint_profile: ConstraintProfile = field(
        default_factory=ConstraintProfile
    )

    replay_safe: bool = True

    immutable_lineage: bool = True

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# TEMPORAL OBSERVABILITY STATE
# ============================================================

@dataclass
class TemporalObservabilityState:
    """
    Historical observability state snapshot.

    Represents period-correct infrastructure
    and authority conditions at a spacetime node.
    """

    timestamp_utc: Optional[str] = None

    infrastructure_epoch: InfrastructureEpoch = (
        InfrastructureEpoch.MODERN_SENSOR_FUSION
    )

    authority_state: AuthorityState = (
        AuthorityState.UNKNOWN
    )

    epistemic_state: EpistemicState = (
        EpistemicState.PERIOD_CORRECT
    )

    historically_constrained: bool = True

    replay_layer: str = "T0"

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# OBSERVABILITY FIELD
# ============================================================

@dataclass
class ObservabilityField:
    """
    Canonical manifold observability field.

    Represents normalized environmental observability
    at a specific spacetime coordinate.
    """

    # --------------------------------------------------------
    # CORE IDENTITY
    # --------------------------------------------------------

    field_id: str = field(

        default_factory=lambda:
        f"OBSFIELD-{uuid.uuid4().hex[:8].upper()}"
    )

    created_utc: str = field(

        default_factory=lambda:
        datetime.now(UTC).isoformat()
    )

    # --------------------------------------------------------
    # SPACETIME ANCHOR
    # --------------------------------------------------------

    latitude: float = 0.0

    longitude: float = 0.0

    altitude_m: Optional[float] = None

    timestamp_utc: Optional[str] = None

    # --------------------------------------------------------
    # TEMPORAL EPISTEMIC STATE
    # --------------------------------------------------------

    temporal_state: TemporalObservabilityState = field(
        default_factory=TemporalObservabilityState
    )

    reconstruction_profile: ReconstructionProfile = field(
        default_factory=ReconstructionProfile
    )

    # --------------------------------------------------------
    # CORE COMPONENTS
    # --------------------------------------------------------

    population_density: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="population_density"
        )
    )

    infrastructure_density: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="infrastructure_density"
        )
    )

    aviation_density: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="aviation_density"
        )
    )

    sensor_density: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="sensor_density"
        )
    )

    communications_coverage: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="communications_coverage"
        )
    )

    visibility_quality: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="visibility_quality"
        )
    )

    terrain_accessibility: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="terrain_accessibility"
        )
    )

    historical_reporting_probability: ObservabilityComponent = field(

        default_factory=lambda:
        ObservabilityComponent(
            component_name="historical_reporting_probability"
        )
    )

    # --------------------------------------------------------
    # FUSED OUTPUT
    # --------------------------------------------------------

    observability_score: float = 0.0

    observer_probability: float = 0.0

    sensor_visibility_score: float = 0.0

    environmental_visibility_score: float = 0.0

    # --------------------------------------------------------
    # FIELD STABILITY
    # --------------------------------------------------------

    normalization_floor: float = 0.05

    stabilization_applied: bool = False

    # --------------------------------------------------------
    # SYSTEM
    # --------------------------------------------------------

    confidence: float = 0.5

    provider_count: int = 0

    temporal_weighting_applied: bool = False

    stale: bool = False

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    tags: List[str] = field(
        default_factory=list
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)

    # ========================================================
    # SUMMARY
    # ========================================================

    def summary(self) -> Dict[str, Any]:

        return {

            "field_id":
                self.field_id,

            "lat":
                self.latitude,

            "lon":
                self.longitude,

            "timestamp_utc":
                self.timestamp_utc,

            "observability_score":
                self.observability_score,

            "observer_probability":
                self.observer_probability,

            "sensor_visibility_score":
                self.sensor_visibility_score,

            "environmental_visibility_score":
                self.environmental_visibility_score,

            "confidence":
                self.confidence,

            "provider_count":
                self.provider_count,

            "stale":
                self.stale,

            "infrastructure_epoch":
                self.temporal_state
                .infrastructure_epoch
                .value,

            "authority_state":
                self.temporal_state
                .authority_state
                .value,

            "epistemic_state":
                self.temporal_state
                .epistemic_state
                .value,

            "replay_layer":
                self.temporal_state
                .replay_layer,

            "reconstruction_mode":
                self.reconstruction_profile
                .reconstruction_mode
                .value,
        }


# ============================================================
# OBSERVABILITY SNAPSHOT
# ============================================================

@dataclass
class ObservabilitySnapshot:
    """
    Lightweight manifold attachment object.

    Intended for attaching observability state
    to clusters/events without embedding the
    full field object.
    """

    field_id: Optional[str] = None

    observability_score: float = 0.0

    observer_probability: float = 0.0

    visibility_quality: float = 0.0

    sensor_density: float = 0.0

    population_density: float = 0.0

    confidence: float = 0.5

    stale: bool = False

    temporal_state: Optional[
        TemporalObservabilityState
    ] = None

    reconstruction_profile: Optional[
        ReconstructionProfile
    ] = None

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# OBSERVABILITY CONTEXT
# ============================================================

@dataclass
class ObservabilityContext:
    """
    Runtime observability resolution context.

    Defines what coordinates and environmental
    constraints should be evaluated.
    """

    latitude: float

    longitude: float

    timestamp_utc: Optional[str] = None

    altitude_m: Optional[float] = None

    weather_override: Optional[str] = None

    terrain_override: Optional[str] = None

    emergency_mode: bool = False

    high_precision: bool = False

    reconstruction_profile: ReconstructionProfile = field(
        default_factory=ReconstructionProfile
    )

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:

        return asdict(self)


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    field_model = ObservabilityField()

    field_model.latitude = 42.374
    field_model.longitude = -122.871

    field_model.observability_score = 0.72
    field_model.observer_probability = 0.81

    print()
    print("================================================")
    print("OBSERVABILITY FIELD MODEL")
    print("================================================")
    print()

    print(field_model.summary())

    print()