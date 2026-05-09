# ============================================================
# semantic_mutator.py
# Observer-Aware Semantic Mutation Engine
# ============================================================

import random


# ------------------------------------------------------------
# SEMANTIC STYLE LIBRARY
# ------------------------------------------------------------

SEMANTIC_STYLES = {

    "aviation": [
        "unidentified traffic",
        "non-transponder target",
        "high-altitude object",
        "erratic aerial contact",
        "stationary traffic"
    ],

    "radar_operational": [
        "primary radar return",
        "intermittent track",
        "unresolved contact",
        "velocity anomaly",
        "non-cooperative target"
    ],

    "astronomy": [
        "luminous anomaly",
        "unusual celestial motion",
        "high-energy flare",
        "orbital-looking object",
        "unexplained atmospheric light"
    ],

    "incident_report": [
        "unidentified object observed",
        "suspicious aerial activity",
        "light source moving abnormally",
        "possible drone-like object",
        "unknown airborne phenomenon"
    ],

    "moving_observer": [
        "bright thing in the sky",
        "something pacing the vehicle",
        "weird moving light",
        "fast object overhead",
        "odd glowing object"
    ],

    "tactical_operational": [
        "maneuvering contact",
        "anomalous airborne object",
        "unresolved tactical picture",
        "non-ballistic movement",
        "high-performance unknown"
    ],

    "dramatic": [
        "massive glowing craft",
        "impossible aerial vehicle",
        "silent hovering object",
        "otherworldly light formation",
        "unbelievable object in the sky"
    ],

    "uncertain": [
        "possibly a drone",
        "might have been an aircraft",
        "unsure what was observed",
        "hard to identify object",
        "possibly atmospheric"
    ],

    "informal": [
        "weird object",
        "strange light",
        "odd thing in the sky",
        "crazy looking object",
        "bright floating thing"
    ],

    "casual": [
        "bright object",
        "moving light",
        "strange aircraft",
        "weird aerial thing",
        "odd airborne object"
    ]
}


# ------------------------------------------------------------
# GENERATE MUTATED DESCRIPTION
# ------------------------------------------------------------

def mutate_semantics(observer):

    semantic_style = observer.get("semantic_style", "casual")

    phrase_pool = SEMANTIC_STYLES.get(
        semantic_style,
        SEMANTIC_STYLES["casual"]
    )

    description = random.choice(phrase_pool)

    return description


# ------------------------------------------------------------
# QUICK TEST
# ------------------------------------------------------------

if __name__ == "__main__":

    test_observers = [
        {"semantic_style": "aviation"},
        {"semantic_style": "dramatic"},
        {"semantic_style": "uncertain"},
        {"semantic_style": "tactical_operational"}
    ]

    for observer in test_observers:
        print(mutate_semantics(observer))