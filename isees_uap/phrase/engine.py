# ============================================================
# phrase/engine.py — SIGNAL-AWARE PHRASE ENGINE (FIXED)
# ============================================================

from typing import List, Dict


# ------------------------------------------------------------
# TEMPLATE LIBRARY (ENHANCED SIGNAL)
# ------------------------------------------------------------

PHRASE_TEMPLATES = {
    "AIRPORT": [
        "FAA radar logs near {name} during event window",
        "ATC communications at {name} around incident time",
        "flight activity near {name} during anomaly",

        # 🔥 SIGNAL INJECTION (CRITICAL)
        "radar anomaly near {name}",
        "unidentified aircraft near {name}",
        "ATC communication anomaly at {name}",
        "flight path irregularity near {name}",
    ],
    "MILITARY": [
        "DoD activity near {name} during event window",
        "military radar data around {name}",
        "restricted airspace activity near {name}",

        # signal
        "military radar anomaly near {name}",
    ],
    "RADAR": [
        "radar returns near {name} during event window",
        "signal anomalies detected by {name}",
    ],
    "MEDIA": [
        "local news reports near {name} related to event",
        "journalist coverage near {name} incident",
    ],
    "INFRA": [
        "environmental data near {name}",
    ],
    "UNKNOWN": [
        "data sources near {name} related to event",
    ]
}


# ------------------------------------------------------------
# ENGINE
# ------------------------------------------------------------

def build_phrases(resolved: Dict, max_targets: int = 3) -> List[str]:

    if not resolved or not resolved.get("resolved"):
        return ["location unresolved — expand search region"]

    phrases = []

    for asset in resolved.get("assets", [])[:max_targets]:

        # ----------------------------------------------------
        # NORMALIZE TYPE (CRITICAL FIX)
        # ----------------------------------------------------
        atype = str(asset.get("type", "UNKNOWN")).upper()

        # skip generic anchors if desired
        if atype == "INFRA":
            continue

        name = clean_name(asset.get("name", "unknown"))
        dist = asset.get("distance", asset.get("distance_km", 0.0))

        templates = PHRASE_TEMPLATES.get(atype, PHRASE_TEMPLATES["UNKNOWN"])

        name_with_dist = f"{name} ({round(dist, 2)} km)"

        for t in templates:
            phrases.append(t.format(name=name_with_dist))

    # --------------------------------------------------------
    # GUARANTEED BASELINE SIGNAL (NO DEAD PIPELINE)
    # --------------------------------------------------------
    if not phrases:
        phrases.extend([
            "radar anomaly",
            "unidentified aerial phenomenon",
            "flight path irregularity",
            "airspace anomaly detected"
        ])

    return phrases


# ------------------------------------------------------------
# CLEANUP (NORMALIZE NAMES)
# ------------------------------------------------------------

def clean_name(name: str) -> str:
    """
    Remove labels like (KMFR)
    """
    if not name:
        return "unknown"

    if "(" in name:
        name = name.split("(")[0].strip()

    return name