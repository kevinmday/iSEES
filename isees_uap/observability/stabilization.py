# ============================================================
# stabilization.py
# iSEES — OBSERVABILITY SUBSYSTEM
# STABILIZATION + BOUNDED MANIFOLD MATH
# ============================================================

from typing import Dict
from math import log, exp


# ============================================================
# CONSTANTS
# ============================================================

DEFAULT_FLOOR = 0.05

DEFAULT_SOFT_LIMIT = 1.0

DEFAULT_HARD_LIMIT = 10.0

DEFAULT_EXP_SCALE = 4.0

DEFAULT_LOG_SCALE = 10.0


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
# FLOOR STABILIZATION
# ============================================================

def apply_floor_stabilization(
    observability: float,
    floor: float = DEFAULT_FLOOR,
) -> float:

    stabilized = max(
        observability,
        floor
    )

    return round(stabilized, 6)


# ============================================================
# SOFT LIMIT
# ============================================================

def apply_soft_limit(
    value: float,
    scale: float = DEFAULT_EXP_SCALE,
) -> float:

    limited = (

        1.0
        -
        exp(
            -value / scale
        )
    )

    limited = clamp(
        limited,
        0.0,
        1.0
    )

    return round(limited, 6)


# ============================================================
# HARD LIMIT
# ============================================================

def apply_hard_limit(
    value: float,
    limit: float = DEFAULT_HARD_LIMIT,
) -> float:

    bounded = clamp(
        value,
        0.0,
        limit
    )

    return round(bounded, 6)


# ============================================================
# LOG DAMPING
# ============================================================

def apply_log_damping(
    value: float,
    scale: float = DEFAULT_LOG_SCALE,
) -> float:

    damped = log(
        1.0 + (value * scale)
    )

    damped = max(
        0.0,
        damped
    )

    return round(damped, 6)


# ============================================================
# HYBRID STABILIZATION
# ============================================================

def apply_hybrid_stabilization(
    report_density: float,
    observability: float,
    floor: float = DEFAULT_FLOOR,
) -> Dict:

    # --------------------------------------------------------
    # FLOOR
    # --------------------------------------------------------

    stabilized_observability = (
        apply_floor_stabilization(
            observability,
            floor
        )
    )

    # --------------------------------------------------------
    # RAW NORMALIZATION
    # --------------------------------------------------------

    normalized = (
        report_density
        /
        stabilized_observability
    )

    # --------------------------------------------------------
    # LOG DAMPING
    # --------------------------------------------------------

    damped = apply_log_damping(
        normalized
    )

    # --------------------------------------------------------
    # SOFT LIMIT
    # --------------------------------------------------------

    softened = apply_soft_limit(
        damped
    )

    # --------------------------------------------------------
    # HARD LIMIT
    # --------------------------------------------------------

    final_value = apply_hard_limit(
        softened,
        1.0
    )

    return {

        "report_density":
            round(report_density, 6),

        "observability":
            round(observability, 6),

        "stabilized_observability":
            round(
                stabilized_observability,
                6
            ),

        "normalized":
            round(normalized, 6),

        "log_damped":
            round(damped, 6),

        "softened":
            round(softened, 6),

        "final":
            round(final_value, 6),
    }


# ============================================================
# STABILITY ANALYSIS
# ============================================================

def analyze_stability(
    report_density: float,
    observability: float,
) -> Dict:

    unstable = False

    warnings = []

    if observability <= 0.01:

        unstable = True

        warnings.append(
            "near_zero_observability"
        )

    if report_density > 100:

        warnings.append(
            "extreme_report_density"
        )

    if (
        observability < 0.10
        and
        report_density > 10
    ):

        warnings.append(
            "high_amplification_zone"
        )

    hybrid = apply_hybrid_stabilization(

        report_density=
            report_density,

        observability=
            observability
    )

    return {

        "stable":
            not unstable,

        "warnings":
            warnings,

        "hybrid_result":
            hybrid
    }


# ============================================================
# MANIFOLD SAFETY CHECK
# ============================================================

def manifold_safety_check(
    normalized_emergence: float
) -> Dict:

    safe = True

    state = "stable"

    if normalized_emergence > 5.0:

        safe = False

        state = "extreme_amplification"

    elif normalized_emergence > 2.0:

        state = "high_amplification"

    elif normalized_emergence < 0.05:

        state = "suppressed"

    return {

        "safe":
            safe,

        "state":
            state,

        "normalized_emergence":
            round(
                normalized_emergence,
                6
            )
    }


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    result = apply_hybrid_stabilization(

        report_density=4.0,

        observability=0.08
    )

    print()
    print("================================================")
    print("OBSERVABILITY STABILIZATION")
    print("================================================")
    print()

    print(result)

    print()