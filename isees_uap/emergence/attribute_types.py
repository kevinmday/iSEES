# ============================================================
# attribute_types.py
# iSEES-UAP — EMERGENCE ATTRIBUTE TYPE SYSTEM
# ============================================================

from enum import Enum
from typing import Final, List


# ============================================================
# ATTRIBUTE CLASSES
# ============================================================

class AttributeClass(str, Enum):

    MORPHOLOGY = "morphology"
    BEHAVIOR = "behavior"
    KINEMATICS = "kinematics"
    RESIDUAL = "residual"
    FORMATION = "formation"
    ENVIRONMENTAL = "environmental"
    OBSERVER_EFFECT = "observer_effect"
    SENSOR_EFFECT = "sensor_effect"
    INTERACTION = "interaction"
    TOPOLOGY = "topology"


# ============================================================
# SPECIFICITY LEVELS
# ============================================================

class SpecificityLevel(str, Enum):

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


# ============================================================
# OBSERVABILITY LEVELS
# ============================================================

class ObservabilityLevel(str, Enum):

    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERIFIED = "verified"


# ============================================================
# ATTRIBUTE STATUS
# ============================================================

class AttributeStatus(str, Enum):

    ACTIVE = "active"
    DEPRECATED = "deprecated"
    EXPERIMENTAL = "experimental"


# ============================================================
# CANONICAL CLASS LIST
# ============================================================

ATTRIBUTE_CLASSES: Final[List[str]] = [
    AttributeClass.MORPHOLOGY.value,
    AttributeClass.BEHAVIOR.value,
    AttributeClass.KINEMATICS.value,
    AttributeClass.RESIDUAL.value,
    AttributeClass.FORMATION.value,
    AttributeClass.ENVIRONMENTAL.value,
    AttributeClass.OBSERVER_EFFECT.value,
    AttributeClass.SENSOR_EFFECT.value,
    AttributeClass.INTERACTION.value,
    AttributeClass.TOPOLOGY.value,
]


# ============================================================
# SPECIFICITY ORDERING
# ============================================================

SPECIFICITY_ORDER: Final[dict] = {
    SpecificityLevel.LOW.value: 1,
    SpecificityLevel.MEDIUM.value: 2,
    SpecificityLevel.HIGH.value: 3,
    SpecificityLevel.EXTREME.value: 4,
}


# ============================================================
# OBSERVABILITY ORDERING
# ============================================================

OBSERVABILITY_ORDER: Final[dict] = {
    ObservabilityLevel.WEAK.value: 1,
    ObservabilityLevel.MODERATE.value: 2,
    ObservabilityLevel.STRONG.value: 3,
    ObservabilityLevel.VERIFIED.value: 4,
}


# ============================================================
# ATTRIBUTE CLASS DESCRIPTIONS
# ============================================================

ATTRIBUTE_CLASS_DESCRIPTIONS: Final[dict] = {

    AttributeClass.MORPHOLOGY.value:
        "Physical or structural appearance attributes.",

    AttributeClass.BEHAVIOR.value:
        "Observed behavioral or coordination attributes.",

    AttributeClass.KINEMATICS.value:
        "Motion and acceleration related attributes.",

    AttributeClass.RESIDUAL.value:
        "Residual environmental or sensory absence/presence.",

    AttributeClass.FORMATION.value:
        "Group arrangement or formation geometry.",

    AttributeClass.ENVIRONMENTAL.value:
        "Environmental interaction or contextual conditions.",

    AttributeClass.OBSERVER_EFFECT.value:
        "Human observer psychological or physiological effects.",

    AttributeClass.SENSOR_EFFECT.value:
        "Radar, EM, IR, or instrumentation effects.",

    AttributeClass.INTERACTION.value:
        "Observed interaction between entities or systems.",

    AttributeClass.TOPOLOGY.value:
        "Spatial or relational emergence topology attributes.",
}


# ============================================================
# VALIDATION HELPERS
# ============================================================

def is_valid_attribute_class(value: str) -> bool:

    return value in ATTRIBUTE_CLASSES


def is_valid_specificity(value: str) -> bool:

    return value in SPECIFICITY_ORDER


def is_valid_observability(value: str) -> bool:

    return value in OBSERVABILITY_ORDER


# ============================================================
# NORMALIZATION HELPERS
# ============================================================

def normalize_attribute_class(value: str) -> str:

    if not value:
        return ""

    value = value.strip().lower()

    if value in ATTRIBUTE_CLASSES:
        return value

    return ""


def normalize_specificity(value: str) -> str:

    if not value:
        return ""

    value = value.strip().lower()

    if value in SPECIFICITY_ORDER:
        return value

    return ""


def normalize_observability(value: str) -> str:

    if not value:
        return ""

    value = value.strip().lower()

    if value in OBSERVABILITY_ORDER:
        return value

    return ""


# ============================================================
# MODULE EXPORTS
# ============================================================

__all__ = [
    "AttributeClass",
    "SpecificityLevel",
    "ObservabilityLevel",
    "AttributeStatus",
    "ATTRIBUTE_CLASSES",
    "SPECIFICITY_ORDER",
    "OBSERVABILITY_ORDER",
    "ATTRIBUTE_CLASS_DESCRIPTIONS",
    "is_valid_attribute_class",
    "is_valid_specificity",
    "is_valid_observability",
    "normalize_attribute_class",
    "normalize_specificity",
    "normalize_observability",
]