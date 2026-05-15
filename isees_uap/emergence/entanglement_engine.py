# ============================================================
# entanglement_engine.py
# iSEES-UAP — DETERMINISTIC TOPOLOGY RELATION ENGINE
# ============================================================

from typing import Dict, List, Set

from isees_uap.emergence.signature_engine import (
    compare_signatures,
)


# ============================================================
# RELATION TYPES
# ============================================================

LOCAL_RELATION = "local_relation"

ENTANGLED_RELATION = "entangled_relation"

WEAK_RELATION = "weak_relation"

NO_RELATION = "no_relation"


# ============================================================
# ENTANGLEMENT CLASSES
# ============================================================

ENTANGLEMENT_CLASSES = {
    "minimal": 0.20,
    "moderate": 0.45,
    "strong": 0.70,
    "extreme": 0.90,
}


# ============================================================
# PRIMARY ENGINE
# ============================================================

def compute_entanglement(
    signature_a: dict,
    signature_b: dict,
    geo_distance_km: float = None,
    time_delta_hours: float = None,
) -> dict:

    comparison = compare_signatures(
        signature_a,
        signature_b,
    )

    shared_attributes = comparison["shared_attributes"]

    overlap_ratio = comparison["overlap_ratio"]

    shared_specificity = calculate_shared_specificity(
        shared_attributes,
        signature_a,
        signature_b,
    )

    rarity_overlap = calculate_rarity_overlap(
        shared_attributes,
        signature_a,
        signature_b,
    )

    topology_coherence = calculate_topology_coherence(
        overlap_ratio=overlap_ratio,
        specificity=shared_specificity,
        rarity=rarity_overlap,
    )

    locality_factor = calculate_locality_factor(
        geo_distance_km=geo_distance_km,
        time_delta_hours=time_delta_hours,
    )

    entanglement_score = calculate_entanglement_score(
        topology_coherence=topology_coherence,
        locality_factor=locality_factor,
    )

    entanglement_class = classify_entanglement(
        entanglement_score
    )

    relation_type = classify_relation_type(
        entanglement_score=entanglement_score,
        locality_factor=locality_factor,
    )

    return {
        "shared_attributes": shared_attributes,
        "shared_count": len(shared_attributes),
        "overlap_ratio": overlap_ratio,
        "shared_specificity": shared_specificity,
        "rarity_overlap": rarity_overlap,
        "topology_coherence": topology_coherence,
        "locality_factor": locality_factor,
        "entanglement_score": entanglement_score,
        "entanglement_class": entanglement_class,
        "relation_type": relation_type,
    }


# ============================================================
# SPECIFICITY OVERLAP
# ============================================================

def calculate_shared_specificity(
    shared_attributes: List[str],
    signature_a: dict,
    signature_b: dict,
) -> float:

    if not shared_attributes:
        return 0.0

    specificity_map = {
        "low": 0.25,
        "medium": 0.50,
        "high": 0.80,
        "extreme": 1.00,
    }

    attribute_lookup = build_attribute_lookup(
        signature_a,
        signature_b,
    )

    values = []

    for attribute_id in shared_attributes:

        item = attribute_lookup.get(attribute_id)

        if not item:
            continue

        specificity = item.get(
            "specificity",
            "low",
        )

        values.append(
            specificity_map.get(
                specificity,
                0.25,
            )
        )

    if not values:
        return 0.0

    return round(
        sum(values) / len(values),
        3,
    )


# ============================================================
# RARITY OVERLAP
# ============================================================

def calculate_rarity_overlap(
    shared_attributes: List[str],
    signature_a: dict,
    signature_b: dict,
) -> float:

    if not shared_attributes:
        return 0.0

    attribute_lookup = build_attribute_lookup(
        signature_a,
        signature_b,
    )

    values = []

    for attribute_id in shared_attributes:

        item = attribute_lookup.get(attribute_id)

        if not item:
            continue

        values.append(
            item.get(
                "rarity_base",
                0.0,
            )
        )

    if not values:
        return 0.0

    return round(
        sum(values) / len(values),
        3,
    )


# ============================================================
# TOPOLOGY COHERENCE
# ============================================================

