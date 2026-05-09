# ============================================================
# ambiguity_index.py — GENERALIZED TOPOLOGICAL AMBIGUITY (V1)
# ============================================================

from typing import Dict

from isees_uap.kod.topology.topology_models import (
    TopologyState,
)

from isees_uap.kod.topology.topology_types import (
    AmbiguityState,
    TopologyStabilityState,
)


# ============================================================
# DEFAULT TOPOLOGY WEIGHTS
# ============================================================

DEFAULT_AMBIGUITY_WEIGHTS = {

    "overlap": 0.20,

    "contradiction_density": 0.25,

    "residual_instability": 0.20,

    "cluster_fragmentation": 0.20,

    "entanglement": 0.15,
}


# ============================================================
# RESOLVE AMBIGUITY STATE
# ============================================================

def resolve_ambiguity_state(
    ambiguity_score: float,
) -> AmbiguityState:

    if ambiguity_score >= 0.85:
        return AmbiguityState.EXTREME

    if ambiguity_score >= 0.65:
        return AmbiguityState.SEVERE

    if ambiguity_score >= 0.45:
        return AmbiguityState.HIGH

    if ambiguity_score >= 0.20:
        return AmbiguityState.MODERATE

    return AmbiguityState.LOW


# ============================================================
# RESOLVE TOPOLOGY STABILITY
# ============================================================

def resolve_topology_stability(
    ambiguity_score: float,
) -> TopologyStabilityState:

    if ambiguity_score >= 0.85:
        return TopologyStabilityState.COLLAPSING

    if ambiguity_score >= 0.65:
        return TopologyStabilityState.UNSTABLE

    if ambiguity_score >= 0.45:
        return TopologyStabilityState.FRAGMENTED

    if ambiguity_score >= 0.20:
        return TopologyStabilityState.PARTIAL

    return TopologyStabilityState.STABLE


# ============================================================
# COMPUTE GENERALIZED AMBIGUITY
# ============================================================

def compute_generalized_ambiguity(
    overlap_score: float,
    contradiction_density: float,
    residual_instability: float,
    cluster_fragmentation: float,
    entanglement_score: float,
) -> float:

    ambiguity = (

        overlap_score
        * DEFAULT_AMBIGUITY_WEIGHTS["overlap"]

        +

        contradiction_density
        * DEFAULT_AMBIGUITY_WEIGHTS[
            "contradiction_density"
        ]

        +

        residual_instability
        * DEFAULT_AMBIGUITY_WEIGHTS[
            "residual_instability"
        ]

        +

        cluster_fragmentation
        * DEFAULT_AMBIGUITY_WEIGHTS[
            "cluster_fragmentation"
        ]

        +

        entanglement_score
        * DEFAULT_AMBIGUITY_WEIGHTS[
            "entanglement"
        ]
    )

    return round(
        max(0.0, min(ambiguity, 1.0)),
        4,
    )


# ============================================================
# BUILD TOPOLOGY STATE
# ============================================================

def build_topology_state(
    overlap_score: float,
    contradiction_density: float,
    residual_instability: float,
    cluster_fragmentation: float,
    entanglement_score: float,
    metadata: Dict = None,
) -> TopologyState:

    ambiguity_score = (
        compute_generalized_ambiguity(
            overlap_score=overlap_score,

            contradiction_density=
                contradiction_density,

            residual_instability=
                residual_instability,

            cluster_fragmentation=
                cluster_fragmentation,

            entanglement_score=
                entanglement_score,
        )
    )

    ambiguity_state = (
        resolve_ambiguity_state(
            ambiguity_score
        )
    )

    stability_state = (
        resolve_topology_stability(
            ambiguity_score
        )
    )

    return TopologyState(

        overlap_score=overlap_score,

        contradiction_density=
            contradiction_density,

        residual_instability=
            residual_instability,

        cluster_fragmentation=
            cluster_fragmentation,

        entanglement_score=
            entanglement_score,

        ambiguity_score=
            ambiguity_score,

        ambiguity_state=
            ambiguity_state,

        stability_state=
            stability_state,

        metadata=metadata or {},
    )


# ============================================================
# TOPOLOGY SUMMARY
# ============================================================

def build_topology_summary(
    topology_state: TopologyState,
) -> Dict:

    return {

        "ambiguity_score":
            topology_state.ambiguity_score,

        "ambiguity_state":
            topology_state.ambiguity_state.value,

        "stability_state":
            topology_state.stability_state.value,

        "overlap_score":
            topology_state.overlap_score,

        "contradiction_density":
            topology_state.contradiction_density,

        "residual_instability":
            topology_state.residual_instability,

        "cluster_fragmentation":
            topology_state.cluster_fragmentation,

        "entanglement_score":
            topology_state.entanglement_score,
    }