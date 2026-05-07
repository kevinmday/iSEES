# ============================================================
# semantic_preprocessor.py — SEMANTIC PREPARATION ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any, List
import re


# ============================================================
# AMBIGUITY MARKERS
# ============================================================

AMBIGUITY_MARKERS = [

    "seemed",
    "appeared",
    "looked like",
    "possibly",
    "maybe",
    "might have",
    "kind of",
    "sort of",
    "roughly",
    "approximately",
    "hard to tell",
    "unclear",
    "strange",
    "weird",
    "odd",
    "unusual"
]


# ============================================================
# PHENOMENOLOGY MARKERS
# ============================================================

PHENOMENOLOGY_MARKERS = [

    "moved strangely",
    "vanished",
    "hovered silently",
    "changed direction",
    "instant acceleration",
    "no sound",
    "extremely bright",
    "zig zag",
    "triangle shaped",
    "orb",
    "metallic",
    "glowing"
]


# ============================================================
# MAIN SEMANTIC PREPROCESSOR
# ============================================================

def preprocess_semantics(
    normalized_content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Semantic preparation layer.

    IMPORTANT:
    This layer prepares semantic-safe structures
    WITHOUT collapsing meaning.

    Responsibilities:
    - whitespace normalization
    - semantic-safe lowercase generation
    - sentence segmentation
    - phrase preservation
    - ambiguity detection

    NOT responsibilities:
    - semantic interpretation
    - ontology assignment
    - clustering
    - event inference
    """

    # --------------------------------------------------------
    # INPUT
    # --------------------------------------------------------
    narrative = (
        normalized_content.get(
            "token_ready_text",
            ""
        ).strip()
    )

    # --------------------------------------------------------
    # DEFAULT OUTPUT
    # --------------------------------------------------------
    processed = {

        # ----------------------------------------------------
        # RAW PRESERVATION
        # ----------------------------------------------------
        "semantic_ready_text":
            narrative,

        # ----------------------------------------------------
        # LOWERCASE SAFE TEXT
        # ----------------------------------------------------
        "semantic_lower":
            narrative.lower(),

        # ----------------------------------------------------
        # SENTENCE SEGMENTS
        # ----------------------------------------------------
        "sentence_segments": [],

        # ----------------------------------------------------
        # PRESERVED PHRASES
        # ----------------------------------------------------
        "preserved_phrases": [],

        # ----------------------------------------------------
        # AMBIGUITY
        # ----------------------------------------------------
        "ambiguity_markers": [],

        # ----------------------------------------------------
        # PREPROCESS FLAGS
        # ----------------------------------------------------
        "preprocessing_flags": [],

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------
        "preprocessing_version":
            "1.0",

        "generated_utc":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # EMPTY INPUT
    # --------------------------------------------------------
    if not narrative:

        processed[
            "preprocessing_flags"
        ].append(
            "empty_narrative"
        )

        return processed

    # --------------------------------------------------------
    # WHITESPACE NORMALIZATION
    # --------------------------------------------------------
    cleaned = re.sub(
        r"\s+",
        " ",
        narrative
    ).strip()

    processed[
        "semantic_ready_text"
    ] = cleaned

    processed[
        "semantic_lower"
    ] = cleaned.lower()

    # --------------------------------------------------------
    # SENTENCE SEGMENTATION
    # --------------------------------------------------------
    segments = re.split(

        r"(?<=[.!?])\s+",

        cleaned
    )

    segments = [

        s.strip()

        for s in segments

        if s.strip()
    ]

    processed[
        "sentence_segments"
    ] = segments

    # --------------------------------------------------------
    # AMBIGUITY DETECTION
    # --------------------------------------------------------
    lower = cleaned.lower()

    for marker in AMBIGUITY_MARKERS:

        if marker in lower:

            processed[
                "ambiguity_markers"
            ].append(marker)

    # --------------------------------------------------------
    # PHENOMENOLOGY PRESERVATION
    # --------------------------------------------------------
    for phrase in PHENOMENOLOGY_MARKERS:

        if phrase in lower:

            processed[
                "preserved_phrases"
            ].append(phrase)

    # --------------------------------------------------------
    # LONG NARRATIVE DETECTION
    # --------------------------------------------------------
    word_count = len(cleaned.split())

    if word_count > 250:

        processed[
            "preprocessing_flags"
        ].append(
            "long_narrative"
        )

    # --------------------------------------------------------
    # HIGH AMBIGUITY DETECTION
    # --------------------------------------------------------
    if len(
        processed["ambiguity_markers"]
    ) >= 3:

        processed[
            "preprocessing_flags"
        ].append(
            "high_ambiguity"
        )

    # --------------------------------------------------------
    # MULTI-SENTENCE DETECTION
    # --------------------------------------------------------
    if len(segments) > 3:

        processed[
            "preprocessing_flags"
        ].append(
            "complex_narrative"
        )

    return processed