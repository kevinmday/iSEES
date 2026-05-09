# ============================================================
# observer_generator.py
# Synthetic Observer Profile Generator
# ============================================================

import json
import random
from pathlib import Path


# ------------------------------------------------------------
# LOAD PROFILES
# ------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
PROFILE_FILE = BASE_DIR / "profiles" / "observer_profiles.json"

with open(PROFILE_FILE, "r", encoding="utf-8") as f:
    OBSERVER_PROFILES = json.load(f)


# ------------------------------------------------------------
# GENERATE OBSERVER
# ------------------------------------------------------------

def generate_observer(profile_type=None):

    if profile_type is None:
        profile_type = random.choice(list(OBSERVER_PROFILES.keys()))

    profile = OBSERVER_PROFILES.get(profile_type)

    if not profile:
        raise ValueError(f"Unknown observer profile: {profile_type}")

    observer = {
        "observer_type": profile_type,

        "confidence_bias":
            profile.get("confidence_bias", 0.5),

        "technical_accuracy":
            profile.get("technical_accuracy", 0.5),

        "semantic_style":
            profile.get("semantic_style", "casual"),

        "location_precision":
            profile.get("location_precision", "medium"),

        "timing_precision":
            profile.get("timing_precision", "medium"),

        "spoof_susceptibility":
            profile.get("spoof_susceptibility", 0.5),

        "verbosity":
            profile.get("verbosity", "moderate"),
    }

    return observer


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":

    for _ in range(5):
        print(generate_observer())