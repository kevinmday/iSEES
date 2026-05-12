# ============================================================
# observability_engine.py
# iSEES — OBSERVABILITY SUBSYSTEM
# DETERMINISTIC OBSERVABILITY ENGINE
# ============================================================

from typing import Dict, Optional, List
from datetime import datetime, UTC

from isees_uap.observability.observability_models import (
    ObservabilityField,
    ObservabilityContext,
)

from isees_uap.observability.fusion.observability_fusion import (
    fuse_observability_field,
)

from isees_uap.observability.fusion.temporal_weighting import (
    apply_temporal_weighting,
)

from isees_uap.observability.fusion.field_stitching import (
    stitch_fields,
)

from isees_uap.observability.normalization import (
    normalize_emergence,
)

from isees_uap.observability.observability_types import (
    ObservabilityNormalizationType,
)


# ============================================================
# ENGINE VERSION
# ============================================================

ENGINE_VERSION = "OBS_ENGINE_V1"


# ============================================================
# MOCK PROVIDER RESOLUTION
# ============================================================

def resolve_population_density(
    context: ObservabilityContext
) -> float:

    lat = abs(context.latitude)

    if lat > 40:

        return 0.62

    return 0.45


def resolve_infrastructure_density(
    context: ObservabilityContext
) -> float:

    return 0.58


def resolve_sensor_density(
    context: ObservabilityContext
) -> float:

    return 0.71


def resolve_aviation_density(
    context: ObservabilityContext
) -> float:

    return 0.64


def resolve_visibility_quality(
    context: ObservabilityContext
) -> float:

    return 0.77


def resolve_communications_coverage(
    context: ObservabilityContext
) -> float:

    return 0.83


def resolve_terrain_accessibility(
    context: ObservabilityContext
) -> float:

    return 0.69


def resolve_historical_reporting_probability(
    context: ObservabilityContext
) -> float:

    return 0.55


# ============================================================
# FIELD CONSTRUCTION
# ============================================================

def build_observability_field(
    context: ObservabilityContext
) -> ObservabilityField:

    field = ObservabilityField()

    # --------------------------------------------------------
    # SPACETIME
    # --------------------------------------------------------

    field.latitude = (
        context.latitude
    )

    field.longitude = (
        context.longitude
    )

    field.altitude_m = (
        context.altitude_m
    )

    field.timestamp_utc = (
        context.timestamp_utc
        or
        datetime.now(
            UTC
        ).isoformat()
    )

    # --------------------------------------------------------
    # POPULATION
    # --------------------------------------------------------

    field.population_density.score = (

        resolve_population_density(
            context
        )
    )

    field.population_density.provider = (
        "population_provider"
    )

    # --------------------------------------------------------
    # INFRASTRUCTURE
    # --------------------------------------------------------

    field.infrastructure_density.score = (

        resolve_infrastructure_density(
            context
        )
    )

    field.infrastructure_density.provider = (
        "infrastructure_provider"
    )

    # --------------------------------------------------------
    # AVIATION
    # --------------------------------------------------------

    field.aviation_density.score = (

        resolve_aviation_density(
            context
        )
    )

    field.aviation_density.provider = (
        "aviation_provider"
    )

    # --------------------------------------------------------
    # SENSOR
    # --------------------------------------------------------

    field.sensor_density.score = (

        resolve_sensor_density(
            context
        )
    )

    field.sensor_density.provider = (
        "sensor_provider"
    )

    # --------------------------------------------------------
    # COMMUNICATIONS
    # --------------------------------------------------------

    field.communications_coverage.score = (

        resolve_communications_coverage(
            context
        )
    )

    field.communications_coverage.provider = (
        "communications_provider"
    )

    # --------------------------------------------------------
    # VISIBILITY
    # --------------------------------------------------------

    field.visibility_quality.score = (

        resolve_visibility_quality(
            context
        )
    )

    field.visibility_quality.provider = (
        "weather_provider"
    )

    # --------------------------------------------------------
    # TERRAIN
    # --------------------------------------------------------

    field.terrain_accessibility.score = (

        resolve_terrain_accessibility(
            context
        )
    )

    field.terrain_accessibility.provider = (
        "terrain_provider"
    )

    # --------------------------------------------------------
    # HISTORICAL
    # --------------------------------------------------------

    field.historical_reporting_probability.score = (

        resolve_historical_reporting_probability(
            context
        )
    )

    field.historical_reporting_probability.provider = (
        "historical_provider"
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    field.metadata[
        "engine"
    ] = ENGINE_VERSION

    field.metadata[
        "mock_provider_mode"
    ] = True

    return field


# ============================================================
# FULL FIELD RESOLUTION
# ============================================================

def resolve_observability(
    context: ObservabilityContext
) -> ObservabilityField:

    # --------------------------------------------------------
    # BUILD
    # --------------------------------------------------------

    field = build_observability_field(
        context
    )

    # --------------------------------------------------------
    # FUSION
    # --------------------------------------------------------

    field = fuse_observability_field(
        field
    )

    # --------------------------------------------------------
    # TEMPORAL
    # --------------------------------------------------------

    field = apply_temporal_weighting(
        field
    )

    # --------------------------------------------------------
    # COMPLETE
    # --------------------------------------------------------

    field.metadata[
        "resolved"
    ] = True

    return field


# ============================================================
# FIELD STITCHING ROUTER
# ============================================================

def resolve_stitched_observability(
    contexts: List[ObservabilityContext]
) -> Optional[ObservabilityField]:

    if not contexts:

        return None

    fields = []

    for context in contexts:

        field = resolve_observability(
            context
        )

        fields.append(
            field
        )

    stitched = stitch_fields(
        fields
    )

    return stitched


# ============================================================
# NORMALIZED EMERGENCE
# ============================================================

def compute_normalized_emergence(
    report_density: float,
    context: ObservabilityContext,
    normalization_type: ObservabilityNormalizationType = (
        ObservabilityNormalizationType.LOG_SCALED
    ),
) -> Dict:

    field = resolve_observability(
        context
    )

    normalized = normalize_emergence(

        report_density=
            report_density,

        field=
            field,

        normalization_type=
            normalization_type
    )

    return {

        "field":
            field.summary(),

        "normalization":
            normalized,
    }


# ============================================================
# OBSERVABILITY SNAPSHOT
# ============================================================

def build_observability_snapshot(
    context: ObservabilityContext
) -> Dict:

    field = resolve_observability(
        context
    )

    return {

        "field_id":
            field.field_id,

        "latitude":
            field.latitude,

        "longitude":
            field.longitude,

        "timestamp_utc":
            field.timestamp_utc,

        "observability_score":
            field.observability_score,

        "observer_probability":
            field.observer_probability,

        "sensor_visibility_score":
            field.sensor_visibility_score,

        "environmental_visibility_score":
            field.environmental_visibility_score,

        "confidence":
            field.confidence,
    }


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    context = ObservabilityContext(

        latitude=42.3265,

        longitude=-122.8756,

        timestamp_utc=
            datetime.now(
                UTC
            ).isoformat()
    )

    field = resolve_observability(
        context
    )

    print()
    print("================================================")
    print("OBSERVABILITY ENGINE")
    print("================================================")
    print()

    print(field.summary())

    print()

    normalized = compute_normalized_emergence(

        report_density=4.0,

        context=context
    )

    print(normalized)

    print()