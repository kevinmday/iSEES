# ============================================================
# normalized_observation.py
# iSEES — CANONICAL NORMALIZED OBSERVATION MODEL
# ============================================================

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional, List
from datetime import datetime, UTC
import uuid


# ============================================================
# NORMALIZED OBSERVATION
# ============================================================

@dataclass
class NormalizedObservation:
    """
    Canonical normalized observation object.

    This model represents the stabilized,
    normalized manifold-ready observation
    used throughout the iSEES pipeline.

    This object intentionally remains:

        deterministic
        transportable
        provider-agnostic
        topology-safe

    Observability fields are attached only
    as lightweight references/snapshots.

    The full observability field remains an
    independent manifold subsystem.
    """

    # --------------------------------------------------------
    # CORE IDENTITY
    # --------------------------------------------------------

    observation_id: str = field(

        default_factory=lambda:
        f"OBS-{uuid.uuid4().hex[:8].upper()}"
    )

    created_utc: str = field(

        default_factory=lambda:
        datetime.now(UTC).isoformat()
    )

    # --------------------------------------------------------
    # RAW INPUT
    # --------------------------------------------------------

    raw_text: Optional[str] = None

    source: Optional[str] = None

    source_type: Optional[str] = None

    provenance: Optional[str] = None

    # --------------------------------------------------------
    # SPACETIME
    # --------------------------------------------------------

    latitude: Optional[float] = None

    longitude: Optional[float] = None

    altitude_m: Optional[float] = None

    timestamp_utc: Optional[str] = None

    timezone: Optional[str] = None

    # --------------------------------------------------------
    # SEMANTICS
    # --------------------------------------------------------

    normalized_text: Optional[str] = None

    semantic_tokens: List[str] = field(
        default_factory=list
    )

    semantic_vector: List[float] = field(
        default_factory=list
    )

    language: Optional[str] = None

    # --------------------------------------------------------
    # OBSERVER
    # --------------------------------------------------------

    observer_count: int = 1

    observer_type: Optional[str] = None

    observer_confidence: float = 0.5

    # --------------------------------------------------------
    # SENSOR CONTEXT
    # --------------------------------------------------------

    sensor_types: List[str] = field(
        default_factory=list
    )

    sensor_confidence: float = 0.5

    # --------------------------------------------------------
    # ENVIRONMENT
    # --------------------------------------------------------

    weather: Optional[str] = None

    visibility_conditions: Optional[str] = None

    terrain_type: Optional[str] = None

    environment_context: Dict[str, Any] = field(
        default_factory=dict
    )

    # --------------------------------------------------------
    # OBSERVABILITY ATTACHMENT
    # --------------------------------------------------------

    observability_field_id: Optional[str] = None

    observability_snapshot: Dict[str, Any] = field(
        default_factory=dict
    )

    normalized_emergence: Optional[float] = None

    observability_confidence: Optional[float] = None

    # --------------------------------------------------------
    # PIPELINE STATE
    # --------------------------------------------------------

    normalized: bool = False

    validated: bool = False

    clustered: bool = False

    kod_processed: bool = False

    topology_processed: bool = False

    # --------------------------------------------------------
    # SCORING
    # --------------------------------------------------------

    confidence: float = 0.5

    corroboration_score: float = 0.0

    anomaly_score: float = 0.0

    # --------------------------------------------------------
    # TAGS
    # --------------------------------------------------------

    tags: List[str] = field(
        default_factory=list
    )

    warnings: List[str] = field(
        default_factory=list
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

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

            "observation_id":
                self.observation_id,

            "timestamp_utc":
                self.timestamp_utc,

            "latitude":
                self.latitude,

            "longitude":
                self.longitude,

            "source":
                self.source,

            "normalized":
                self.normalized,

            "confidence":
                round(
                    self.confidence,
                    3
                ),

            "normalized_emergence":
                self.normalized_emergence,

            "observability_field_id":
                self.observability_field_id,

            "tags":
                self.tags,
        }

    # ========================================================
    # OBSERVABILITY ATTACHMENT
    # ========================================================

    def attach_observability(
        self,
        field_id: str,
        snapshot: Dict[str, Any],
        normalized_emergence: float,
        confidence: float,
    ) -> None:

        self.observability_field_id = (
            field_id
        )

        self.observability_snapshot = (
            snapshot
        )

        self.normalized_emergence = (
            normalized_emergence
        )

        self.observability_confidence = (
            confidence
        )

    # ========================================================
    # TAG HELPERS
    # ========================================================

    def add_tag(
        self,
        tag: str
    ) -> None:

        if tag not in self.tags:

            self.tags.append(tag)

    def add_warning(
        self,
        warning: str
    ) -> None:

        if warning not in self.warnings:

            self.warnings.append(
                warning
            )


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    obs = NormalizedObservation()

    obs.raw_text = (
        "Large silent object over valley"
    )

    obs.latitude = 42.3265
    obs.longitude = -122.8756

    obs.timestamp_utc = (
        datetime.now(
            UTC
        ).isoformat()
    )

    obs.normalized = True

    obs.attach_observability(

        field_id="OBSFIELD-1234",

        snapshot={

            "observability_score":
                0.72,

            "observer_probability":
                0.81,
        },

        normalized_emergence=2.18,

        confidence=0.74
    )

    print()
    print("================================================")
    print("NORMALIZED OBSERVATION")
    print("================================================")
    print()

    print(
        obs.summary()
    )

    print()