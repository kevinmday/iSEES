# ============================================================
# aviation_engine.py
# KOD — AVIATION RECONSTRUCTION ENGINE (V1 STABLE)
# ============================================================

from typing import List
from math import radians, sin, cos, sqrt, atan2

from isees_uap.kod.models.observation_context import (
    ObservationContext,
)

from isees_uap.kod.models.candidate import (
    Candidate,
    build_aircraft_candidate,
)


# ============================================================
# CONSTANTS
# ============================================================

EARTH_RADIUS_KM = 6371.0


# ============================================================
# GEO HELPERS
# ============================================================

def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def bearing_deg(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    dlon = radians(lon2 - lon1)

    lat1_r = radians(lat1)
    lat2_r = radians(lat2)

    x = sin(dlon) * cos(lat2_r)

    y = (
        cos(lat1_r) * sin(lat2_r)
        - sin(lat1_r)
        * cos(lat2_r)
        * cos(dlon)
    )

    initial_bearing = atan2(x, y)

    bearing = (
        initial_bearing * 180 / 3.141592653589793
    )

    return (bearing + 360) % 360


# ============================================================
# MOCK AIRCRAFT FEED
# ============================================================

def generate_mock_aircraft(
    observation: ObservationContext,
) -> List[Candidate]:

    """
    Simulated nearby aircraft candidates.

    This is intentionally mocked first to prove
    deterministic reconstruction flow BEFORE
    introducing live ADS-B complexity.
    """

    candidates = []

    base_lat = observation.geo.latitude
    base_lon = observation.geo.longitude

    # --------------------------------------------------------
    # COMMERCIAL JET
    # --------------------------------------------------------

    jet = build_aircraft_candidate(
        callsign="DAL221",
        latitude=base_lat + 0.045,
        longitude=base_lon - 0.032,
        altitude_ft=31000,
        heading_deg=184,
        speed_kts=441,
    )

    jet.candidate_subtype = "commercial_jet"

    candidates.append(jet)

    # --------------------------------------------------------
    # REGIONAL PROP AIRCRAFT
    # --------------------------------------------------------

    regional = build_aircraft_candidate(
        callsign="SKW5521",
        latitude=base_lat - 0.018,
        longitude=base_lon + 0.021,
        altitude_ft=12000,
        heading_deg=47,
        speed_kts=232,
    )

    regional.candidate_subtype = "regional_turboprop"

    candidates.append(regional)

    # --------------------------------------------------------
    # HELICOPTER
    # --------------------------------------------------------

    helicopter = build_aircraft_candidate(
        callsign="MEDSTAR7",
        latitude=base_lat + 0.009,
        longitude=base_lon + 0.011,
        altitude_ft=2400,
        heading_deg=310,
        speed_kts=118,
    )

    helicopter.candidate_type = "helicopter"

    candidates.append(helicopter)

    return candidates


# ============================================================
# ALIGNMENT SCORING
# ============================================================

def score_candidate_alignment(
    observation: ObservationContext,
    candidate: Candidate,
) -> Candidate:

    """
    Deterministic alignment scoring.
    """

    obs_lat = observation.geo.latitude
    obs_lon = observation.geo.longitude

    cand_lat = candidate.latitude
    cand_lon = candidate.longitude

    if cand_lat is None or cand_lon is None:
        return candidate

    # --------------------------------------------------------
    # DISTANCE
    # --------------------------------------------------------

    distance = haversine_km(
        obs_lat,
        obs_lon,
        cand_lat,
        cand_lon,
    )

    candidate.distance_km = round(distance, 2)

    # --------------------------------------------------------
    # BEARING
    # --------------------------------------------------------

    bearing = bearing_deg(
        obs_lat,
        obs_lon,
        cand_lat,
        cand_lon,
    )

    candidate.bearing_deg = round(bearing, 2)

    # --------------------------------------------------------
    # SPATIAL ALIGNMENT
    # --------------------------------------------------------

    if distance <= 3:
        spatial = 0.95

    elif distance <= 10:
        spatial = 0.80

    elif distance <= 25:
        spatial = 0.55

    else:
        spatial = 0.20

    candidate.match_scores.spatial_alignment = spatial

    # --------------------------------------------------------
    # ALTITUDE ALIGNMENT
    # --------------------------------------------------------

    if observation.estimated_altitude_ft:

        delta_alt = abs(
            observation.estimated_altitude_ft
            - (candidate.altitude_ft or 0)
        )

        if delta_alt <= 1000:
            altitude_score = 0.95

        elif delta_alt <= 5000:
            altitude_score = 0.70

        else:
            altitude_score = 0.25

    else:
        altitude_score = 0.50

    candidate.match_scores.altitude_alignment = (
        altitude_score
    )

    # --------------------------------------------------------
    # SPEED ALIGNMENT
    # --------------------------------------------------------

    if observation.estimated_speed_kts:

        delta_speed = abs(
            observation.estimated_speed_kts
            - (candidate.speed_kts or 0)
        )

        if delta_speed <= 50:
            speed_score = 0.95

        elif delta_speed <= 150:
            speed_score = 0.65

        else:
            speed_score = 0.20

    else:
        speed_score = 0.50

    candidate.match_scores.speed_alignment = (
        speed_score
    )

    # --------------------------------------------------------
    # TEMPORAL ALIGNMENT
    # --------------------------------------------------------

    temporal = 0.90

    candidate.match_scores.temporal_alignment = (
        temporal
    )

    # --------------------------------------------------------
    # TRAJECTORY ALIGNMENT
    # --------------------------------------------------------

    trajectory = 0.75

    candidate.match_scores.trajectory_alignment = (
        trajectory
    )

    # --------------------------------------------------------
    # OVERALL ALIGNMENT
    # --------------------------------------------------------

    overall = (
        spatial * 0.35
        + altitude_score * 0.20
        + speed_score * 0.20
        + temporal * 0.10
        + trajectory * 0.15
    )

    overall = round(overall, 3)

    candidate.match_scores.overall_alignment = (
        overall
    )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if overall >= 0.80:

        candidate.status.likely_match = True
        candidate.status.unresolved = False

        candidate.status.elimination_confidence = (
            overall
        )

    elif overall >= 0.55:

        candidate.status.partial_match = True

        candidate.status.elimination_confidence = (
            overall
        )

    else:

        candidate.status.rejected = True

        candidate.status.elimination_confidence = (
            overall
        )

    # --------------------------------------------------------
    # ENGINE CONFIDENCE
    # --------------------------------------------------------

    candidate.confidence_score = overall

    # --------------------------------------------------------
    # EXPLANATION
    # --------------------------------------------------------

    candidate.explanation = (
        f"{candidate.candidate_type} candidate "
        f"matched with "
        f"{round(overall * 100, 1)}% confidence"
    )

    return candidate


# ============================================================
# MAIN ENGINE
# ============================================================

def reconstruct_aviation_candidates(
    observation: ObservationContext,
) -> List[Candidate]:

    """
    Main aviation reconstruction pipeline.
    """

    raw_candidates = generate_mock_aircraft(
        observation
    )

    scored_candidates = []

    for candidate in raw_candidates:

        scored = score_candidate_alignment(
            observation,
            candidate,
        )

        scored_candidates.append(scored)

    scored_candidates.sort(
        key=lambda c:
        c.match_scores.overall_alignment,
        reverse=True,
    )

    return scored_candidates


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    observation = ObservationContext()

    observation.geo.latitude = 42.374
    observation.geo.longitude = -122.871

    observation.object_shape = "bright_light"

    observation.estimated_altitude_ft = 30000
    observation.estimated_speed_kts = 420

    observation.raw_description = (
        "Bright white object moving southbound "
        "at high altitude."
    )

    candidates = reconstruct_aviation_candidates(
        observation
    )

    print()
    print("================================================")
    print("KOD AVIATION ENGINE")
    print("================================================")
    print()

    for c in candidates:

        print(c.summary())
        print()