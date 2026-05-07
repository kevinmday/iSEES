# ============================================================
# geo_normalizer.py — GEO NORMALIZATION ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any
import math


# ============================================================
# MAIN GEO NORMALIZER
# ============================================================

def normalize_geo(
    raw_geo: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic geo normalization.

    IMPORTANT:
    This layer preserves observer geometry separately
    from resolved geometry.

    Observer truth is NEVER overwritten.

    This layer prepares:
        temporospatial manifold coordinates

    NOT:
        facility resolution
        radar lookup
        escalation
        enrichment
    """

    # --------------------------------------------------------
    # RAW INPUTS
    # --------------------------------------------------------
    location_text = (
        raw_geo.get("location_text", "")
        .strip()
    )

    observer_lat = raw_geo.get("lat")

    observer_lon = raw_geo.get("lon")

    altitude_raw = raw_geo.get(
        "altitude_raw"
    )

    geo_source = (
        raw_geo.get("geo_source", "")
        .strip()
    )

    location_accuracy = (
        raw_geo.get(
            "location_accuracy",
            ""
        ).strip()
    )

    # --------------------------------------------------------
    # DEFAULT OUTPUT
    # --------------------------------------------------------
    normalized = {

        # ----------------------------------------------------
        # RESOLVED GEO
        # ----------------------------------------------------
        "resolved_lat": None,

        "resolved_lon": None,

        "resolved_altitude": None,

        # ----------------------------------------------------
        # ORIGINAL OBSERVER GEO
        # ----------------------------------------------------
        "observer_lat":
            observer_lat,

        "observer_lon":
            observer_lon,

        "observer_altitude":
            altitude_raw,

        "raw_location":
            location_text,

        # ----------------------------------------------------
        # CONFIDENCE + ELASTICITY
        # ----------------------------------------------------
        "geo_confidence": 0.0,

        "elasticity_radius_km": 50.0,

        # ----------------------------------------------------
        # AMBIGUITY
        # ----------------------------------------------------
        "ambiguity_flags": [],

        # ----------------------------------------------------
        # PARSER METADATA
        # ----------------------------------------------------
        "normalization_method":
            "unresolved",

        "geo_source":
            geo_source,

        "location_accuracy":
            location_accuracy,

        # ----------------------------------------------------
        # GENERATED
        # ----------------------------------------------------
        "normalized_utc_generated":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # DIRECT LAT/LON PROVIDED
    # --------------------------------------------------------
    if (
        _valid_coordinate(observer_lat)
        and _valid_coordinate(observer_lon)
    ):

        normalized["resolved_lat"] = (
            float(observer_lat)
        )

        normalized["resolved_lon"] = (
            float(observer_lon)
        )

        normalized["resolved_altitude"] = (
            altitude_raw
        )

        normalized["geo_confidence"] = 0.95

        normalized[
            "normalization_method"
        ] = "direct_coordinates"

        normalized[
            "elasticity_radius_km"
        ] = 1.0

        return normalized

    # --------------------------------------------------------
    # TEXTUAL LOCATION PRESENT
    # --------------------------------------------------------
    if location_text:

        normalized["ambiguity_flags"].append(
            "textual_location"
        )

        normalized[
            "normalization_method"
        ] = "text_only"

        normalized[
            "geo_confidence"
        ] = 0.35

        # ----------------------------------------------------
        # APPROXIMATE LOCATION DETECTION
        # ----------------------------------------------------
        approximate_markers = [

            "near",
            "around",
            "outside",
            "close to",
            "south of",
            "north of",
            "east of",
            "west of",
            "between"
        ]

        if any(
            marker in location_text.lower()
            for marker in approximate_markers
        ):

            normalized[
                "ambiguity_flags"
            ].append(
                "approximate_location"
            )

            normalized[
                "elasticity_radius_km"
            ] = 25.0

        else:

            normalized[
                "elasticity_radius_km"
            ] = 10.0

        return normalized

    # --------------------------------------------------------
    # NO GEO PROVIDED
    # --------------------------------------------------------
    normalized["ambiguity_flags"].append(
        "missing_geo"
    )

    normalized[
        "elasticity_radius_km"
    ] = 500.0

    return normalized


# ============================================================
# COORDINATE VALIDATION
# ============================================================

def _valid_coordinate(value: Any) -> bool:
    """
    Basic coordinate sanity check.
    """

    try:

        value = float(value)

        return math.isfinite(value)

    except Exception:

        return False