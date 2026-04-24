# ============================================================
# geo/resolver.py — Location Resolution Orchestrator (iSEES)
# ============================================================

from typing import Dict, List

from .geocoder import geocode_location
from .assets import get_nearby_assets
from .ranker import rank_assets


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

    assets = get_nearby_assets(lat, lon)

    ranked = rank_assets(lat, lon, assets)

    return {
        "location": location,
        "resolved": True,
        "lat": lat,
        "lon": lon,
        "assets": ranked
    }