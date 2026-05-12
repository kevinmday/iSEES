# ============================================================
# observability_fusion.py
# iSEES — OBSERVABILITY SUBSYSTEM
# OBSERVABILITY FIELD FUSION ENGINE
# ============================================================

from typing import Dict, List, Optional

from isees_uap.observability.observability_models import (
    ObservabilityField,
    ObservabilityComponent,
)

from isees_uap.observability.observability_types import (
    ObservabilityComponentType,
)


# ============================================================
# DEFAULT WEIGHTS
# ============================================================

DEFAULT_WEIGHTS = {

    ObservabilityComponentType.POPULATION_DENSITY.value:
        0.18,

    ObservabilityComponentType.INFRASTRUCTURE_DENSITY.value:
        0.14,

    ObservabilityComponentType.AVIATION_DENSITY.value:
        0.10,

    ObservabilityComponentType.SENSOR_DENSITY.value:
        0.18,

    ObservabilityComponentType.COMMUNICATIONS_COVERAGE.value:
        0.12,

    ObservabilityComponentType.VISIBILITY_QUALITY.value:
        0.12,

    ObservabilityComponentType.TERRAIN_ACCESSIBILITY.value:
        0.08,

    ObservabilityComponentType.HISTORICAL_REPORTING_PROBABILITY.value:
        0.08,
}


# ============================================================
# HELPERS
# ============================================================

def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:

    return max(
        minimum,
        min(maximum, value)
    )


# ============================================================
# COMPONENT EXTRACTION
# ============================================================

def extract_component_score(
    component: ObservabilityComponent
) -> float:

    return clamp(
        component.score,
        0.0,
        1.0
    )


def extract_component_confidence(
    component: ObservabilityComponent
) -> float:

    return clamp(
        component.confidence,
        0.0,
        1.0
    )


# ============================================================
# COMPONENT MAP
# ============================================================

def build_component_map(
    field: ObservabilityField
) -> Dict[str, ObservabilityComponent]:

    return {

        ObservabilityComponentType.POPULATION_DENSITY.value:
            field.population_density,

        ObservabilityComponentType.INFRASTRUCTURE_DENSITY.value:
            field.infrastructure_density,

        ObservabilityComponentType.AVIATION_DENSITY.value:
            field.aviation_density,

        ObservabilityComponentType.SENSOR_DENSITY.value:
            field.sensor_density,

        ObservabilityComponentType.COMMUNICATIONS_COVERAGE.value:
            field.communications_coverage,

        ObservabilityComponentType.VISIBILITY_QUALITY.value:
            field.visibility_quality,

        ObservabilityComponentType.TERRAIN_ACCESSIBILITY.value:
            field.terrain_accessibility,

        ObservabilityComponentType.HISTORICAL_REPORTING_PROBABILITY.value:
            field.historical_reporting_probability,
    }


# ============================================================
# WEIGHTED FUSION
# ============================================================

def compute_weighted_observability(
    field: ObservabilityField,
    weights: Optional[Dict[str, float]] = None,
) -> Dict:

    if not weights:
        weights = DEFAULT_WEIGHTS

    components = build_component_map(
        field
    )

    weighted_total = 0.0

    total_weight = 0.0

    confidence_total = 0.0

    provider_count = 0

    breakdown = {}

    for component_name, component in components.items():

        score = extract_component_score(
            component
        )

        confidence = (
            extract_component_confidence(
                component
            )
        )

        weight = weights.get(
            component_name,
            0.0
        )

        weighted_score = (
            score * weight
        )

        weighted_total += (
            weighted_score
        )

        total_weight += weight

        confidence_total += (
            confidence
        )

        if component.provider:
            provider_count += 1

        breakdown[component_name] = {

            "score":
                round(score, 3),

            "confidence":
                round(confidence, 3),

            "weight":
                round(weight, 3),

            "weighted_score":
                round(
                    weighted_score,
                    3
                ),
        }

    # --------------------------------------------------------
    # FINAL SCORE
    # --------------------------------------------------------

    if total_weight > 0:

        observability_score = (
            weighted_total
            / total_weight
        )

    else:

        observability_score = 0.0

    observability_score = clamp(
        observability_score,
        0.0,
        1.0
    )

    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------

    component_count = max(
        len(components),
        1
    )

    confidence = (
        confidence_total
        / component_count
    )

    confidence = clamp(
        confidence,
        0.0,
        1.0
    )

    return {

        "observability_score":
            round(
                observability_score,
                3
            ),

        "confidence":
            round(
                confidence,
                3
            ),

        "provider_count":
            provider_count,

        "component_breakdown":
            breakdown,
    }


