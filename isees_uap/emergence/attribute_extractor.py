# ============================================================
# attribute_extractor.py
# iSEES-UAP — DETERMINISTIC ATTRIBUTE EXTRACTION ENGINE
# ============================================================

import re

from typing import Dict, List, Set

from isees_uap.emergence.attribute_registry import (
    ATTRIBUTE_REGISTRY,
    has_attribute,
)


# ============================================================
# PATTERN REGISTRY
# ============================================================

ATTRIBUTE_PATTERNS: Dict[str, List[str]] = {

    # ========================================================
    # MORPHOLOGY
    # ========================================================

    "pipe_morphology": [
        r"\bpipe[- ]?shaped\b",
        r"\bcylindrical\b",
        r"\belongated tube\b",
        r"\btic tac\b",
        r"\bwhite tic tac\b",
    ],

    "sphere_morphology": [
        r"\bsphere\b",
        r"\bspherical\b",
        r"\borb\b",
        r"\borb-like\b",
        r"\bball of light\b",
    ],

    "disc_morphology": [
        r"\bdisc\b",
        r"\bdisk\b",
        r"\bsaucer\b",
    ],

    "triangle_morphology": [
        r"\btriangle\b",
        r"\btriangular\b",
    ],

    "metallic_surface": [
        r"\bmetallic\b",
        r"\breflective\b",
        r"\bsilver\b",
        r"\bchrome\b",
    ],

    # ========================================================
    # BEHAVIOR
    # ========================================================

    "swarm_behavior": [
        r"\bswarm\b",
        r"\bswarming\b",
        r"\bmultiple objects\b",
        r"\bfleet\b",
    ],

    "coordinated_motion": [
        r"\bcoordinated\b",
        r"\bsynchronized\b",
        r"\bmoving together\b",
        r"\bin formation\b",
    ],

    "formation_splitting": [
        r"\bsplit apart\b",
        r"\bseparated from formation\b",
        r"\bbroke formation\b",
    ],

    "playful_behavior": [
        r"\bplaying\b",
        r"\bgame[- ]?like\b",
        r"\btag\b",
        r"\bplayful\b",
    ],

    # ========================================================
    # KINEMATICS
    # ========================================================

    "instantaneous_departure": [
        r"\binstantly disappeared\b",
        r"\bshot away\b",
        r"\bvanished instantly\b",
        r"\bblink of an eye\b",
        r"\binstantaneous departure\b",
    ],

    "non_ballistic_acceleration": [
        r"\bimpossible acceleration\b",
        r"\bnon-ballistic\b",
        r"\bsharp angle turn\b",
        r"\binstant acceleration\b",
    ],

    "hover_without_lift": [
        r"\bhovering\b",
        r"\bstationary in air\b",
        r"\bfloating\b",
        r"\bhovered silently\b",
    ],

    # ========================================================
    # RESIDUAL
    # ========================================================

    "silent_operation": [
        r"\bsilent\b",
        r"\bno sound\b",
        r"\bcompletely quiet\b",
    ],

    "thermal_absence": [
        r"\bno thermal\b",
        r"\bthermal absence\b",
        r"\bno heat signature\b",
    ],

    "light_emission": [
        r"\bglowing\b",
        r"\bemitting light\b",
        r"\bbright light\b",
        r"\bluminous\b",
    ],

    # ========================================================
    # FORMATION
    # ========================================================

    "triangle_formation": [
        r"\btriangle formation\b",
        r"\btriangular arrangement\b",
    ],

    "linear_formation": [
        r"\bline formation\b",
        r"\blinear formation\b",
        r"\bobjects in a line\b",
    ],

    # ========================================================
    # OBSERVER EFFECT
    # ========================================================

    "observer_awe_response": [
        r"\bawe\b",
        r"\bamazed\b",
        r"\bmesmerized\b",
        r"\bastonished\b",
    ],

    "observer_fear_response": [
        r"\bterrified\b",
        r"\bafraid\b",
        r"\bscared\b",
        r"\bfear\b",
    ],

    # ========================================================
    # SENSOR EFFECT
    # ========================================================

    "radar_confirmation": [
        r"\bradar contact\b",
        r"\bradar confirmed\b",
        r"\btracked on radar\b",
    ],

    "em_interference": [
        r"\bem interference\b",
        r"\binstrument malfunction\b",
        r"\bcompass failure\b",
        r"\belectronic disruption\b",
    ],

    # ========================================================
    # INTERACTION
    # ========================================================

    "object_interaction": [
        r"\binteracting\b",
        r"\bobjects engaged\b",
        r"\bresponded to each other\b",
    ],

    # ========================================================
    # TOPOLOGY
    # ========================================================

    "geo_stationary_presence": [
        r"\bstationary over\b",
        r"\bremained fixed\b",
        r"\bhovered over\b",
    ],
}


# ============================================================
# EXTRACTION ENGINE
# ============================================================

def extract_attributes(text: str) -> List[dict]:

    if not text:
        return []

    normalized_text = normalize_text(text)

    discovered: Set[str] = set()

    extracted: List[dict] = []

    for attribute_id, patterns in ATTRIBUTE_PATTERNS.items():

        if not has_attribute(attribute_id):
            continue

        matched = False

        for pattern in patterns:

            if re.search(pattern, normalized_text):

                matched = True
                break

        if not matched:
            continue

        if attribute_id in discovered:
            continue

        discovered.add(attribute_id)

        attribute_data = ATTRIBUTE_REGISTRY[attribute_id]

        extracted.append({
            "attribute_id": attribute_id,
            "class": attribute_data["class"],
            "specificity": attribute_data["specificity"],
            "rarity_base": attribute_data["rarity_base"],
            "observability": attribute_data["observability"],
            "confidence": calculate_confidence(attribute_data),
            "description": attribute_data["description"],
        })

    return extracted


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(text: str) -> str:

    text = text.lower()

    text = text.replace("\n", " ")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# CONFIDENCE ENGINE
# ============================================================

def calculate_confidence(attribute_data: dict) -> float:

    specificity = attribute_data.get("specificity", "low")

    base = 0.50

    if specificity == "medium":
        base = 0.65

    elif specificity == "high":
        base = 0.80

    elif specificity == "extreme":
        base = 0.92

    observability = attribute_data.get("observability", "weak")

    if observability == "moderate":
        base += 0.03

    elif observability == "strong":
        base += 0.06

    elif observability == "verified":
        base += 0.10

    return round(min(base, 0.99), 2)


# ============================================================
# SUMMARY HELPERS
# ============================================================

def summarize_attributes(attributes: List[dict]) -> dict:

    summary = {
        "total_attributes": len(attributes),
        "classes": {},
        "attribute_ids": [],
    }

    for item in attributes:

        attribute_class = item.get("class", "unknown")

        summary["classes"].setdefault(attribute_class, 0)

        summary["classes"][attribute_class] += 1

        summary["attribute_ids"].append(
            item.get("attribute_id")
        )

    return summary


# ============================================================
# DEBUG HELPERS
# ============================================================

def debug_extract(text: str) -> dict:

    attributes = extract_attributes(text)

    return {
        "input": text,
        "normalized_input": normalize_text(text),
        "attributes": attributes,
        "summary": summarize_attributes(attributes),
    }


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    "ATTRIBUTE_PATTERNS",
    "extract_attributes",
    "normalize_text",
    "calculate_confidence",
    "summarize_attributes",
    "debug_extract",
]