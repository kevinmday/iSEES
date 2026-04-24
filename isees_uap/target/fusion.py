# ============================================================
# target/fusion.py — Geo Target Integration Layer (iSEES)
# ============================================================

from typing import List, Dict


def build_geo_targets(resolved: Dict, top_n: int = 3) -> List[str]:
    """
    Convert ranked geo assets into investigation targets
    """

    if not resolved.get("resolved"):
        return ["Location unresolved"]

    targets = []

    for asset in resolved.get("assets", [])[:top_n]:

        # optional filter — remove generic anchors
        if asset["type"] == "INFRA":
            continue

        name = asset["name"]
        dist = asset["distance_km"]
        atype = asset["type"]

        label = format_target_label(name, atype, dist)
        targets.append(label)

    return targets


def format_target_label(name: str, atype: str, dist: float) -> str:

    prefix_map = {
        "AIRPORT": "FAA",
        "MILITARY": "DoD",
        "RADAR": "Radar",
        "MEDIA": "Media",
        "INFRA": "Local"
    }

    prefix = prefix_map.get(atype, "Data")

    return f"{prefix} — {name} ({dist} km)"