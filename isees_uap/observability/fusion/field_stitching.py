# ============================================================
# field_stitching.py
# iSEES — OBSERVABILITY SUBSYSTEM
# SPATIAL + TEMPORAL FIELD STITCHING ENGINE
# ============================================================

from typing import Dict, List, Optional
from math import radians, sin, cos, sqrt, atan2

from isees_uap.observability.observability_models import (
    ObservabilityField,
)


# ============================================================
# CONSTANTS
# ============================================================

EARTH_RADIUS_KM = 6371.0

DEFAULT_BLEND_RADIUS_KM = 25.0

MAX_STITCH_DISTANCE_KM = 250.0


# ============================================================
# HELPERS
# ============================================================

def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:

    return max(
        minimum,
        min(maximum, value)
    )


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    lat1 = radians(lat1)
    lon1 = radians(lon1)

    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (

        sin(dlat / 2) ** 2
        +
        cos(lat1)
        *
        cos(lat2)
        *
        sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return EARTH_RADIUS_KM * c


# ============================================================
# DISTANCE WEIGHT
# ============================================================

def compute_distance_weight(
    distance_km: float,
    blend_radius_km: float = (
        DEFAULT_BLEND_RADIUS_KM
    ),
) -> float:

    if distance_km <= 0:

        return 1.0

    weight = (

        1.0
        /
        (
            1.0
            +
            (
                distance_km
                /
                blend_radius_km
            )
        )
    )

    return clamp(
        weight,
        0.0,
        1.0
    )


# ============================================================
# COMPONENT BLENDING
# ============================================================

def blend_component(
    values: List[float],
    weights: List[float],
) -> float:

    if not values or not weights:

        return 0.0

    weighted_total = 0.0

    total_weight = 0.0

    for value, weight in zip(
        values,
        weights
    ):

        weighted_total += (
            value * weight
        )

        total_weight += weight

    if total_weight <= 0:

        return 0.0

    blended = (
        weighted_total
        / total_weight
    )

    return round(
        blended,
        3
    )


# ============================================================
# FIELD COMPATIBILITY
# ============================================================

def fields_are_compatible(
    field_a: ObservabilityField,
    field_b: ObservabilityField,
) -> bool:

    distance = haversine_distance_km(

        field_a.latitude,
        field_a.longitude,

        field_b.latitude,
        field_b.longitude
    )

    if distance > MAX_STITCH_DISTANCE_KM:

        return False

    return True


# ============================================================
# FIELD STITCHING
# ============================================================

def stitch_fields(
    fields: List[ObservabilityField]
) -> Optional[ObservabilityField]:

    if not fields:

        return None

    if len(fields) == 1:

        return fields[0]

    # --------------------------------------------------------
    # BASE FIELD
    # --------------------------------------------------------

    base = fields[0]

    stitched = ObservabilityField()

    stitched.latitude = (
        base.latitude
    )

    stitched.longitude = (
        base.longitude
    )

    stitched.timestamp_utc = (
        base.timestamp_utc
    )

    # --------------------------------------------------------
    # FILTER COMPATIBLE
    # --------------------------------------------------------

    compatible_fields = []

    for field in fields:

        if fields_are_compatible(
            base,
            field
        ):

            compatible_fields.append(
                field
            )

    if not compatible_fields:

        return base

    # --------------------------------------------------------
    # DISTANCE WEIGHTS
    # --------------------------------------------------------

    distance_weights = []

    for field in compatible_fields:

        distance = haversine_distance_km(

            base.latitude,
            base.longitude,

            field.latitude,
            field.longitude
        )

        weight = compute_distance_weight(
            distance
        )

        distance_weights.append(
            weight
        )

    # --------------------------------------------------------
    # BLEND CORE OUTPUTS
    # --------------------------------------------------------

    stitched.observability_score = (
        blend_component(

            [
                f.observability_score
                for f in compatible_fields
            ],

            distance_weights
        )
    )

    stitched.observer_probability = (
        blend_component(

            [
                f.observer_probability
                for f in compatible_fields
            ],

            distance_weights
        )
    )

    stitched.sensor_visibility_score = (
        blend_component(

            [
                f.sensor_visibility_score
                for f in compatible_fields
            ],

            distance_weights
        )
    )

    stitched.environmental_visibility_score = (
        blend_component(

            [
                f.environmental_visibility_score
                for f in compatible_fields
            ],

            distance_weights
        )
    )

    stitched.confidence = (
        blend_component(

            [
                f.confidence
                for f in compatible_fields
            ],

            distance_weights
        )
    )

    # --------------------------------------------------------
    # PROVIDER COUNT
    # --------------------------------------------------------

    stitched.provider_count = sum(

        f.provider_count
        for f in compatible_fields
    )

    # --------------------------------------------------------
    # STALE CHECK
    # --------------------------------------------------------

    stitched.stale = any(

        f.stale
        for f in compatible_fields
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    stitched.metadata[
        "field_stitching"
    ] = {

        "source_field_count":
            len(fields),

        "compatible_field_count":
            len(compatible_fields),

        "blend_radius_km":
            DEFAULT_BLEND_RADIUS_KM,

        "max_stitch_distance_km":
            MAX_STITCH_DISTANCE_KM,

        "engine":
            "FIELD_STITCH_V1",
    }

    return stitched


# ============================================================
# STITCHING ANALYSIS
# ============================================================

def analyze_field_overlap(
    fields: List[ObservabilityField]
) -> Dict:

    overlap_pairs = []

    incompatible_pairs = []

    for i in range(len(fields)):

        for j in range(i + 1, len(fields)):

            a = fields[i]
            b = fields[j]

            distance = haversine_distance_km(

                a.latitude,
                a.longitude,

                b.latitude,
                b.longitude
            )

            pair = {

                "field_a":
                    a.field_id,

                "field_b":
                    b.field_id,

                "distance_km":
                    round(distance, 3),
            }

            if distance <= (
                MAX_STITCH_DISTANCE_KM
            ):

                overlap_pairs.append(
                    pair
                )

            else:

                incompatible_pairs.append(
                    pair
                )

    return {

        "overlap_pairs":
            overlap_pairs,

        "incompatible_pairs":
            incompatible_pairs,

        "overlap_count":
            len(overlap_pairs),

        "incompatible_count":
            len(incompatible_pairs),
    }


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    a = ObservabilityField()

    a.latitude = 42.326
    a.longitude = -122.875

    a.observability_score = 0.72
    a.observer_probability = 0.81
    a.sensor_visibility_score = 0.63
    a.environmental_visibility_score = 0.58
    a.confidence = 0.74

    b = ObservabilityField()

    b.latitude = 42.410
    b.longitude = -122.920

    b.observability_score = 0.66
    b.observer_probability = 0.74
    b.sensor_visibility_score = 0.71
    b.environmental_visibility_score = 0.61
    b.confidence = 0.69

    stitched = stitch_fields(
        [a, b]
    )

    print()
    print("================================================")
    print("FIELD STITCHING")
    print("================================================")
    print()

    print(
        stitched.summary()
    )

    print()

    print(
        analyze_field_overlap(
            [a, b]
        )
    )

    print()