# ============================================================
# OBSERVER PROBABILITY
# ============================================================

def compute_observer_probability(
    field: ObservabilityField
) -> float:

    population = (
        field.population_density.score
    )

    infrastructure = (
        field.infrastructure_density.score
    )

    communications = (
        field.communications_coverage.score
    )

    terrain = (
        field.terrain_accessibility.score
    )

    probability = (

        (population * 0.35)
        +
        (infrastructure * 0.25)
        +
        (communications * 0.25)
        +
        (terrain * 0.15)
    )

    probability = clamp(
        probability,
        0.0,
        1.0
    )

    return round(probability, 3)


# ============================================================
# SENSOR VISIBILITY
# ============================================================

def compute_sensor_visibility(
    field: ObservabilityField
) -> float:

    sensor_density = (
        field.sensor_density.score
    )

    aviation = (
        field.aviation_density.score
    )

    visibility = (
        field.visibility_quality.score
    )

    score = (

        (sensor_density * 0.50)
        +
        (aviation * 0.20)
        +
        (visibility * 0.30)
    )

    score = clamp(
        score,
        0.0,
        1.0
    )

    return round(score, 3)


# ============================================================
# ENVIRONMENTAL VISIBILITY
# ============================================================

def compute_environmental_visibility(
    field: ObservabilityField
) -> float:

    visibility = (
        field.visibility_quality.score
    )

    terrain = (
        field.terrain_accessibility.score
    )

    score = (

        (visibility * 0.70)
        +
        (terrain * 0.30)
    )

    score = clamp(
        score,
        0.0,
        1.0
    )

    return round(score, 3)


# ============================================================
# MAIN FUSION ROUTER
# ============================================================

def fuse_observability_field(
    field: ObservabilityField
) -> ObservabilityField:

    fusion = compute_weighted_observability(
        field
    )

    field.observability_score = (
        fusion[
            "observability_score"
        ]
    )

    field.confidence = (
        fusion[
            "confidence"
        ]
    )

    field.provider_count = (
        fusion[
            "provider_count"
        ]
    )

    field.observer_probability = (
        compute_observer_probability(
            field
        )
    )

    field.sensor_visibility_score = (
        compute_sensor_visibility(
            field
        )
    )

    field.environmental_visibility_score = (

        compute_environmental_visibility(
            field
        )
    )

    # --------------------------------------------------------
    # METADATA
    # --------------------------------------------------------

    field.metadata[
        "fusion"
    ] = {

        "component_breakdown":
            fusion[
                "component_breakdown"
            ],

        "fusion_version":
            "OBS_FUSION_V1",

        "late_fusion":
            True,
    }

    return field


# ============================================================
# TEST HARNESS
# ============================================================

if __name__ == "__main__":

    field = ObservabilityField()

    field.population_density.score = 0.82
    field.infrastructure_density.score = 0.74
    field.sensor_density.score = 0.91
    field.visibility_quality.score = 0.63
    field.communications_coverage.score = 0.88
    field.terrain_accessibility.score = 0.71
    field.aviation_density.score = 0.55
    field.historical_reporting_probability.score = 0.66

    field.population_density.provider = (
        "population_provider"
    )

    field.sensor_density.provider = (
        "sensor_provider"
    )

    field = fuse_observability_field(
        field
    )

    print()
    print("================================================")
    print("OBSERVABILITY FUSION")
    print("================================================")
    print()

    print(field.summary())

    print()

