# ============================================================
# geo/assets.py — FINAL (GEO-CORRECT + EXPANDED DISCOVERY)
# ============================================================

from typing import List, Dict
import requests
import math

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


# ------------------------------------------------------------
# PUBLIC ENTRY
# ------------------------------------------------------------

def get_nearby_assets(lat: float, lon: float, radius: int = 50000) -> List[Dict]:
    """
    Deterministic Asset Discovery (Geo-Correct)

    Strategy:
    1. Query Overpass (local radius)
    2. If empty → expand radius
    3. If still empty → fallback (LOCAL synthetic)
    """

    assets = query_overpass(lat, lon, radius)

    # --------------------------------------------------------
    # EXPAND SEARCH IF EMPTY (CORRECT FALLBACK)
    # --------------------------------------------------------
    if not assets:
        assets = query_overpass(lat, lon, radius * 3)

    # --------------------------------------------------------
    # FINAL FALLBACK (LOCAL ONLY)
    # --------------------------------------------------------
    if not assets:
        assets = fallback_assets(lat, lon)

    # --------------------------------------------------------
    # ADD DISTANCE (CRITICAL FOR SCORING)
    # --------------------------------------------------------
    for a in assets:
        if a.get("lat") and a.get("lon"):
            a["distance"] = haversine(lat, lon, a["lat"], a["lon"])
        else:
            a["distance"] = None

    return assets


# ------------------------------------------------------------
# PRIMARY — Overpass (EXPANDED)
# ------------------------------------------------------------

def query_overpass(lat: float, lon: float, radius: int) -> List[Dict]:

    query = f"""
    [out:json][timeout:10];
    (
      node["aeroway"="aerodrome"](around:{radius},{lat},{lon});
      way["aeroway"="aerodrome"](around:{radius},{lat},{lon});

      node["aeroway"="helipad"](around:{radius},{lat},{lon});

      node["military"](around:{radius},{lat},{lon});
      way["military"](around:{radius},{lat},{lon});

      node["man_made"="tower"](around:{radius},{lat},{lon});
      way["man_made"="tower"](around:{radius},{lat},{lon});

      node["communication"](around:{radius},{lat},{lon});
      way["communication"](around:{radius},{lat},{lon});
    );
    out center;
    """

    try:
        response = requests.post(OVERPASS_URL, data=query, timeout=10)

        if response.status_code != 200:
            return []

        data = response.json()
        results = []

        for el in data.get("elements", []):
            tags = el.get("tags", {})

            lat_val = el.get("lat") or el.get("center", {}).get("lat")
            lon_val = el.get("lon") or el.get("center", {}).get("lon")

            if lat_val is None or lon_val is None:
                continue

            results.append({
                "name": tags.get("name", "UNKNOWN"),
                "type": classify_asset(tags),
                "lat": lat_val,
                "lon": lon_val,
                "icao": tags.get("icao", None),
                "distance": None
            })

        return results

    except Exception:
        return []


# ------------------------------------------------------------
# FALLBACK — LOCAL SYNTHETIC (NOT GLOBAL)
# ------------------------------------------------------------

def fallback_assets(lat: float, lon: float) -> List[Dict]:
    """
    Last-resort fallback — preserves locality
    NEVER injects unrelated geography
    """

    return [
        {
            "name": "Local Airspace (Unresolved)",
            "type": "airport",
            "icao": None,
            "lat": lat,
            "lon": lon,
            "distance": 0
        },
        {
            "name": "Regional Infrastructure Node",
            "type": "infra",
            "lat": lat,
            "lon": lon,
            "distance": 0
        }
    ]


# ------------------------------------------------------------
# CLASSIFIER
# ------------------------------------------------------------

def classify_asset(tags: Dict) -> str:

    if "aeroway" in tags:
        return "airport"

    if "military" in tags:
        return "military"

    if "man_made" in tags:
        return "tower"

    if "communication" in tags:
        return "comms"

    return "unknown"


# ------------------------------------------------------------
# DISTANCE — HAVERSINE
# ------------------------------------------------------------

def haversine(lat1, lon1, lat2, lon2):
    """
    Distance in kilometers
    """

    R = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(dlambda / 2.0) ** 2

    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))