# ============================================================
# observation_context.py
# KOD — CANONICAL OBSERVATION CONTEXT MODEL
# ============================================================

from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Any
from datetime import datetime, UTC
import uuid


# ============================================================
# OBSERVER CONTEXT
# ============================================================

@dataclass
class ObserverContext:
    observer_id: Optional[str] = None
    observer_type: str = "civilian"

    platform: Optional[str] = None
    sensor_type: Optional[str] = None

    motion_state: Optional[str] = None
    viewing_direction: Optional[str] = None

    notes: Optional[str] = None


# ============================================================
# ENVIRONMENT CONTEXT
# ============================================================

@dataclass
class EnvironmentContext:
    weather_condition: Optional[str] = None

    visibility_km: Optional[float] = None
    cloud_cover_percent: Optional[float] = None

    wind_speed_kts: Optional[float] = None
    precipitation: Optional[str] = None

    moon_phase: Optional[str] = None

    terrain_type: Optional[str] = None

    notes: Optional[str] = None


# ============================================================
# SENSOR CONTEXT
# ============================================================

@dataclass
class SensorContext:
    sensor_name: Optional[str] = None
    sensor_category: Optional[str] = None

    infrared_available: bool = False
    radar_available: bool = False
    optical_available: bool = True

    zoom_level: Optional[float] = None

    line_of_sight_km: Optional[float] = None

    notes: Optional[str] = None


# ============================================================
# GEO CONTEXT
# ============================================================

@dataclass
class GeoContext:
    latitude: float = 0.0
    longitude: float = 0.0

    altitude_m: Optional[float] = None

    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

    nearest_airport: Optional[str] = None

    timezone: Optional[str] = None

    terrain_elevation_m: Optional[float] = None

    notes: Optional[str] = None


# ============================================================
# OBSERVATION CONTEXT
# ============================================================

@dataclass
class ObservationContext:
    """
    Canonical spacetime anchor for KOD reconstruction.

    EVERYTHING in KOD depends on this object.
    """

    # --------------------------------------------------------
    # CORE IDENTITY
    # --------------------------------------------------------

    observation_id: str = field(
        default_factory=lambda: f"OBS-{uuid.uuid4().hex[:8].upper()}"
    )

    created_utc: str = field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )

    # --------------------------------------------------------
    # TEMPORAL ANCHOR
    # --------------------------------------------------------

    observation_time_utc: str = field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )

    duration_seconds: Optional[float] = None

    # --------------------------------------------------------
    # GEO ANCHOR
    # --------------------------------------------------------

    geo: GeoContext = field(default_factory=GeoContext)

    # --------------------------------------------------------
    # OBSERVER
    # --------------------------------------------------------

    observer: ObserverContext = field(default_factory=ObserverContext)

    # --------------------------------------------------------
    # ENVIRONMENT
    # --------------------------------------------------------

    environment: EnvironmentContext = field(
        default_factory=EnvironmentContext
    )

    # --------------------------------------------------------
    # SENSOR
    # --------------------------------------------------------

    sensor: SensorContext = field(default_factory=SensorContext)

    # --------------------------------------------------------
    # RAW OBSERVATION
    # --------------------------------------------------------

    raw_description: Optional[str] = None

    object_shape: Optional[str] = None
    object_color: Optional[str] = None

    object_count: Optional[int] = None

    movement_description: Optional[str] = None

    sound_description: Optional[str] = None

    light_behavior: Optional[str] = None

    # --------------------------------------------------------
    # ANGULAR OBSERVATION DATA
    # --------------------------------------------------------

    azimuth_deg: Optional[float] = None
    elevation_deg: Optional[float] = None

    estimated_distance_km: Optional[float] = None

    estimated_altitude_ft: Optional[float] = None

    estimated_speed_kts: Optional[float] = None

    # --------------------------------------------------------
    # SYSTEM FLAGS
    # --------------------------------------------------------

    confidence: float = 0.5

    is_clustered: bool = False
    is_recurrent: bool = False

    escalation_level: str = "LOW"

    # --------------------------------------------------------
    # PIPELINE STATE
    # --------------------------------------------------------

    normalization_complete: bool = False
    geo_resolution_complete: bool = False

    kod_complete: bool = False

    candidate_count: int = 0

    residual_score: Optional[float] = None

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    tags: List[str] = field(default_factory=list)

    metadata: Dict[str, Any] = field(default_factory=dict)

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    # ========================================================
    # DEBUG SUMMARY
    # ========================================================

    def summary(self) -> Dict[str, Any]:
        return {
            "observation_id": self.observation_id,
            "time": self.observation_time_utc,
            "lat": self.geo.latitude,
            "lon": self.geo.longitude,
            "city": self.geo.city,
            "state": self.geo.state,
            "shape": self.object_shape,
            "movement": self.movement_description,
            "confidence": self.confidence,
            "candidate_count": self.candidate_count,
            "residual_score": self.residual_score,
            "kod_complete": self.kod_complete,
        }


# ============================================================
# FACTORY
# ============================================================

def build_observation_context(
    latitude: float,
    longitude: float,
    description: str,
    observation_time_utc: Optional[str] = None,
) -> ObservationContext:
    """
    Simple helper factory for creating canonical contexts.
    """

    ctx = ObservationContext()

    ctx.geo.latitude = latitude
    ctx.geo.longitude = longitude

    ctx.raw_description = description

    if observation_time_utc:
        ctx.observation_time_utc = observation_time_utc

    return ctx


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    ctx = build_observation_context(
        latitude=42.375,
        longitude=-122.873,
        description="Bright white object moving silently northbound.",
    )

    print()
    print("================================================")
    print("KOD OBSERVATION CONTEXT")
    print("================================================")
    print()

    print(ctx.summary())

    print()