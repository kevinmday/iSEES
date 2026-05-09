# ============================================================
# candidate.py
# KOD — UNIVERSAL RECONSTRUCTED OBJECT MODEL
# ============================================================

from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, List, Any
from datetime import datetime, UTC
import uuid


# ============================================================
# TRAJECTORY POINT
# ============================================================

@dataclass
class TrajectoryPoint:
    timestamp_utc: str

    latitude: float
    longitude: float

    altitude_ft: Optional[float] = None

    heading_deg: Optional[float] = None
    speed_kts: Optional[float] = None


# ============================================================
# MATCH SCORES
# ============================================================

@dataclass
class MatchScores:
    """
    How well this candidate matches the observation.
    """

    # --------------------------------------------------------
    # ALIGNMENT
    # --------------------------------------------------------

    spatial_alignment: float = 0.0
    temporal_alignment: float = 0.0

    trajectory_alignment: float = 0.0

    brightness_alignment: float = 0.0
    behavior_alignment: float = 0.0

    altitude_alignment: float = 0.0
    speed_alignment: float = 0.0

    overall_alignment: float = 0.0

    # --------------------------------------------------------
    # CONTRADICTION PRESSURE
    # --------------------------------------------------------

    anomaly_conflict: float = 0.0

    contradiction_pressure: float = 0.0

    unresolved_pressure: float = 0.0

    # --------------------------------------------------------
    # EXPLANATORY COMPLETENESS
    # --------------------------------------------------------

    explanatory_completeness: float = 0.0

    residual_pressure: float = 0.0


# ============================================================
# CANDIDATE STATUS
# ============================================================

@dataclass
class CandidateStatus:
    """
    Operational interpretation state.
    """

    likely_match: bool = False
    partial_match: bool = False

    unresolved: bool = True

    rejected: bool = False

    elimination_confidence: float = 0.0

    anomaly_conflict_score: float = 0.0

    contradiction_summary: List[str] = field(
        default_factory=list
    )

    unresolved_features: List[str] = field(
        default_factory=list
    )


# ============================================================
# UNIVERSAL CANDIDATE
# ============================================================

@dataclass
class Candidate:
    """
    Universal reconstructed object representation.

    ALL KOD engines emit this structure.
    """

    # --------------------------------------------------------
    # CORE IDENTITY
    # --------------------------------------------------------

    candidate_id: str = field(
        default_factory=lambda: f"CAND-{uuid.uuid4().hex[:8].upper()}"
    )

    created_utc: str = field(
        default_factory=lambda: datetime.now(UTC).isoformat()
    )

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    candidate_type: str = "unknown"

    candidate_subtype: Optional[str] = None

    source_engine: Optional[str] = None
    source_provider: Optional[str] = None

    source_identifier: Optional[str] = None

    # --------------------------------------------------------
    # POSITIONAL DATA
    # --------------------------------------------------------

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    altitude_ft: Optional[float] = None

    distance_km: Optional[float] = None

    bearing_deg: Optional[float] = None

    azimuth_deg: Optional[float] = None
    elevation_deg: Optional[float] = None

    # --------------------------------------------------------
    # TEMPORAL DATA
    # --------------------------------------------------------

    timestamp_utc: Optional[str] = None

    heading_deg: Optional[float] = None
    speed_kts: Optional[float] = None

    vertical_rate_fpm: Optional[float] = None

    trajectory: List[TrajectoryPoint] = field(
        default_factory=list
    )

    # --------------------------------------------------------
    # VISUAL / PHYSICAL
    # --------------------------------------------------------

    color: Optional[str] = None

    brightness: Optional[float] = None

    object_shape: Optional[str] = None

    lighting_behavior: Optional[str] = None

    sound_profile: Optional[str] = None

    thermal_signature: Optional[str] = None

    # --------------------------------------------------------
    # MATCHING
    # --------------------------------------------------------

    match_scores: MatchScores = field(
        default_factory=MatchScores
    )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    status: CandidateStatus = field(
        default_factory=CandidateStatus
    )

    # --------------------------------------------------------
    # ENGINE CONFIDENCE
    # --------------------------------------------------------

    confidence_score: float = 0.0

    # --------------------------------------------------------
    # ENGINE NOTES
    # --------------------------------------------------------

    explanation: Optional[str] = None

    notes: List[str] = field(
        default_factory=list
    )

    # --------------------------------------------------------
    # RAW SOURCE DATA
    # --------------------------------------------------------

    raw_data: Dict[str, Any] = field(
        default_factory=dict
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
            "candidate_id":
                self.candidate_id,

            "candidate_type":
                self.candidate_type,

            "source_engine":
                self.source_engine,

            "source_provider":
                self.source_provider,

            "distance_km":
                self.distance_km,

            "bearing_deg":
                self.bearing_deg,

            "altitude_ft":
                self.altitude_ft,

            "heading_deg":
                self.heading_deg,

            "speed_kts":
                self.speed_kts,

            "confidence_score":
                self.confidence_score,

            "overall_alignment":
                self.match_scores
                .overall_alignment,

            "anomaly_conflict":
                self.match_scores
                .anomaly_conflict,

            "contradiction_pressure":
                self.match_scores
                .contradiction_pressure,

            "explanatory_completeness":
                self.match_scores
                .explanatory_completeness,

            "residual_pressure":
                self.match_scores
                .residual_pressure,

            "likely_match":
                self.status.likely_match,

            "elimination_confidence":
                self.status
                .elimination_confidence,

            "anomaly_conflict_score":
                self.status
                .anomaly_conflict_score,

            "contradiction_summary":
                self.status
                .contradiction_summary,

            "unresolved_features":
                self.status
                .unresolved_features,
        }


