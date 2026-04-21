# ============================================================
# tokens/token_library.py
# iSEES-UAP — Phase 6 Token Library
# ============================================================

SENSOR_TOKENS = {
    "high_signal": [
        "radar high speed",
        "strong radar return",
        "high velocity track"
    ],
    "low_noise": [
        "clean signal",
        "low noise radar",
        "clear detection"
    ],
    "persistence": [
        "persistent track",
        "continuous tracking",
        "sustained contact"
    ],
    "anomaly": [
        "no IFF",
        "unknown signature",
        "unidentified contact"
    ]
}

REPORT_TOKENS = {
    "visual": [
        "pilot visual",
        "eyewitness confirmation",
        "direct observation"
    ],
    "motion": [
        "maneuvering object",
        "erratic movement",
        "rapid acceleration"
    ],
    "propulsion": [
        "no propulsion",
        "no visible exhaust",
        "silent movement"
    ]
}

ENV_TOKENS = {
    "clear": [
        "clear weather",
        "high visibility conditions"
    ],
    "stable": [
        "stable atmosphere",
        "low turbulence environment"
    ]
}