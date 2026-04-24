# ============================================================
# geo/ranker.py — Asset Ranking Engine (iSEES Phase 2 FIXED)
# ============================================================

from typing import List, Dict
import math


# ------------------------------------------------------------
# TYPE PRIORITY (Investigation relevance)
# ------------------------------------------------------------

TYPE_WEIGHTS = {
    "RADAR": 1.0,
    "MILITARY": 0.9,
    "AIRPORT": 0.8,
    "MEDIA": 0.6,
    "INFRA": 0.4,
    "UNKNOWN": 0.2
}


# ------------------------------------------------------------
# DISTANCE CALCULATION (km)
# ------------------------------------------------------------

def haversine(lat1, lon1, lat2, lon2):
    R = 6371

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) *
        math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ------------------------------------------------------------
# RANKING ENGINE
# ------------------------------------------------------------

def rank_assets(origin_lat: float, origin_lon: float, assets: List[Dict]) -> List[Dict]:
    """
    Ranking logic with anchor penalty
    """

    ranked = []

    for a in assets:
        dist = haversine(origin_lat, origin_lon, a["lat"], a["lon"])
        weight = TYPE_WEIGHTS.get(a["type"], 0.2)

        # BASE SCORE
        score = (1 / (1 + dist)) * weight

        # ----------------------------------------------------
        # ANCHOR PENALTY (critical fix)
        # ----------------------------------------------------
        if a["type"] == "INFRA":
            score *= 0.25   # reduce dominance

        enriched = a.copy()
        enriched["distance_km"] = round(dist, 2)
        enriched["score"] = round(score, 4)

        ranked.append(enriched)

    ranked.sort(key=lambda x: x["score"], reverse=True)

    return ranked