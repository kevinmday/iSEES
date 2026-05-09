# ============================================================
# residual_propagation.py — RESIDUAL PROPAGATION ENGINE (V1)
# ============================================================

from typing import List, Dict

from isees_uap.kod.topology.topology_models import (
    ResidualVector,
)


# ============================================================
# DEFAULT PROPAGATION WEIGHTS
# ============================================================

DEFAULT_PROPAGATION_WEIGHTS = {

    "aviation": 0.80,

    "weather": 0.60,

    "sensor": 0.70,

    "astronomical": 0.40,

    "unknown": 0.25,
}


# ============================================================
# BUILD RESIDUAL VECTOR
# ============================================================

def build_residual_vector(
    vector_type,
    unresolved_features: List[str],
    residual_strength: float,
    propagation_targets: List[str],
) -> ResidualVector:

    residual_strength = round(
        max(0.0, min(residual_strength, 1.0)),
        4,
    )

    return ResidualVector(
        vector_type=vector_type,
        unresolved_features=unresolved_features,
        residual_strength=residual_strength,
        propagation_targets=propagation_targets,
    )


# ============================================================
# PROPAGATE RESIDUALS
# ============================================================

def propagate_residuals(
    residual_vectors: List[ResidualVector],
) -> Dict[str, float]:

    propagation_map = {}

    for vector in residual_vectors:

        for domain in vector.propagation_targets:

            weight = DEFAULT_PROPAGATION_WEIGHTS.get(
                domain.lower(),
                DEFAULT_PROPAGATION_WEIGHTS["unknown"],
            )

            propagated_value = (
                vector.residual_strength * weight
            )

            if domain not in propagation_map:

                propagation_map[domain] = 0.0

            propagation_map[domain] += propagated_value

    for domain in propagation_map:

        propagation_map[domain] = round(
            min(propagation_map[domain], 1.0),
            4,
        )

    return propagation_map


# ============================================================
# GLOBAL RESIDUAL INSTABILITY
# ============================================================

def compute_global_residual_instability(
    propagation_map: Dict[str, float],
) -> float:

    if not propagation_map:
        return 0.0

    values = list(propagation_map.values())

    instability = sum(values) / len(values)

    return round(
        min(instability, 1.0),
        4,
    )


# ============================================================
# HIGH INSTABILITY DOMAINS
# ============================================================

def get_high_instability_domains(
    propagation_map: Dict[str, float],
    threshold: float = 0.70,
) -> Dict[str, float]:

    return {

        domain: score

        for domain, score in propagation_map.items()

        if score >= threshold
    }


# ============================================================
# RESIDUAL PROPAGATION SUMMARY
# ============================================================

def build_residual_summary(
    residual_vectors: List[ResidualVector],
) -> Dict:

    propagation_map = propagate_residuals(
        residual_vectors
    )

    instability = (
        compute_global_residual_instability(
            propagation_map
        )
    )

    high_instability = (
        get_high_instability_domains(
            propagation_map
        )
    )

    return {

        "residual_vector_count":
            len(residual_vectors),

        "global_residual_instability":
            instability,

        "propagation_map":
            propagation_map,

        "high_instability_domains":
            high_instability,
    }