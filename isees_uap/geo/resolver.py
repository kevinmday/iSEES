# ============================================================
# geo/resolver.py — Location Resolution Orchestrator (iSEES)
# (WITH DOMAIN INTELLIGENCE LAYER — GRAPH-COMPATIBLE)
# ============================================================

from typing import Dict, List

from .geocoder import geocode_location
from .assets import get_nearby_assets
from .ranker import rank_assets

# FIXED: correct package path
from isees_uap.intelligence.domain_resolver import resolve_domain_targets


def resolve_location_to_assets(location: str) -> Dict:
    """
    End-to-end resolution:

    Input:
        "Medford, OR"

    Output:
        {
            location,
            resolved,
            lat,
            lon,
            assets (ranked)
        }
    """

    coords = geocode_location(location)

    if not coords:
        return {
            "location": location,
            "resolved": False,
            "assets": []
        }

    lat, lon = coords

    # --------------------------------------------------------
    # GEO LAYER (physical)
    # --------------------------------------------------------
    assets = get_nearby_assets(lat, lon)

    # --------------------------------------------------------
    # DOMAIN LAYER (semantic)
    # --------------------------------------------------------
    tokens: List[str] = location.lower().split()

    domain_targets = resolve_domain_targets(tokens, location)

    # --------------------------------------------------------
    # MERGE GEO + DOMAIN (FIXED FOR GRAPH)
    # --------------------------------------------------------
    existing_names = {a.get("name") for a in assets}

    for d in domain_targets:
        if d.get("name") not in existing_names:
            # 🔥 CRITICAL FIX: ensure graph compatibility
            assets.append({
                **d,
                "lat": lat,
                "lon": lon,
                "distance": 0
            })

    # --------------------------------------------------------
    # RANKING
    # --------------------------------------------------------
    ranked = rank_assets(lat, lon, assets)

    return {
        "location": location,
        "resolved": True,
        "lat": lat,
        "lon": lon,
        "assets": ranked
    }