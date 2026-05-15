# ============================================================
# signature_engine.py
# iSEES-UAP — EMERGENCE SIGNATURE SYNTHESIS ENGINE
# ============================================================

import hashlib
import json

from typing import Dict, List

from isees_uap.emergence.attribute_registry import (
    ATTRIBUTE_REGISTRY,
)


# ============================================================
# SIGNATURE ENGINE
# ============================================================

def build_signature(attributes: List[dict]) -> dict:

    if not attributes:

        return empty_signature()

    normalized_attributes = normalize_attributes(attributes)

    attribute_ids = sorted([
        item["attribute_id"]
        for item in normalized_attributes
    ])

    signature_hash = generate_signature_hash(attribute_ids)

    signature_specificity = calculate_signature_specificity(
        normalized_attributes
    )

    signature_rarity = calculate_signature_rarity(
        normalized_attributes
    )

    signature_density = calculate_signature_density(
        normalized_attributes
    )

    signature_classes = calculate_signature_classes(
        normalized_attributes
    )

    signature_uniqueness = calculate_signature_uniqueness(
        specificity=signature_specificity,
        rarity=signature_rarity,
        density=signature_density,
    )

    return {
        "signature_hash": signature_hash,
        "attribute_count": len(attribute_ids),
        "attribute_ids": attribute_ids,
        "signature_specificity": signature_specificity,
        "signature_rarity": signature_rarity,
        "signature_density": signature_density,
        "signature_uniqueness": signature_uniqueness,
        "signature_classes": signature_classes,
    }


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_attributes(attributes: List[dict]) -> List[dict]:

    discovered = {}

    for item in attributes:

        attribute_id = item.get("attribute_id")

        if not attribute_id:
            continue

        if attribute_id not in ATTRIBUTE_REGISTRY:
            continue

        discovered[attribute_id] = item

    return list(discovered.values())


# ============================================================
# HASH ENGINE
# ============================================================

def generate_signature_hash(attribute_ids: List[str]) -> str:

    payload = json.dumps(
        sorted(attribute_ids),
        separators=(",", ":"),
    )

    digest = hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()

    return digest[:24]


# ============================================================
# SPECIFICITY
# ============================================================

def calculate_signature_specificity(
    attributes: List[dict]
) -> float:

    if not attributes:
        return 0.0

    weights = {
        "low": 0.25,
        "medium": 0.50,
        "high": 0.80,
        "extreme": 1.00,
    }

    values = []

    for item in attributes:

        specificity = item.get(
            "specificity",
            "low",
        )

        values.append(
            weights.get(specificity, 0.25)
        )

    score = sum(values) / len(values)

    return round(score, 3)


# ============================================================
# RARITY
# ============================================================

def calculate_signature_rarity(
    attributes: List[dict]
) -> float:

    if not attributes:
        return 0.0

    values = []

    for item in attributes:

        rarity = item.get(
            "rarity_base",
            0.0,
        )

        values.append(rarity)

    score = sum(values) / len(values)

    return round(score, 3)


# ============================================================
# DENSITY
# ============================================================

def calculate_signature_density(
    attributes: List[dict]
) -> float:

    if not attributes:
        return 0.0

    unique_classes = set()

    for item in attributes:

        attribute_class = item.get("class")

        if attribute_class:
            unique_classes.add(attribute_class)

    density = len(attributes) / max(
        len(unique_classes),
        1,
    )

    normalized_density = min(
        density / 3.0,
        1.0,
    )

    return round(normalized_density, 3)


# ============================================================
# CLASS DISTRIBUTION
# ============================================================

def calculate_signature_classes(
    attributes: List[dict]
) -> Dict[str, int]:

    classes = {}

    for item in attributes:

        attribute_class = item.get(
            "class",
            "unknown",
        )

        classes.setdefault(
            attribute_class,
            0,
        )

        classes[attribute_class] += 1

    return classes


# ============================================================
# UNIQUENESS ENGINE
# ============================================================

def calculate_signature_uniqueness(
    specificity: float,
    rarity: float,
    density: float,
) -> float:

    uniqueness = (
        (specificity * 0.40)
        +
        (rarity * 0.45)
        +
        (density * 0.15)
    )

    return round(
        min(uniqueness, 1.0),
        3,
    )


# ============================================================
# EMPTY SIGNATURE
# ============================================================

def empty_signature() -> dict:

    return {
        "signature_hash": None,
        "attribute_count": 0,
        "attribute_ids": [],
        "signature_specificity": 0.0,
        "signature_rarity": 0.0,
        "signature_density": 0.0,
        "signature_uniqueness": 0.0,
        "signature_classes": {},
    }


# ============================================================
# COMPARISON ENGINE
# ============================================================

def compare_signatures(
    sig_a: dict,
    sig_b: dict,
) -> dict:

    attrs_a = set(
        sig_a.get("attribute_ids", [])
    )

    attrs_b = set(
        sig_b.get("attribute_ids", [])
    )

    intersection = attrs_a.intersection(attrs_b)

    union = attrs_a.union(attrs_b)

    overlap_ratio = 0.0

    if union:
        overlap_ratio = len(intersection) / len(union)

    uniqueness_delta = abs(
        sig_a.get("signature_uniqueness", 0.0)
        -
        sig_b.get("signature_uniqueness", 0.0)
    )

    return {
        "shared_attributes": sorted(
            list(intersection)
        ),
        "shared_count": len(intersection),
        "overlap_ratio": round(
            overlap_ratio,
            3,
        ),
        "uniqueness_delta": round(
            uniqueness_delta,
            3,
        ),
    }


# ============================================================
# DEBUG HELPERS
# ============================================================

def debug_signature(
    attributes: List[dict]
) -> dict:

    signature = build_signature(attributes)

    return {
        "input_attributes": attributes,
        "signature": signature,
    }


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    "build_signature",
    "normalize_attributes",
    "generate_signature_hash",
    "calculate_signature_specificity",
    "calculate_signature_rarity",
    "calculate_signature_density",
    "calculate_signature_classes",
    "calculate_signature_uniqueness",
    "compare_signatures",
    "empty_signature",
    "debug_signature",
]