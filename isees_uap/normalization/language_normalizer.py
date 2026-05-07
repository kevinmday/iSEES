# ============================================================
# language_normalizer.py — LANGUAGE NORMALIZATION ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any
import re


# ============================================================
# BASIC LANGUAGE MARKERS
# ============================================================

LANGUAGE_MARKERS = {

    "es": [
        "objeto",
        "brillante",
        "extraño",
        "movía",
        "cielo",
        "luz",
        "rápido"
    ],

    "fr": [
        "objet",
        "lumière",
        "étrange",
        "ciel",
        "rapide",
        "mouvement"
    ],

    "de": [
        "licht",
        "himmel",
        "objekt",
        "seltsam",
        "bewegung"
    ],

    "pt": [
        "objeto",
        "estranho",
        "céu",
        "luz",
        "movimento"
    ],

    "en": [
        "object",
        "light",
        "sky",
        "strange",
        "moving",
        "fast"
    ]
}


# ============================================================
# MAIN LANGUAGE NORMALIZER
# ============================================================

def normalize_language(
    observer: Dict[str, Any],
    content: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic language normalization.

    IMPORTANT:
    Raw narrative truth is NEVER overwritten.

    This layer prepares:
        semantic accessibility

    NOT:
        semantic interpretation
        token generation
        clustering
    """

    # --------------------------------------------------------
    # RAW INPUTS
    # --------------------------------------------------------
    raw_language = (
        observer.get(
            "language_raw",
            ""
        ).strip().lower()
    )

    narrative_raw = (
        content.get(
            "narrative_raw",
            ""
        ).strip()
    )

    narrative_lower = narrative_raw.lower()

    # --------------------------------------------------------
    # DEFAULT OUTPUT
    # --------------------------------------------------------
    normalized = {

        # ----------------------------------------------------
        # LANGUAGE STATE
        # ----------------------------------------------------
        "raw_language":
            raw_language,

        "detected_language":
            "unknown",

        "normalized_language":
            "en",

        # ----------------------------------------------------
        # TRANSLATION
        # ----------------------------------------------------
        "translation_required":
            False,

        "translation_confidence":
            0.0,

        # ----------------------------------------------------
        # NARRATIVE PRESERVATION
        # ----------------------------------------------------
        "narrative_raw":
            narrative_raw,

        # placeholder until real translation layer
        "narrative_translated":
            narrative_raw,

        # ----------------------------------------------------
        # AMBIGUITY
        # ----------------------------------------------------
        "ambiguity_flags": [],

        # ----------------------------------------------------
        # METADATA
        # ----------------------------------------------------
        "normalization_method":
            "basic_marker_detection",

        "normalized_utc_generated":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # EXPLICIT LANGUAGE PROVIDED
    # --------------------------------------------------------
    if raw_language:

        normalized[
            "detected_language"
        ] = raw_language

        if raw_language != "en":

            normalized[
                "translation_required"
            ] = True

            normalized[
                "translation_confidence"
            ] = 0.95

        else:

            normalized[
                "translation_confidence"
            ] = 1.0

        return normalized

    # --------------------------------------------------------
    # MARKER-BASED DETECTION
    # --------------------------------------------------------
    scores = {}

    for language, markers in LANGUAGE_MARKERS.items():

        score = 0

        for marker in markers:

            if re.search(
                rf"\b{re.escape(marker)}\b",
                narrative_lower
            ):

                score += 1

        scores[language] = score

    # --------------------------------------------------------
    # DETERMINE BEST MATCH
    # --------------------------------------------------------
    detected_language = max(
        scores,
        key=scores.get
    )

    highest_score = scores[detected_language]

    # --------------------------------------------------------
    # NO DETECTION
    # --------------------------------------------------------
    if highest_score == 0:

        normalized[
            "ambiguity_flags"
        ].append(
            "language_detection_uncertain"
        )

        return normalized

    # --------------------------------------------------------
    # DETECTED LANGUAGE
    # --------------------------------------------------------
    normalized[
        "detected_language"
    ] = detected_language

    # --------------------------------------------------------
    # TRANSLATION REQUIREMENT
    # --------------------------------------------------------
    if detected_language != "en":

        normalized[
            "translation_required"
        ] = True

    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------
    confidence = min(
        0.4 + (highest_score * 0.15),
        0.95
    )

    normalized[
        "translation_confidence"
    ] = confidence

    return normalized