# ============================================================
# phrase/engine.py — Grounded Phrase Engine (iSEES Phase 3)
# ============================================================

from typing import List, Dict


# ------------------------------------------------------------
# TEMPLATE LIBRARY (DETERMINISTIC)
# ------------------------------------------------------------

PHRASE_TEMPLATES = {
    "AIRPORT": [
        "FAA radar logs near {name} during event window",
        "ATC communications at {name} around incident time",
        "flight activity near {name} during anomaly",
    ],
    "MILITARY": [
        "DoD activity near {name} during event window",
        "military radar data around {name}",
        "restricted airspace activity near {name}",
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
    """
    Convert ranked assets into structured investigation phrases
    with distance-aware context.
    """

    if not resolved.get("resolved"):
        return ["location unresolved — expand search region"]

    phrases = []

    for asset in resolved.get("assets", [])[:max_targets]:

        # skip generic anchors (optional but recommended)
        if asset["type"] == "INFRA":
            continue

        name = clean_name(asset["name"])
        dist = asset.get("distance_km", 0.0)
        atype = asset["type"]

        templates = PHRASE_TEMPLATES.get(atype, PHRASE_TEMPLATES["UNKNOWN"])

        # embed distance into name for grounded phrasing
        name_with_dist = f"{name} ({round(dist, 2)} km)"

        for t in templates:
            phrase = t.format(name=name_with_dist)
            phrases.append(phrase)

    return phrases


# ------------------------------------------------------------
# CLEANUP (NORMALIZE NAMES)
# ------------------------------------------------------------

def clean_name(name: str) -> str:
    """
    Remove excessive labels like (KMFR)
    """
    if "(" in name:
        name = name.split("(")[0].strip()
    return name