# ============================================================
# FACTORY HELPERS
# ============================================================

def build_aircraft_candidate(
    callsign: str,
    latitude: float,
    longitude: float,
    altitude_ft: float,
    heading_deg: float,
    speed_kts: float,
) -> Candidate:
    """
    Helper factory for aviation candidates.
    """

    c = Candidate()

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    c.candidate_type = "aircraft"

    c.candidate_subtype = "commercial"

    # --------------------------------------------------------
    # SOURCE
    # --------------------------------------------------------

    c.source_engine = "aviation_engine"

    c.source_provider = "adsb"

    c.source_identifier = callsign

    # --------------------------------------------------------
    # POSITIONAL
    # --------------------------------------------------------

    c.latitude = latitude
    c.longitude = longitude

    c.altitude_ft = altitude_ft

    c.heading_deg = heading_deg

    c.speed_kts = speed_kts

    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------

    c.confidence_score = 0.85

    # --------------------------------------------------------
    # MATCHING
    # --------------------------------------------------------

    c.match_scores.spatial_alignment = 0.82

    c.match_scores.temporal_alignment = 0.91

    c.match_scores.trajectory_alignment = 0.87

    c.match_scores.overall_alignment = 0.88

    # --------------------------------------------------------
    # CONTRADICTION PRESSURE
    # --------------------------------------------------------

    c.match_scores.anomaly_conflict = 0.12

    c.match_scores.contradiction_pressure = 0.18

    c.match_scores.explanatory_completeness = (
        0.82
    )

    c.match_scores.residual_pressure = 0.18

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    c.status.likely_match = True

    c.status.unresolved = False

    c.status.elimination_confidence = 0.89

    c.status.anomaly_conflict_score = (
        0.12
    )

    # --------------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------------

    c.explanation = (
        f"ADS-B tracked aircraft detected "
        f"({callsign})"
    )

    # --------------------------------------------------------
    # CONTRADICTIONS
    # --------------------------------------------------------

    c.status.contradiction_summary = [
        "silent_behavior_unresolved",
    ]

    c.status.unresolved_features = [
        "instant_vertical_acceleration",
    ]

    return c


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    candidate = build_aircraft_candidate(
        callsign="DAL221",
        latitude=42.374,
        longitude=-122.871,
        altitude_ft=31000,
        heading_deg=182,
        speed_kts=442,
    )

    candidate.distance_km = 6.4
    candidate.bearing_deg = 211

    print()
    print("================================================")
    print("KOD UNIVERSAL CANDIDATE")
    print("================================================")
    print()

    print(candidate.summary())

    print()