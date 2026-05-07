# ============================================================
# time_normalizer.py — TEMPORAL NORMALIZATION ENGINE
# ============================================================

from datetime import datetime, UTC
from typing import Dict, Any
import re


# ============================================================
# MAIN NORMALIZER
# ============================================================

def normalize_time(
    observation_time: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic temporal normalization.

    IMPORTANT:
    This system preserves ambiguity.

    It does NOT force certainty.

    Example:
        "around 9pm"

    should become:

        21:00 ± elasticity window

    NOT:

        21:00 exact
    """

    # --------------------------------------------------------
    # RAW INPUTS
    # --------------------------------------------------------
    raw_time = (
        observation_time.get("time_raw", "")
        .strip()
    )

    raw_timezone = (
        observation_time.get("timezone_raw", "")
        .strip()
    )

    duration_raw = (
        observation_time.get("duration_raw", "")
        .strip()
    )

    # --------------------------------------------------------
    # DEFAULT OUTPUT
    # --------------------------------------------------------
    normalized = {

        # normalized UTC estimate
        "utc_time": None,

        # confidence 0.0 → 1.0
        "time_confidence": 0.0,

        # uncertainty preservation
        "elasticity_window_minutes": 120,

        # ambiguity markers
        "ambiguity_flags": [],

        # raw preservation
        "raw_time": raw_time,
        "raw_timezone": raw_timezone,
        "duration_raw": duration_raw,

        # parser metadata
        "normalization_method": "unparsed",

        "normalized_utc_generated":
            datetime.now(UTC).isoformat()
    }

    # --------------------------------------------------------
    # EMPTY INPUT
    # --------------------------------------------------------
    if not raw_time:

        normalized["ambiguity_flags"].append(
            "missing_time"
        )

        return normalized

    # --------------------------------------------------------
    # AROUND / APPROXIMATE DETECTION
    # --------------------------------------------------------
    approximate_markers = [
        "around",
        "about",
        "approximately",
        "approx",
        "~",
        "ish"
    ]

    if any(
        marker in raw_time.lower()
        for marker in approximate_markers
    ):

        normalized["ambiguity_flags"].append(
            "approximate_time"
        )

        normalized[
            "elasticity_window_minutes"
        ] = 60

    # --------------------------------------------------------
    # RANGE DETECTION
    # --------------------------------------------------------
    if (
        "between" in raw_time.lower()
        or "-" in raw_time
        or "to" in raw_time.lower()
    ):

        normalized["ambiguity_flags"].append(
            "time_range"
        )

        normalized[
            "elasticity_window_minutes"
        ] = 180

    # --------------------------------------------------------
    # RELATIVE TIME DETECTION
    # --------------------------------------------------------
    relative_markers = [
        "last night",
        "yesterday",
        "earlier",
        "later",
        "after",
        "before",
        "few hours"
    ]

    if any(
        marker in raw_time.lower()
        for marker in relative_markers
    ):

        normalized["ambiguity_flags"].append(
            "relative_time_reference"
        )

        normalized[
            "elasticity_window_minutes"
        ] = 360

    # --------------------------------------------------------
    # SIMPLE HH:MM PARSER
    # --------------------------------------------------------
    match = re.search(

        r"(\d{1,2})"
        r"(:(\d{2}))?"
        r"\s*(am|pm)?",

        raw_time.lower()
    )

    if match:

        try:

            hour = int(match.group(1))

            minute = (
                int(match.group(3))
                if match.group(3)
                else 0
            )

            meridian = match.group(4)

            # ------------------------------------------------
            # 12H → 24H CONVERSION
            # ------------------------------------------------
            if meridian == "pm" and hour < 12:
                hour += 12

            if meridian == "am" and hour == 12:
                hour = 0

            # ------------------------------------------------
            # BUILD UTC PLACEHOLDER
            # ------------------------------------------------
            # NOTE:
            # True timezone conversion comes later.
            # This is intentionally conservative.
            # ------------------------------------------------
            now = datetime.now(UTC)

            parsed = datetime(

                year=now.year,
                month=now.month,
                day=now.day,

                hour=hour,
                minute=minute,

                tzinfo=UTC
            )

            normalized["utc_time"] = (
                parsed.isoformat()
            )

            normalized[
                "normalization_method"
            ] = "basic_time_parse"

            # ------------------------------------------------
            # CONFIDENCE
            # ------------------------------------------------
            confidence = 0.85

            if normalized["ambiguity_flags"]:
                confidence -= 0.25

            normalized[
                "time_confidence"
            ] = max(confidence, 0.1)

        except Exception:

            normalized["ambiguity_flags"].append(
                "parse_failure"
            )

            normalized[
                "normalization_method"
            ] = "parse_failure"

    else:

        normalized["ambiguity_flags"].append(
            "unrecognized_time_format"
        )

    return normalized