# ============================================================
# normalize_observation.py — NORMALIZATION PIPELINE (LAYER 1)
# ============================================================

from copy import deepcopy
from datetime import datetime, UTC
from typing import Dict, Any

from isees_uap.normalization.time_normalizer import (
    normalize_time
)

from isees_uap.normalization.geo_normalizer import (
    normalize_geo
)

from isees_uap.normalization.language_normalizer import (
    normalize_language
)

from isees_uap.normalization.semantic_preprocessor import (
    preprocess_semantics
)

from isees_uap.tokens.token_generator import (
    generate_tokens
)

from isees_uap.search.vector_generator import (
    generate_vectors
)


# ============================================================
# MAIN NORMALIZATION ENTRY
# ============================================================

def normalize_observation(
    canonical_observation: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Layer 1 Normalization Pipeline

    IMPORTANT:
    This layer NEVER mutates the canonical observation.

    It derives:
        normalized_observation

    FROM:
        canonical_observation

    Responsibilities:
    - UTC normalization
    - geo normalization
    - language normalization
    - semantic preparation
    - token generation
    - vector generation
    - downstream clustering preparation

    NOT responsibilities:
    - clustering
    - event inference
    - scoring
    - escalation
    """

    # --------------------------------------------------------
    # IMMUTABLE COPY SAFETY
    # --------------------------------------------------------

    source = deepcopy(canonical_observation)

    observation = source.get(
        "observation",
        {}
    )

    # --------------------------------------------------------
    # CORE IDS
    # --------------------------------------------------------

    observation_id = observation.get(
        "observation_id",
        ""
    )

    # --------------------------------------------------------
    # RAW SOURCE FIELDS
    # --------------------------------------------------------

    observation_time = observation.get(
        "observation_time",
        {}
    )

    raw_geo = observation.get(
        "raw_geo",
        {}
    )

    observer = observation.get(
        "observer",
        {}
    )

    provenance = observation.get(
        "provenance",
        {}
    )

    content = observation.get(
        "content",
        {}
    )

    object_description = observation.get(
        "object_description",
        {}
    )

    environment = observation.get(
        "environment",
        {}
    )

    # --------------------------------------------------------
    # TEMPORAL NORMALIZATION
    # --------------------------------------------------------

    normalized_time = normalize_time(
        observation_time
    )

    # --------------------------------------------------------
    # GEO NORMALIZATION
    # --------------------------------------------------------

    normalized_geo = normalize_geo(
        raw_geo
    )

    # --------------------------------------------------------
    # LANGUAGE NORMALIZATION
    # --------------------------------------------------------

    normalized_language = normalize_language(
        observer,
        content
    )

    # --------------------------------------------------------
    # NARRATIVE NORMALIZATION
    # --------------------------------------------------------

    normalized_content = {

        "narrative_raw":
            content.get(
                "narrative_raw",
                ""
            ),

        "narrative_normalized":

            normalized_language.get(
                "narrative_translated",
                content.get(
                    "narrative_raw",
                    ""
                )
            ),

        "token_ready_text":

            normalized_language.get(
                "narrative_translated",
                content.get(
                    "narrative_raw",
                    ""
                )
            )
    }

    # --------------------------------------------------------
    # SEMANTIC PREPROCESSING
    # --------------------------------------------------------

    semantic_data = preprocess_semantics(
        normalized_content
    )

    # --------------------------------------------------------
    # TOKEN GENERATION
    # --------------------------------------------------------

    token_data = generate_tokens(
        semantic_data
    )

    # --------------------------------------------------------
    # VECTOR GENERATION
    # --------------------------------------------------------

    vector_data = generate_vectors(
        token_data
    )

    # --------------------------------------------------------
    # BUILD NORMALIZED OBJECT
    # --------------------------------------------------------

    normalized = {

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------

        "schema_version": "1.0",

        "normalization_version": "1.0",

        "generated_utc":
            datetime.now(UTC).isoformat(),

        # ----------------------------------------------------
        # ROOT OBJECT
        # ----------------------------------------------------

        "normalized_observation": {

            # ------------------------------------------------
            # LINEAGE
            # ------------------------------------------------

            "observation_id":
                observation_id,

            "source_schema_version":
                source.get(
                    "schema_version",
                    "unknown"
                ),

            # ------------------------------------------------
            # PROVENANCE
            # ------------------------------------------------

            "provenance":
                provenance,

            # ------------------------------------------------
            # TEMPORAL NORMALIZATION
            # ------------------------------------------------

            "normalized_time":
                normalized_time,

            # ------------------------------------------------
            # GEO NORMALIZATION
            # ------------------------------------------------

            "normalized_geo":
                normalized_geo,

            # ------------------------------------------------
            # LANGUAGE NORMALIZATION
            # ------------------------------------------------

            "language":
                normalized_language,

            # ------------------------------------------------
            # NORMALIZED CONTENT
            # ------------------------------------------------

            "normalized_content":
                normalized_content,

            # ------------------------------------------------
            # SEMANTIC PREPROCESSING
            # ------------------------------------------------

            "semantic_preprocessing":
                semantic_data,

            # ------------------------------------------------
            # TOKEN DATA
            # ------------------------------------------------

            "token_data":
                token_data,

            # ------------------------------------------------
            # VECTOR DATA
            # ------------------------------------------------

            "vector_data":
                vector_data,

            # ------------------------------------------------
            # OBJECT FEATURE PREP
            # ------------------------------------------------

            "normalized_features": {

                "shape":
                    object_description.get(
                        "shape_raw",
                        ""
                    ),

                "movement":
                    object_description.get(
                        "movement_raw",
                        ""
                    ),

                "lights":
                    object_description.get(
                        "lights_raw",
                        ""
                    ),

                "sound":
                    object_description.get(
                        "sound_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # ENVIRONMENT PREP
            # ------------------------------------------------

            "normalized_environment": {

                "weather":
                    environment.get(
                        "weather_raw",
                        ""
                    ),

                "visibility":
                    environment.get(
                        "visibility_raw",
                        ""
                    ),

                "terrain":
                    environment.get(
                        "terrain_raw",
                        ""
                    ),

                "light_conditions":
                    environment.get(
                        "light_conditions_raw",
                        ""
                    )
            },

            # ------------------------------------------------
            # PIPELINE FLAGS
            # ------------------------------------------------

            "pipeline_state": {

                "geo_resolved":

                    normalized_geo.get(
                        "resolved_lat"
                    ) is not None

                    and

                    normalized_geo.get(
                        "resolved_lon"
                    ) is not None,

                "time_normalized":

                    normalized_time.get(
                        "utc_time"
                    ) is not None,

                "translation_completed":

                    normalized_language.get(
                        "translation_required"
                    ) is False

                    or

                    normalized_language.get(
                        "translation_confidence",
                        0.0
                    ) > 0.5,

                "semantic_tokens_generated":

                    token_data.get(
                        "token_count",
                        0
                    ) > 0,

                "cluster_ready":

                    normalized_time.get(
                        "utc_time"
                    ) is not None

                    and

                    normalized_geo.get(
                        "geo_confidence",
                        0.0
                    ) > 0.0

                    and

                    vector_data.get(
                        "vector_dimensions",
                        0
                    ) > 0
            }
        }
    }

    return normalized