# ============================================================
# attribute_registry.py
# iSEES-UAP — EMERGENCE ATTRIBUTE REGISTRY
# ============================================================

from typing import Dict

from isees_uap.emergence.attribute_types import (
    AttributeClass,
    SpecificityLevel,
    ObservabilityLevel,
    AttributeStatus,
)


# ============================================================
# CANONICAL ATTRIBUTE REGISTRY
# ============================================================

ATTRIBUTE_REGISTRY: Dict[str, dict] = {

    # ========================================================
    # MORPHOLOGY
    # ========================================================

    "pipe_morphology": {
        "id": "pipe_morphology",
        "class": AttributeClass.MORPHOLOGY.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.92,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Elongated cylindrical or pipe-like object morphology."
        ),
    },

    "sphere_morphology": {
        "id": "sphere_morphology",
        "class": AttributeClass.MORPHOLOGY.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.55,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Spherical or orb-like object morphology."
        ),
    },

    "disc_morphology": {
        "id": "disc_morphology",
        "class": AttributeClass.MORPHOLOGY.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.60,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Disc-shaped or flattened circular morphology."
        ),
    },

    "triangle_morphology": {
        "id": "triangle_morphology",
        "class": AttributeClass.MORPHOLOGY.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.84,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Triangular structured object morphology."
        ),
    },

    "metallic_surface": {
        "id": "metallic_surface",
        "class": AttributeClass.MORPHOLOGY.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.44,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Reflective or metallic surface appearance."
        ),
    },

    # ========================================================
    # BEHAVIOR
    # ========================================================

    "swarm_behavior": {
        "id": "swarm_behavior",
        "class": AttributeClass.BEHAVIOR.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.83,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Coordinated multi-object swarm-like behavior."
        ),
    },

    "coordinated_motion": {
        "id": "coordinated_motion",
        "class": AttributeClass.BEHAVIOR.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.62,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Synchronized or coordinated object movement."
        ),
    },

    "formation_splitting": {
        "id": "formation_splitting",
        "class": AttributeClass.BEHAVIOR.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.88,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Objects separating from a larger formation."
        ),
    },

    "playful_behavior": {
        "id": "playful_behavior",
        "class": AttributeClass.BEHAVIOR.value,
        "specificity": SpecificityLevel.EXTREME.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.97,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Behavior perceived as playful or game-like."
        ),
    },

    # ========================================================
    # KINEMATICS
    # ========================================================

    "instantaneous_departure": {
        "id": "instantaneous_departure",
        "class": AttributeClass.KINEMATICS.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.93,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Near-instantaneous acceleration or disappearance."
        ),
    },

    "non_ballistic_acceleration": {
        "id": "non_ballistic_acceleration",
        "class": AttributeClass.KINEMATICS.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.91,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Acceleration inconsistent with ballistic motion."
        ),
    },

    "hover_without_lift": {
        "id": "hover_without_lift",
        "class": AttributeClass.KINEMATICS.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.82,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Stable hovering without visible lift mechanism."
        ),
    },

    # ========================================================
    # RESIDUAL
    # ========================================================

    "silent_operation": {
        "id": "silent_operation",
        "class": AttributeClass.RESIDUAL.value,
        "specificity": SpecificityLevel.LOW.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.25,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Observed lack of audible sound."
        ),
    },

    "thermal_absence": {
        "id": "thermal_absence",
        "class": AttributeClass.RESIDUAL.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.WEAK.value,
        "rarity_base": 0.89,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Absence of expected thermal signature."
        ),
    },

    "light_emission": {
        "id": "light_emission",
        "class": AttributeClass.RESIDUAL.value,
        "specificity": SpecificityLevel.LOW.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.20,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Visible light emission from object or formation."
        ),
    },

    # ========================================================
    # FORMATION
    # ========================================================

    "triangle_formation": {
        "id": "triangle_formation",
        "class": AttributeClass.FORMATION.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.80,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Objects arranged in triangular geometry."
        ),
    },

    "linear_formation": {
        "id": "linear_formation",
        "class": AttributeClass.FORMATION.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.STRONG.value,
        "rarity_base": 0.40,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Objects aligned in linear arrangement."
        ),
    },

    # ========================================================
    # OBSERVER EFFECT
    # ========================================================

    "observer_awe_response": {
        "id": "observer_awe_response",
        "class": AttributeClass.OBSERVER_EFFECT.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.58,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Observer reports strong awe or amazement."
        ),
    },

    "observer_fear_response": {
        "id": "observer_fear_response",
        "class": AttributeClass.OBSERVER_EFFECT.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.52,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Observer reports fear or intimidation."
        ),
    },

    # ========================================================
    # SENSOR EFFECT
    # ========================================================

    "radar_confirmation": {
        "id": "radar_confirmation",
        "class": AttributeClass.SENSOR_EFFECT.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.VERIFIED.value,
        "rarity_base": 0.86,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Independent radar system confirmation."
        ),
    },

    "em_interference": {
        "id": "em_interference",
        "class": AttributeClass.SENSOR_EFFECT.value,
        "specificity": SpecificityLevel.HIGH.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.90,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Electromagnetic interference or disruption."
        ),
    },

    # ========================================================
    # INTERACTION
    # ========================================================

    "object_interaction": {
        "id": "object_interaction",
        "class": AttributeClass.INTERACTION.value,
        "specificity": SpecificityLevel.MEDIUM.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.68,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Observed interaction between multiple objects."
        ),
    },

    # ========================================================
    # TOPOLOGY
    # ========================================================

    "geo_stationary_presence": {
        "id": "geo_stationary_presence",
        "class": AttributeClass.TOPOLOGY.value,
        "specificity": SpecificityLevel.LOW.value,
        "observability": ObservabilityLevel.MODERATE.value,
        "rarity_base": 0.35,
        "status": AttributeStatus.ACTIVE.value,
        "observable": True,
        "description": (
            "Object remained fixed relative to geography."
        ),
    },

    "multi_region_resonance": {
        "id": "multi_region_resonance",
        "class": AttributeClass.TOPOLOGY.value,
        "specificity": SpecificityLevel.EXTREME.value,
        "observability": ObservabilityLevel.WEAK.value,
        "rarity_base": 0.98,
        "status": AttributeStatus.ACTIVE.value,
        "observable": False,
        "description": (
            "Potential cross-region emergence resonance."
        ),
    },
}


# ============================================================
# REGISTRY HELPERS
# ============================================================

def get_attribute(attribute_id: str) -> dict:

    return ATTRIBUTE_REGISTRY.get(attribute_id, {})


def has_attribute(attribute_id: str) -> bool:

    return attribute_id in ATTRIBUTE_REGISTRY


def get_attributes_by_class(attribute_class: str) -> Dict[str, dict]:

    return {
        k: v
        for k, v in ATTRIBUTE_REGISTRY.items()
        if v.get("class") == attribute_class
    }


def get_active_attributes() -> Dict[str, dict]:

    return {
        k: v
        for k, v in ATTRIBUTE_REGISTRY.items()
        if v.get("status") == AttributeStatus.ACTIVE.value
    }


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    "ATTRIBUTE_REGISTRY",
    "get_attribute",
    "has_attribute",
    "get_attributes_by_class",
    "get_active_attributes",
]