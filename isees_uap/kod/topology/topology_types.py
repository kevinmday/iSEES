# ============================================================
# topology_types.py — KOD TOPOLOGY TYPE DEFINITIONS (V1)
# ============================================================

from enum import Enum


# ============================================================
# TOPOLOGY CLUSTER TYPES
# ============================================================

class TopologyClusterType(str, Enum):

    AVIATION = "aviation"
    WEATHER = "weather"
    SENSOR_ARTIFACT = "sensor_artifact"
    ASTRONOMICAL = "astronomical"
    UNKNOWN = "unknown"


# ============================================================
# CONTRADICTION NODE TYPES
# ============================================================

class ContradictionNodeType(str, Enum):

    SILENCE = "silence"
    ACCELERATION = "acceleration"
    THERMAL_ABSENCE = "thermal_absence"
    NONSTANDARD_MANEUVER = "nonstandard_maneuver"
    TRAJECTORY_BREAK = "trajectory_break"
    RADAR_INCONSISTENCY = "radar_inconsistency"
    VISUAL_MISMATCH = "visual_mismatch"
    UNKNOWN = "unknown"


# ============================================================
# RESIDUAL VECTOR TYPES
# ============================================================

class ResidualVectorType(str, Enum):

    MOTION = "motion"
    VISUAL = "visual"
    SENSOR = "sensor"
    TEMPORAL = "temporal"
    ENVIRONMENTAL = "environmental"
    UNKNOWN = "unknown"


# ============================================================
# DOMAIN LINK TYPES
# ============================================================

class DomainLinkType(str, Enum):

    SUPPORTIVE = "supportive"
    CONTRADICTORY = "contradictory"
    ENTANGLED = "entangled"
    PARTIAL = "partial"
    UNKNOWN = "unknown"


# ============================================================
# OVERLAP REGION TYPES
# ============================================================

class OverlapRegionType(str, Enum):

    VISUAL = "visual"
    MOTION = "motion"
    TRAJECTORY = "trajectory"
    SENSOR = "sensor"
    TEMPORAL = "temporal"
    ENVIRONMENTAL = "environmental"
    UNKNOWN = "unknown"


# ============================================================
# TOPOLOGY STABILITY STATES
# ============================================================

class TopologyStabilityState(str, Enum):

    STABLE = "stable"
    PARTIAL = "partial"
    FRAGMENTED = "fragmented"
    UNSTABLE = "unstable"
    COLLAPSING = "collapsing"


# ============================================================
# AMBIGUITY STATES
# ============================================================

class AmbiguityState(str, Enum):

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"
    EXTREME = "extreme"


# ============================================================
# ENTANGLEMENT STATES
# ============================================================

class EntanglementState(str, Enum):

    ISOLATED = "isolated"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    CRITICAL = "critical"