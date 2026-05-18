# ============================================================
# observability_types.py
# iSEES — OBSERVABILITY SUBSYSTEM
# CANONICAL OBSERVABILITY TYPES
# ============================================================

from enum import Enum


# ============================================================
# OBSERVABILITY COMPONENT TYPES
# ============================================================

class ObservabilityComponentType(str, Enum):

    POPULATION_DENSITY = (
        "population_density"
    )

    INFRASTRUCTURE_DENSITY = (
        "infrastructure_density"
    )

    AVIATION_DENSITY = (
        "aviation_density"
    )

    SENSOR_DENSITY = (
        "sensor_density"
    )

    COMMUNICATIONS_COVERAGE = (
        "communications_coverage"
    )

    VISIBILITY_QUALITY = (
        "visibility_quality"
    )

    TERRAIN_ACCESSIBILITY = (
        "terrain_accessibility"
    )

    HISTORICAL_REPORTING_PROBABILITY = (
        "historical_reporting_probability"
    )


# ============================================================
# OBSERVABILITY PROVIDER TYPES
# ============================================================

class ObservabilityProviderType(str, Enum):

    POPULATION = "population"

    INFRASTRUCTURE = "infrastructure"

    AVIATION = "aviation"

    SENSOR = "sensor"

    WEATHER = "weather"

    COMMUNICATIONS = "communications"

    TERRAIN = "terrain"

    HISTORICAL = "historical"


# ============================================================
# OBSERVABILITY FIELD TYPES
# ============================================================

class ObservabilityFieldType(str, Enum):

    STATIC = "static"

    DYNAMIC = "dynamic"

    TEMPORAL = "temporal"

    HYBRID = "hybrid"


# ============================================================
# OBSERVABILITY CONFIDENCE TYPES
# ============================================================

class ObservabilityConfidenceType(str, Enum):

    LOW = "low"

    MEDIUM = "medium"

    HIGH = "high"

    VERIFIED = "verified"


# ============================================================
# OBSERVABILITY STALENESS TYPES
# ============================================================

class ObservabilityStalenessType(str, Enum):

    LIVE = "live"

    RECENT = "recent"

    STALE = "stale"

    EXPIRED = "expired"


# ============================================================
# OBSERVABILITY RESOLUTION TYPES
# ============================================================

class ObservabilityResolutionType(str, Enum):

    LOCAL = "local"

    REGIONAL = "regional"

    NATIONAL = "national"

    GLOBAL = "global"


# ============================================================
# OBSERVABILITY NORMALIZATION TYPES
# ============================================================

class ObservabilityNormalizationType(str, Enum):

    RAW = "raw"

    STABILIZED = "stabilized"

    LOG_SCALED = "log_scaled"

    BOUNDED = "bounded"

    TEMPORALLY_WEIGHTED = (
        "temporally_weighted"
    )


# ============================================================
# OBSERVABILITY STABILIZATION TYPES
# ============================================================

class ObservabilityStabilizationType(str, Enum):

    FLOOR_CLAMP = "floor_clamp"

    LOG_DAMPING = "log_damping"

    SOFT_LIMIT = "soft_limit"

    HARD_LIMIT = "hard_limit"

    HYBRID = "hybrid"


# ============================================================
# OBSERVABILITY TEMPORAL TYPES
# ============================================================

class ObservabilityTemporalType(str, Enum):

    DAY = "day"

    NIGHT = "night"

    TWILIGHT = "twilight"

    STORM = "storm"

    HIGH_ACTIVITY = "high_activity"

    LOW_ACTIVITY = "low_activity"


# ============================================================
# OBSERVABILITY MANIFOLD STATES
# ============================================================

class ObservabilityManifoldState(str, Enum):

    UNDER_OBSERVED = "under_observed"

    BALANCED = "balanced"

    OVER_OBSERVED = "over_observed"

    SENSOR_HEAVY = "sensor_heavy"

    HUMAN_HEAVY = "human_heavy"

    INFRASTRUCTURE_HEAVY = (
        "infrastructure_heavy"
    )


