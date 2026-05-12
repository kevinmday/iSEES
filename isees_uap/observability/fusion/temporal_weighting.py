# ============================================================
# temporal_weighting.py
# iSEES — OBSERVABILITY SUBSYSTEM
# TEMPORAL OBSERVABILITY WEIGHTING ENGINE
# ============================================================

from typing import Dict, Optional
from datetime import datetime, UTC

from isees_uap.observability.observability_models import (
    ObservabilityField,
)

from isees_uap.observability.observability_types import (
    ObservabilityTemporalType,
)


# ============================================================
# DEFAULT TEMPORAL WEIGHTS
# ============================================================

TEMPORAL_WEIGHTS = {

    ObservabilityTemporalType.DAY.value:
        1.00,

    ObservabilityTemporalType.NIGHT.value:
        0.72,

    ObservabilityTemporalType.TWILIGHT.value:
        0.84,

    ObservabilityTemporalType.STORM.value:
        0.45,

    ObservabilityTemporalType.HIGH_ACTIVITY.value:
        1.15,

    ObservabilityTemporalType.LOW_ACTIVITY.value:
        0.68,
}


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
# TEMPORAL CLASSIFICATION
# ============================================================

def classify_temporal_state(
    timestamp_utc: Optional[str]
) -> str:

    if not timestamp_utc:

        return (
            ObservabilityTemporalType.DAY.value
        )

    try:

        dt = datetime.fromisoformat(
            timestamp_utc.replace(
                "Z",
                "+00:00"
            )
        )

    except Exception:

        return (
            ObservabilityTemporalType.DAY.value
        )

    hour = dt.hour

    # --------------------------------------------------------
    # TWILIGHT
    # --------------------------------------------------------

    if (
        5 <= hour <= 6
        or
        18 <= hour <= 19
    ):

        return (
            ObservabilityTemporalType.TWILIGHT.value
        )

    # --------------------------------------------------------
    # NIGHT
    # --------------------------------------------------------

    if (
        hour >= 20
        or
        hour <= 4
    ):

        return (
            ObservabilityTemporalType.NIGHT.value
        )

    # --------------------------------------------------------
    # HIGH ACTIVITY
    # --------------------------------------------------------

    if (
        7 <= hour <= 9
        or
        16 <= hour <= 18
    ):

        return (
            ObservabilityTemporalType.HIGH_ACTIVITY.value
        )

    # --------------------------------------------------------
    # LOW ACTIVITY
    # --------------------------------------------------------

    if (
        10 <= hour <= 14
    ):

        return (
            ObservabilityTemporalType.DAY.value
        )

    return (
        ObservabilityTemporalType.DAY.value
    )


# ============================================================
# TEMPORAL WEIGHT LOOKUP
# ============================================================

def get_temporal_weight(
    temporal_state: str
) -> float:

    return TEMPORAL_WEIGHTS.get(
        temporal_state,
        1.0
    )


# ============================================================
# APPLY TEMPORAL WEIGHTING
# ============================================================

def apply_temporal_weighting(
    field: ObservabilityField,
    temporal_state: Optional[str] = None,
) -> ObservabilityField:

    # --------------------------------------------------------
    # AUTO CLASSIFICATION
    # --------------------------------------------------------

    if not temporal_state:

        temporal_state = (
            classify_temporal_state(
                field.timestamp_utc
            )
        )

    weight = get_temporal_weight(
        temporal_state
    )

    # --------------------------------------------------------
    # APPLY WEIGHTING
    # --------------------------------------------------------

    field.observability_score = clamp(

        (
            field.observability_score
            *
            weight
        ),

        0.0,
        1.0
    )

    field.observer_probability = clamp(

        (
            field.observer_probability
            *
            weight
        ),

        0.0,
        1.0
    )

    field.sensor_visibility_score = clamp(

        (
            field.sensor_visibility_score
            *
            weight
        ),

        0.0,
        1.0
    )

    field.environmental_visibility_score = clamp(

        (
            field.environmental_visibility_score
            *
            weight
        ),

        0.0,
        1.0
    )

    field.temporal_weighting_applied = True

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    field.metadata[
        "temporal_weighting"
    ] = {

        "temporal_state":
            temporal_state,

        "weight":
            round(weight, 3),

        "engine":
            "TEMPORAL_WEIGHTING_V1",
    }

    return field


# ============================================================
# TEMPORAL ACTIVITY ESTIMATE
# ============================================================

def estimate_activity_level(
    timestamp_utc: Optional[str]
) -> Dict:

    temporal_state = (
        classify_temporal_state(
            timestamp_utc
        )
    )

    weight = get_temporal_weight(
        temporal_state
    )

    activity = "moderate"

    if weight >= 1.10:

        activity = "high"

    elif weight <= 0.70:

        activity = "low"

    return {

        "temporal_state":
            temporal_state,

        "weight":
            round(weight, 3),

        "activity":
            activity,
    }


# ============================================================
# TEMPORAL DECAY
# ============================================================

def apply_temporal_decay(
    field: ObservabilityField,
    age_hours: float,
) -> ObservabilityField:

    decay_rate = 0.015

    decay = max(
        0.0,
        1.0 - (
            age_hours
            *
            decay_rate
        )
    )

    field.confidence = clamp(

        (
            field.confidence
            *
            decay
        ),

        0.0,
        1.0
    )

    if decay < 0.50:

        field.stale = True

    field.metadata[
        "temporal_decay"
    ] = {

        "age_hours":
            round(age_hours, 3),

        "decay":
            round(decay, 3),

        "decay_rate":
            decay_rate,
    }

    return field


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    field = ObservabilityField()

    field.timestamp_utc = (
        datetime.now(
            UTC
        ).isoformat()
    )

    field.observability_score = 0.74
    field.observer_probability = 0.82
    field.sensor_visibility_score = 0.71
    field.environmental_visibility_score = 0.66

    field = apply_temporal_weighting(
        field
    )

    print()
    print("================================================")
    print("TEMPORAL WEIGHTING")
    print("================================================")
    print()

    print(field.summary())

    print()

    print(
        estimate_activity_level(
            field.timestamp_utc
        )
    )

    print()

