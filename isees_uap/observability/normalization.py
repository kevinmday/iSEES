# ============================================================
# normalization.py
# iSEES — OBSERVABILITY SUBSYSTEM
# OBSERVABILITY NORMALIZATION ENGINE
# ============================================================

from typing import Dict, List, Optional
from math import log

from isees_uap.observability.observability_models import (
    ObservabilityField,
)

from isees_uap.observability.observability_types import (
    ObservabilityNormalizationType,
)


# ============================================================
# DEFAULTS
# ============================================================

DEFAULT_NORMALIZATION_FLOOR = 0.05

DEFAULT_ALPHA = 1.0

DEFAULT_LOG_BASE = 10.0

MAX_NORMALIZED_EMERGENCE = 10.0


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
# OBSERVABILITY EXTRACTION
# ============================================================

def extract_observability_score(
    field: Optional[ObservabilityField]
) -> float:

    if not field:
        return DEFAULT_NORMALIZATION_FLOOR

    score = field.observability_score

    score = clamp(
        score,
        DEFAULT_NORMALIZATION_FLOOR,
        1.0
    )

    return round(score, 3)


# ============================================================
# RAW NORMALIZATION
# ============================================================

def normalize_raw_density(
    report_density: float,
    observability: float,
    floor: float = DEFAULT_NORMALIZATION_FLOOR,
    alpha: float = DEFAULT_ALPHA,
) -> float:

    denominator = (
        floor
        +
        (alpha * observability)
    )

    normalized = (
        report_density
        / denominator
    )

    normalized = clamp(
        normalized,
        0.0,
        MAX_NORMALIZED_EMERGENCE
    )

    return round(normalized, 3)


# ============================================================
# LOG-DAMPED NORMALIZATION
# ============================================================

def normalize_log_damped(
    report_density: float,
    observability: float,
    floor: float = DEFAULT_NORMALIZATION_FLOOR,
) -> float:

    stabilized = (
        floor
        +
        observability
    )

    inverse = (
        1.0
        / stabilized
    )

    damped = (
        report_density
        *
        log(
            1.0 + inverse
        )
    )

    damped = clamp(
        damped,
        0.0,
        MAX_NORMALIZED_EMERGENCE
    )

    return round(damped, 3)


# ============================================================
# BOUNDED NORMALIZATION
# ============================================================

def normalize_bounded(
    report_density: float,
    observability: float,
    floor: float = DEFAULT_NORMALIZATION_FLOOR,
) -> float:

    stabilized = (
        floor
        +
        observability
    )

    normalized = (
        report_density
        / stabilized
    )

    bounded = (
        normalized
        /
        (
            1.0
            +
            normalized
        )
    )

    bounded = clamp(
        bounded,
        0.0,
        1.0
    )

    return round(bounded, 3)


# ============================================================
# MAIN NORMALIZATION ROUTER
# ============================================================

def normalize_emergence(
    report_density: float,
    field: Optional[ObservabilityField],
    normalization_type: ObservabilityNormalizationType = (
        ObservabilityNormalizationType.LOG_SCALED
    ),
) -> Dict:

    observability = (
        extract_observability_score(
            field
        )
    )

    # --------------------------------------------------------
    # RAW
    # --------------------------------------------------------

    if normalization_type == (
        ObservabilityNormalizationType.RAW
    ):

        normalized = normalize_raw_density(
            report_density,
            observability,
        )

    # --------------------------------------------------------
    # STABILIZED
    # --------------------------------------------------------

    elif normalization_type == (
        ObservabilityNormalizationType.STABILIZED
    ):

        normalized = normalize_raw_density(
            report_density,
            observability,
        )

    # --------------------------------------------------------
    # LOG SCALED
    # --------------------------------------------------------

    elif normalization_type == (
        ObservabilityNormalizationType.LOG_SCALED
    ):

        normalized = normalize_log_damped(
            report_density,
            observability,
        )

    # --------------------------------------------------------
    # BOUNDED
    # --------------------------------------------------------

    elif normalization_type == (
        ObservabilityNormalizationType.BOUNDED
    ):

        normalized = normalize_bounded(
            report_density,
            observability,
        )

    # --------------------------------------------------------
    # DEFAULT FALLBACK
    # --------------------------------------------------------

    else:

        normalized = normalize_log_damped(
            report_density,
            observability,
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "report_density":
            round(report_density, 3),

        "observability":
            round(observability, 3),

        "normalized_emergence":
            round(normalized, 3),

        "normalization_type":
            normalization_type.value,

        "stabilization_floor":
            DEFAULT_NORMALIZATION_FLOOR,
    }


# ============================================================
# CLUSTER NORMALIZATION
# ============================================================

def normalize_cluster_emergence(
    cluster: Dict,
    field: Optional[ObservabilityField],
    normalization_type: ObservabilityNormalizationType = (
        ObservabilityNormalizationType.LOG_SCALED
    ),
) -> Dict:

    report_count = cluster.get(
        "report_count",
        0
    )

    confidence = cluster.get(
        "confidence",
        0.0
    )

    density = (
        report_count
        *
        confidence
    )

    normalized = normalize_emergence(

        report_density=density,

        field=field,

        normalization_type=
            normalization_type
    )

    return {

        "cluster_id":
            cluster.get(
                "cluster_id"
            ),

        "raw_density":
            round(density, 3),

        "normalized_emergence":
            normalized[
                "normalized_emergence"
            ],

        "observability":
            normalized[
                "observability"
            ],

        "normalization_type":
            normalized[
                "normalization_type"
            ],
    }


# ============================================================
# EVENT NORMALIZATION
# ============================================================

def normalize_event_emergence(
    event: Dict,
    field: Optional[ObservabilityField],
    normalization_type: ObservabilityNormalizationType = (
        ObservabilityNormalizationType.LOG_SCALED
    ),
) -> Dict:

    report_count = event.get(
        "report_count",
        0
    )

    cluster_count = max(

        event.get(
            "cluster_count",
            1
        ),

        1
    )

    density = (
        report_count
        /
        cluster_count
    )

    normalized = normalize_emergence(

        report_density=density,

        field=field,

        normalization_type=
            normalization_type
    )

    return {

        "event_id":
            event.get(
                "event_id"
            ),

        "raw_density":
            round(density, 3),

        "normalized_emergence":
            normalized[
                "normalized_emergence"
            ],

        "observability":
            normalized[
                "observability"
            ],

        "normalization_type":
            normalized[
                "normalization_type"
            ],
    }


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    field = ObservabilityField()

    field.observability_score = 0.75

    result = normalize_emergence(

        report_density=4.0,

        field=field,

        normalization_type=
            ObservabilityNormalizationType.LOG_SCALED
    )

    print()
    print("================================================")
    print("OBSERVABILITY NORMALIZATION")
    print("================================================")
    print()

    print(result)

    print()

