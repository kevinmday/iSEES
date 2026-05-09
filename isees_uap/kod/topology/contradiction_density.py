# ============================================================
# contradiction_density.py — CONTRADICTION DENSITY ENGINE (V1)
# ============================================================

from typing import List, Dict

from isees_uap.kod.topology.topology_models import (
    ContradictionNode,
)

from isees_uap.kod.topology.topology_types import (
    ContradictionNodeType,
)


# ============================================================
# DEFAULT CONTRADICTION WEIGHTS
# ============================================================

DEFAULT_CONTRADICTION_WEIGHTS = {

    ContradictionNodeType.SILENCE: 0.90,

    ContradictionNodeType.ACCELERATION: 1.00,

    ContradictionNodeType.THERMAL_ABSENCE: 0.80,

    ContradictionNodeType.NONSTANDARD_MANEUVER: 0.75,

    ContradictionNodeType.TRAJECTORY_BREAK: 0.70,

    ContradictionNodeType.RADAR_INCONSISTENCY: 0.65,

    ContradictionNodeType.VISUAL_MISMATCH: 0.50,

    ContradictionNodeType.UNKNOWN: 0.25,
}


# ============================================================
# BUILD CONTRADICTION NODE
# ============================================================

def build_contradiction_node(
    node_type: ContradictionNodeType,
    description: str,
    affected_domains: List[str],
    severity: float = None,
) -> ContradictionNode:

    if severity is None:

        severity = DEFAULT_CONTRADICTION_WEIGHTS.get(
            node_type,
            0.25,
        )

    severity = round(
        max(0.0, min(severity, 1.0)),
        4,
    )

    return ContradictionNode(
        node_type=node_type,
        description=description,
        severity=severity,
        affected_domains=affected_domains,
        propagated=False,
    )


# ============================================================
# CONTRADICTION DENSITY
# ============================================================

def compute_contradiction_density(
    contradiction_nodes: List[ContradictionNode],
    manifold_volume: float = 1.0,
) -> float:

    if not contradiction_nodes:
        return 0.0

    if manifold_volume <= 0:
        manifold_volume = 1.0

    total_weight = sum(
        node.severity
        for node in contradiction_nodes
    )

    density = total_weight / manifold_volume

    return round(
        min(density, 1.0),
        4,
    )


# ============================================================
# DOMAIN CONTRADICTION LOAD
# ============================================================

def compute_domain_contradiction_load(
    contradiction_nodes: List[ContradictionNode],
) -> Dict[str, float]:

    domain_loads = {}

    for node in contradiction_nodes:

        for domain in node.affected_domains:

            if domain not in domain_loads:
                domain_loads[domain] = 0.0

            domain_loads[domain] += node.severity

    for domain in domain_loads:

        domain_loads[domain] = round(
            min(domain_loads[domain], 1.0),
            4,
        )

    return domain_loads


# ============================================================
# HIGH-SEVERITY CONTRADICTIONS
# ============================================================

def get_high_severity_contradictions(
    contradiction_nodes: List[ContradictionNode],
    threshold: float = 0.75,
) -> List[ContradictionNode]:

    return [

        node

        for node in contradiction_nodes

        if node.severity >= threshold
    ]


# ============================================================
# CONTRADICTION SUMMARY
# ============================================================

def build_contradiction_summary(
    contradiction_nodes: List[ContradictionNode],
) -> Dict:

    density = compute_contradiction_density(
        contradiction_nodes
    )

    domain_loads = (
        compute_domain_contradiction_load(
            contradiction_nodes
        )
    )

    severe_nodes = (
        get_high_severity_contradictions(
            contradiction_nodes
        )
    )

    return {

        "contradiction_count":
            len(contradiction_nodes),

        "contradiction_density":
            density,

        "high_severity_count":
            len(severe_nodes),

        "domain_loads":
            domain_loads,

        "high_severity_descriptions": [

            node.description

            for node in severe_nodes
        ],
    }