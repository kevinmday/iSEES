# ============================================================
# temporal_mutator.py
# Temporal Drift / Delayed Reporting Engine
# ============================================================

from datetime import datetime, timedelta, UTC
import random


# ------------------------------------------------------------
# DELAY PROFILES
# ------------------------------------------------------------

DELAY_PROFILES = {

    "high_precision": {
        "min_seconds": 0,
        "max_seconds": 90
    },

    "moderate_precision": {
        "min_seconds": 30,
        "max_seconds": 1800
    },

    "low_precision": {
        "min_seconds": 300,
        "max_seconds": 21600
    },

    "delayed_upload": {
        "min_seconds": 3600,
        "max_seconds": 86400
    }
}


# ------------------------------------------------------------
# PRECISION MAPPING
# ------------------------------------------------------------

PRECISION_MAP = {
    "high": "high_precision",
    "medium": "moderate_precision",
    "low": "low_precision"
}


# ------------------------------------------------------------
# APPLY TEMPORAL DRIFT
# ------------------------------------------------------------

def mutate_timestamp(observer, base_time=None):

    if base_time is None:
        base_time = datetime.now(UTC)

    timing_precision = observer.get(
        "timing_precision",
        "medium"
    )

    profile_name = PRECISION_MAP.get(
        timing_precision,
        "moderate_precision"
    )

    profile = DELAY_PROFILES[profile_name]

    delay_seconds = random.randint(
        profile["min_seconds"],
        profile["max_seconds"]
    )

    mutated_time = base_time + timedelta(
        seconds=delay_seconds
    )

    return {
        "base_time_utc": base_time.isoformat(),
        "mutated_time_utc": mutated_time.isoformat(),
        "delay_seconds": delay_seconds
    }


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":

    test_observers = [
        {"timing_precision": "high"},
        {"timing_precision": "medium"},
        {"timing_precision": "low"}
    ]

    for observer in test_observers:
        print(mutate_timestamp(observer))