# ============================================================
# OBSERVABILITY EVENT EFFECT
# ============================================================

class ObservabilityEventEffect(str, Enum):

    SUPPRESSED = "suppressed"

    NORMALIZED = "normalized"

    AMPLIFIED = "amplified"

    ESCALATED = "escalated"


# ============================================================
# OBSERVABILITY PROVIDER STATUS
# ============================================================

class ObservabilityProviderStatus(str, Enum):

    AVAILABLE = "available"

    DEGRADED = "degraded"

    OFFLINE = "offline"

    STALE = "stale"

    UNKNOWN = "unknown"


# ============================================================
# OBSERVABILITY ENGINE MODES
# ============================================================

class ObservabilityEngineMode(str, Enum):

    DEVELOPMENT = "development"

    TESTING = "testing"

    LIVE = "live"

    REPLAY = "replay"

    SYNTHETIC = "synthetic"


# ============================================================
# OBSERVABILITY EPISTEMIC TYPES
# ============================================================

class InfrastructureEpoch(str, Enum):

    PRE_RADAR = "pre_radar"

    EARLY_RADAR = "early_radar"

    COLD_WAR = "cold_war"

    PRE_DIGITAL = "pre_digital"

    EARLY_DIGITAL = "early_digital"

    NETWORKED = "networked"

    SATELLITE_AWARE = "satellite_aware"

    MODERN_SENSOR_FUSION = (
        "modern_sensor_fusion"
    )

    AI_ASSISTED = "ai_assisted"


# ============================================================
# AUTHORITY STATE
# ============================================================

class AuthorityState(str, Enum):

    CIVILIAN_LIMITED = (
        "civilian_limited"
    )

    CIVILIAN_OPEN = (
        "civilian_open"
    )

    MILITARY_RESTRICTED = (
        "military_restricted"
    )

    MILITARY_ACTIVE = (
        "military_active"
    )

    JOINT_OPERATIONAL = (
        "joint_operational"
    )

    DENIED_ENVIRONMENT = (
        "denied_environment"
    )

    UNKNOWN = "unknown"


# ============================================================
# EPISTEMIC STATE
# ============================================================

class EpistemicState(str, Enum):

    HISTORICALLY_CONSTRAINED = (
        "historically_constrained"
    )

    PERIOD_CORRECT = (
        "period_correct"
    )

    MODERN_REINTERPRETATION = (
        "modern_reinterpretation"
    )

    CROSS_EPOCH_NORMALIZED = (
        "cross_epoch_normalized"
    )

    EXPERIMENTAL = "experimental"


# ============================================================
# RECONSTRUCTION MODES
# ============================================================

class ReconstructionMode(str, Enum):

    STRICT_HISTORICAL = (
        "strict_historical"
    )

    NORMALIZED_EPOCH = (
        "normalized_epoch"
    )

    CROSS_EPOCH_ENTANGLEMENT = (
        "cross_epoch_entanglement"
    )

    RAW_EMERGENCE = (
        "raw_emergence"
    )

    EXPERIMENTAL = (
        "experimental"
    )


# ============================================================
# MANIFOLD CONSERVATION CONSTRAINTS
# ============================================================

class ConservationConstraint(str, Enum):

    SPATIAL = "spatial"

    TEMPORAL = "temporal"

    EPOCH = "epoch"

    AUTHORITY_STATE = (
        "authority_state"
    )

    OBSERVABILITY_FIELD = (
        "observability_field"
    )

    INFRASTRUCTURE_MATURITY = (
        "infrastructure_maturity"
    )

    SENSOR_CAPABILITY = (
        "sensor_capability"
    )

    REPORTING_SURVIVABILITY = (
        "reporting_survivability"
    )

    ARCHIVAL_PERSISTENCE = (
        "archival_persistence"
    )