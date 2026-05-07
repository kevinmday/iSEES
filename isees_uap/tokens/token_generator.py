# ============================================================
# token_generator.py — MANIFOLD TOKEN GENERATION ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any, List
import re


# ============================================================
# TOKEN CATEGORIES
# ============================================================

MOVEMENT_TERMS = [

    "hover",
    "hovered",
    "zig zag",
    "accelerated",
    "vanished",
    "stopped",
    "darted",
    "moved strangely",
    "shot upward",
    "instant acceleration",
    "changed direction"
]

OBJECT_TERMS = [

    "orb",
    "triangle",
    "disk",
    "sphere",
    "light",
    "object",
    "craft",
    "metallic",
    "glowing",
    "circular"
]

ENVIRONMENT_TERMS = [

    "night",
    "mountains",
    "ocean",
    "fog",
    "clouds",
    "clear skies",
    "rain",
    "desert",
    "forest"
]

AMBIGUITY_TERMS = [

    "seemed",
    "appeared",
    "possibly",
    "maybe",
    "might",
    "unclear",
    "strange",
    "weird",
    "odd"
]

SENSOR_TERMS = [

    "radar",
    "infrared",
    "visual",
    "night vision",
    "thermal",
    "camera",
    "flir",
    "sensor"
]


# ============================================================
# MAIN TOKEN GENERATOR
# ============================================================

def generate_tokens(
    semantic_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic manifold token generation.

    IMPORTANT:
    Tokens are NOT event conclusions.

    They are:
        semantic coordinate anchors

    Responsibilities:
    - semantic token generation
    - phenomenology token generation
    - ambiguity token generation
    - environmental token generation

    NOT responsibilities:
    - clustering
    - event inference
    - confidence scoring
    """

    # --------------------------------------------------------
    # INPUT
    # --------------------------------------------------------
    text = (
        semantic_data.get(
            "semantic_lower",
            ""
        ).strip()
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------
    output = {

        # ----------------------------------------------------
        # CORE TOKENS
        # ----------------------------------------------------
        "semantic_tokens": [],

        "movement_tokens": [],

        "object_tokens": [],

        "environment_tokens": [],

        "ambiguity_tokens": [],

        "sensor_tokens": [],

        # ----------------------------------------------------
        # TOKEN METADATA
        # ----------------------------------------------------
        "token_count": 0,

        "unique_token_count": 0,

        "tokenization_flags": [],

        # ----------------------------------------------------
        # GENERATED
        # ----------------------------------------------------
        "tokenization_version":
            "1.0",

        "generated_utc":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # EMPTY INPUT
    # --------------------------------------------------------
    if not text:

        output[
            "tokenization_flags"
        ].append(
            "empty_text"
        )

        return output

    # --------------------------------------------------------
    # MOVEMENT TOKENS
    # --------------------------------------------------------
    for term in MOVEMENT_TERMS:

        if term in text:

            output[
                "movement_tokens"
            ].append(term)

    # --------------------------------------------------------
    # OBJECT TOKENS
    # --------------------------------------------------------
    for term in OBJECT_TERMS:

        if term in text:

            output[
                "object_tokens"
            ].append(term)

    # --------------------------------------------------------
    # ENVIRONMENT TOKENS
    # --------------------------------------------------------
    for term in ENVIRONMENT_TERMS:

        if term in text:

            output[
                "environment_tokens"
            ].append(term)

    # --------------------------------------------------------
    # AMBIGUITY TOKENS
    # --------------------------------------------------------
    for term in AMBIGUITY_TERMS:

        if term in text:

            output[
                "ambiguity_tokens"
            ].append(term)

    # --------------------------------------------------------
    # SENSOR TOKENS
    # --------------------------------------------------------
    for term in SENSOR_TERMS:

        if term in text:

            output[
                "sensor_tokens"
            ].append(term)

    # --------------------------------------------------------
    # GENERAL SEMANTIC TOKENS
    # --------------------------------------------------------
    raw_tokens = re.findall(
        r"\b[a-zA-Z]{3,}\b",
        text
    )

    stopwords = {

        "the",
        "and",
        "was",
        "were",
        "with",
        "that",
        "from",
        "this",
        "there",
        "have",
        "about",
        "into",
        "they",
        "them",
        "then",
        "when",
        "while",
        "could",
        "would",
        "should"
    }

    semantic_tokens = []

    for token in raw_tokens:

        if token not in stopwords:

            semantic_tokens.append(token)

    # --------------------------------------------------------
    # DEDUPLICATION
    # --------------------------------------------------------
    semantic_tokens = sorted(
        list(set(semantic_tokens))
    )

    output[
        "semantic_tokens"
    ] = semantic_tokens

    # --------------------------------------------------------
    # COUNTS
    # --------------------------------------------------------
    all_tokens = (

        semantic_tokens

        +

        output["movement_tokens"]

        +

        output["object_tokens"]

        +

        output["environment_tokens"]

        +

        output["ambiguity_tokens"]

        +

        output["sensor_tokens"]
    )

    output["token_count"] = len(all_tokens)

    output["unique_token_count"] = len(
        set(all_tokens)
    )

    # --------------------------------------------------------
    # FLAGS
    # --------------------------------------------------------
    if output["ambiguity_tokens"]:

        output[
            "tokenization_flags"
        ].append(
            "ambiguity_present"
        )

    if output["sensor_tokens"]:

        output[
            "tokenization_flags"
        ].append(
            "sensor_reference_present"
        )

    if len(
        output["movement_tokens"]
    ) >= 2:

        output[
            "tokenization_flags"
        ].append(
            "complex_movement_profile"
        )

    if output["token_count"] > 75:

        output[
            "tokenization_flags"
        ].append(
            "high_token_density"
        )

    return output