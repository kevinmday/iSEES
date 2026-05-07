# ============================================================
# vector_generator.py — DETERMINISTIC VECTOR ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any
from collections import Counter


# ============================================================
# TOKEN WEIGHTS
# ============================================================

MOVEMENT_WEIGHT = 2.0
OBJECT_WEIGHT = 1.5
ENVIRONMENT_WEIGHT = 1.0
AMBIGUITY_WEIGHT = 0.5
SENSOR_WEIGHT = 2.5


# ============================================================
# MAIN VECTOR GENERATOR
# ============================================================

def generate_vectors(
    token_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic manifold vector generation.

    IMPORTANT:
    These are NOT AI embeddings.

    These are:
        explainable semantic manifold vectors

    Responsibilities:
    - semantic weighting
    - token frequency analysis
    - movement weighting
    - ambiguity weighting
    - sensor weighting

    NOT responsibilities:
    - clustering
    - event inference
    - scoring
    """

    # --------------------------------------------------------
    # INPUT TOKENS
    # --------------------------------------------------------
    semantic_tokens = token_data.get(
        "semantic_tokens",
        []
    )

    movement_tokens = token_data.get(
        "movement_tokens",
        []
    )

    object_tokens = token_data.get(
        "object_tokens",
        []
    )

    environment_tokens = token_data.get(
        "environment_tokens",
        []
    )

    ambiguity_tokens = token_data.get(
        "ambiguity_tokens",
        []
    )

    sensor_tokens = token_data.get(
        "sensor_tokens",
        []
    )

    # --------------------------------------------------------
    # OUTPUT STRUCTURE
    # --------------------------------------------------------
    output = {

        # ----------------------------------------------------
        # VECTOR MAPS
        # ----------------------------------------------------
        "semantic_vector": {},

        "movement_vector": {},

        "object_vector": {},

        "environment_vector": {},

        "ambiguity_vector": {},

        "sensor_vector": {},

        # ----------------------------------------------------
        # VECTOR METRICS
        # ----------------------------------------------------
        "vector_dimensions": 0,

        "total_weight": 0.0,

        "ambiguity_weight": 0.0,

        "sensor_weight": 0.0,

        # ----------------------------------------------------
        # DENSITY
        # ----------------------------------------------------
        "semantic_density": 0.0,

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------
        "vectorization_version":
            "1.0",

        "generated_utc":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # SEMANTIC VECTOR
    # --------------------------------------------------------
    semantic_counts = Counter(
        semantic_tokens
    )

    for token, count in semantic_counts.items():

        output[
            "semantic_vector"
        ][token] = float(count)

    # --------------------------------------------------------
    # MOVEMENT VECTOR
    # --------------------------------------------------------
    movement_counts = Counter(
        movement_tokens
    )

    for token, count in movement_counts.items():

        output[
            "movement_vector"
        ][token] = (

            float(count)

            *

            MOVEMENT_WEIGHT
        )

    # --------------------------------------------------------
    # OBJECT VECTOR
    # --------------------------------------------------------
    object_counts = Counter(
        object_tokens
    )

    for token, count in object_counts.items():

        output[
            "object_vector"
        ][token] = (

            float(count)

            *

            OBJECT_WEIGHT
        )

    # --------------------------------------------------------
    # ENVIRONMENT VECTOR
    # --------------------------------------------------------
    environment_counts = Counter(
        environment_tokens
    )

    for token, count in environment_counts.items():

        output[
            "environment_vector"
        ][token] = (

            float(count)

            *

            ENVIRONMENT_WEIGHT
        )

    # --------------------------------------------------------
    # AMBIGUITY VECTOR
    # --------------------------------------------------------
    ambiguity_counts = Counter(
        ambiguity_tokens
    )

    ambiguity_total = 0.0

    for token, count in ambiguity_counts.items():

        weight = (

            float(count)

            *

            AMBIGUITY_WEIGHT
        )

        output[
            "ambiguity_vector"
        ][token] = weight

        ambiguity_total += weight

    output[
        "ambiguity_weight"
    ] = ambiguity_total

    # --------------------------------------------------------
    # SENSOR VECTOR
    # --------------------------------------------------------
    sensor_counts = Counter(
        sensor_tokens
    )

    sensor_total = 0.0

    for token, count in sensor_counts.items():

        weight = (

            float(count)

            *

            SENSOR_WEIGHT
        )

        output[
            "sensor_vector"
        ][token] = weight

        sensor_total += weight

    output[
        "sensor_weight"
    ] = sensor_total

    # --------------------------------------------------------
    # VECTOR DIMENSIONS
    # --------------------------------------------------------
    dimensions = (

        len(output["semantic_vector"])

        +

        len(output["movement_vector"])

        +

        len(output["object_vector"])

        +

        len(output["environment_vector"])

        +

        len(output["ambiguity_vector"])

        +

        len(output["sensor_vector"])
    )

    output[
        "vector_dimensions"
    ] = dimensions

    # --------------------------------------------------------
    # TOTAL WEIGHT
    # --------------------------------------------------------
    total_weight = 0.0

    vector_groups = [

        output["semantic_vector"],
        output["movement_vector"],
        output["object_vector"],
        output["environment_vector"],
        output["ambiguity_vector"],
        output["sensor_vector"]
    ]

    for group in vector_groups:

        total_weight += sum(
            group.values()
        )

    output[
        "total_weight"
    ] = total_weight

    # --------------------------------------------------------
    # SEMANTIC DENSITY
    # --------------------------------------------------------
    if dimensions > 0:

        output[
            "semantic_density"
        ] = (

            total_weight

            /

            dimensions
        )

    return output