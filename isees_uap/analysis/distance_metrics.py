# ============================================================
# distance_metrics.py — MANIFOLD DISTANCE ENGINE
# ============================================================

from typing import Dict, Any
from datetime import datetime
import math


# ============================================================
# GLOBAL WEIGHTS
# ============================================================

TEMPORAL_WEIGHT = 1.0
GEO_WEIGHT = 1.0
SEMANTIC_WEIGHT = 1.5
AMBIGUITY_WEIGHT = 0.5


# ============================================================
# MAIN DISTANCE CALCULATION
# ============================================================

def calculate_distance(
    observation_a: Dict[str, Any],
    observation_b: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic manifold distance calculation.

    IMPORTANT:
    This is NOT probability.

    This calculates:
        manifold coordinate separation

    across:

    - time
    - space
    - semantics
    - ambiguity
    """

    # --------------------------------------------------------
    # COMPONENT DISTANCES
    # --------------------------------------------------------
    temporal = _temporal_distance(
        observation_a,
        observation_b
    )

    geo = _geo_distance(
        observation_a,
        observation_b
    )

    semantic = _semantic_distance(
        observation_a,
        observation_b
    )

    ambiguity = _ambiguity_distance(
        observation_a,
        observation_b
    )

    # --------------------------------------------------------
    # TOTAL DISTANCE
    # --------------------------------------------------------
    total_distance = (

        (temporal * TEMPORAL_WEIGHT)

        +

        (geo * GEO_WEIGHT)

        +

        (semantic * SEMANTIC_WEIGHT)

        +

        (ambiguity * AMBIGUITY_WEIGHT)
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------
    return {

        "total_distance":
            round(total_distance, 4),

        "temporal_distance":
            round(temporal, 4),

        "geo_distance":
            round(geo, 4),

        "semantic_distance":
            round(semantic, 4),

        "ambiguity_distance":
            round(ambiguity, 4),

        "weights": {

            "temporal":
                TEMPORAL_WEIGHT,

            "geo":
                GEO_WEIGHT,

            "semantic":
                SEMANTIC_WEIGHT,

            "ambiguity":
                AMBIGUITY_WEIGHT
        }
    }


# ============================================================
# TEMPORAL DISTANCE
# ============================================================

def _temporal_distance(
    a: Dict[str, Any],
    b: Dict[str, Any]
) -> float:

    try:

        time_a = (
            a["normalized_time"]["utc_time"]
        )

        time_b = (
            b["normalized_time"]["utc_time"]
        )

        if not time_a or not time_b:
            return 1.0

        dt_a = datetime.fromisoformat(
            time_a.replace("Z", "+00:00")
        )

        dt_b = datetime.fromisoformat(
            time_b.replace("Z", "+00:00")
        )

        delta_seconds = abs(
            (dt_a - dt_b).total_seconds()
        )

        # ----------------------------------------------------
        # NORMALIZE TO HOURS
        # ----------------------------------------------------
        delta_hours = delta_seconds / 3600.0

        # ----------------------------------------------------
        # SOFT ELASTICITY
        # ----------------------------------------------------
        elasticity_a = (
            a["normalized_time"].get(
                "elasticity_window_minutes",
                60
            )
        )

        elasticity_b = (
            b["normalized_time"].get(
                "elasticity_window_minutes",
                60
            )
        )

        combined_elasticity = (
            elasticity_a + elasticity_b
        ) / 60.0

        adjusted = max(
            delta_hours - combined_elasticity,
            0.0
        )

        return adjusted

    except Exception:

        return 1.0


# ============================================================
# GEO DISTANCE
# ============================================================

def _geo_distance(
    a: Dict[str, Any],
    b: Dict[str, Any]
) -> float:

    try:

        lat1 = (
            a["normalized_geo"]["resolved_lat"]
        )

        lon1 = (
            a["normalized_geo"]["resolved_lon"]
        )

        lat2 = (
            b["normalized_geo"]["resolved_lat"]
        )

        lon2 = (
            b["normalized_geo"]["resolved_lon"]
        )

        if None in [lat1, lon1, lat2, lon2]:
            return 1.0

        # ----------------------------------------------------
        # HAVERSINE
        # ----------------------------------------------------
        radius_km = 6371.0

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a_val = (

            math.sin(dlat / 2) ** 2

            +

            math.cos(math.radians(lat1))

            *

            math.cos(math.radians(lat2))

            *

            math.sin(dlon / 2) ** 2
        )

        c_val = (
            2 * math.atan2(
                math.sqrt(a_val),
                math.sqrt(1 - a_val)
            )
        )

        distance_km = radius_km * c_val

        # ----------------------------------------------------
        # ELASTICITY
        # ----------------------------------------------------
        elasticity_a = (
            a["normalized_geo"].get(
                "elasticity_radius_km",
                10.0
            )
        )

        elasticity_b = (
            b["normalized_geo"].get(
                "elasticity_radius_km",
                10.0
            )
        )

        combined = (
            elasticity_a + elasticity_b
        )

        adjusted = max(
            distance_km - combined,
            0.0
        )

        return adjusted

    except Exception:

        return 1.0


# ============================================================
# SEMANTIC DISTANCE
# ============================================================

def _semantic_distance(
    a: Dict[str, Any],
    b: Dict[str, Any]
) -> float:

    try:

        vec_a = (
            a["vector_data"]
            .get("semantic_vector", {})
        )

        vec_b = (
            b["vector_data"]
            .get("semantic_vector", {})
        )

        tokens_a = set(vec_a.keys())
        tokens_b = set(vec_b.keys())

        if not tokens_a or not tokens_b:
            return 1.0

        intersection = len(
            tokens_a.intersection(tokens_b)
        )

        union = len(
            tokens_a.union(tokens_b)
        )

        similarity = intersection / union

        # distance = inverse similarity
        return 1.0 - similarity

    except Exception:

        return 1.0


# ============================================================
# AMBIGUITY DISTANCE
# ============================================================

def _ambiguity_distance(
    a: Dict[str, Any],
    b: Dict[str, Any]
) -> float:

    try:

        ambiguity_a = set(

            a["semantic_preprocessing"]
            .get("ambiguity_markers", [])
        )

        ambiguity_b = set(

            b["semantic_preprocessing"]
            .get("ambiguity_markers", [])
        )

        if not ambiguity_a and not ambiguity_b:
            return 0.0

        intersection = len(
            ambiguity_a.intersection(
                ambiguity_b
            )
        )

        union = len(
            ambiguity_a.union(
                ambiguity_b
            )
        )

        similarity = intersection / union

        return 1.0 - similarity

    except Exception:

        return 1.0