def calculate_topology_coherence(
    overlap_ratio: float,
    specificity: float,
    rarity: float,
) -> float:

    coherence = (
        (overlap_ratio * 0.35)
        +
        (specificity * 0.35)
        +
        (rarity * 0.30)
    )

    return round(
        min(coherence, 1.0),
        3,
    )


# ============================================================
# LOCALITY FACTOR
# ============================================================

def calculate_locality_factor(
    geo_distance_km: float = None,
    time_delta_hours: float = None,
) -> float:

    score = 1.0

    # --------------------------------------------------------
    # GEO DISTANCE
    # --------------------------------------------------------

    if geo_distance_km is not None:

        if geo_distance_km > 100:
            score -= 0.10

        if geo_distance_km > 500:
            score -= 0.15

        if geo_distance_km > 2000:
            score -= 0.20

        if geo_distance_km > 8000:
            score -= 0.25

    # --------------------------------------------------------
    # TIME DELTA
    # --------------------------------------------------------

    if time_delta_hours is not None:

        if time_delta_hours > 24:
            score -= 0.05

        if time_delta_hours > 72:
            score -= 0.10

        if time_delta_hours > 168:
            score -= 0.15

        if time_delta_hours > 720:
            score -= 0.20

    return round(
        max(score, 0.05),
        3,
    )


# ============================================================
# ENTANGLEMENT SCORE
# ============================================================

def calculate_entanglement_score(
    topology_coherence: float,
    locality_factor: float,
) -> float:

    score = (
        (topology_coherence * 0.75)
        +
        (locality_factor * 0.25)
    )

    return round(
        min(score, 1.0),
        3,
    )


# ============================================================
# RELATION CLASSIFICATION
# ============================================================

def classify_entanglement(
    score: float
) -> str:

    if score >= ENTANGLEMENT_CLASSES["extreme"]:
        return "extreme"

    if score >= ENTANGLEMENT_CLASSES["strong"]:
        return "strong"

    if score >= ENTANGLEMENT_CLASSES["moderate"]:
        return "moderate"

    if score >= ENTANGLEMENT_CLASSES["minimal"]:
        return "minimal"

    return "none"


# ============================================================
# RELATION TYPE
# ============================================================

def classify_relation_type(
    entanglement_score: float,
    locality_factor: float,
) -> str:

    if entanglement_score < 0.20:
        return NO_RELATION

    if locality_factor >= 0.75:
        return LOCAL_RELATION

    if entanglement_score >= 0.45:
        return ENTANGLED_RELATION

    return WEAK_RELATION


# ============================================================
# ATTRIBUTE LOOKUP
# ============================================================

def build_attribute_lookup(
    signature_a: dict,
    signature_b: dict,
) -> Dict[str, dict]:

    lookup = {}

    for item in signature_a.get(
        "attributes",
        []
    ):

        attribute_id = item.get("attribute_id")

        if attribute_id:
            lookup[attribute_id] = item

    for item in signature_b.get(
        "attributes",
        []
    ):

        attribute_id = item.get("attribute_id")

        if attribute_id:
            lookup[attribute_id] = item

    return lookup


# ============================================================
# DEBUG HELPERS
# ============================================================

def debug_entanglement(
    signature_a: dict,
    signature_b: dict,
    geo_distance_km: float = None,
    time_delta_hours: float = None,
) -> dict:

    result = compute_entanglement(
        signature_a=signature_a,
        signature_b=signature_b,
        geo_distance_km=geo_distance_km,
        time_delta_hours=time_delta_hours,
    )

    return {
        "signature_a": signature_a,
        "signature_b": signature_b,
        "result": result,
    }


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    "LOCAL_RELATION",
    "ENTANGLED_RELATION",
    "WEAK_RELATION",
    "NO_RELATION",
    "compute_entanglement",
    "calculate_shared_specificity",
    "calculate_rarity_overlap",
    "calculate_topology_coherence",
    "calculate_locality_factor",
    "calculate_entanglement_score",
    "classify_entanglement",
    "classify_relation_type",
    "compare_signatures",
    "debug_entanglement",
]