# ============================================================
# facility_resolver.py — DYNAMIC FACILITY RESOLUTION (V1)
# ============================================================
# Purpose:
# Resolve nearest real-world facilities (airport, ATC, radar, etc.)
# based on lat/lon input. Designed for deterministic, local-only
# investigation targeting within iSEES UAP pipeline.
#
# Characteristics:
# - Deterministic ordering (distance-based)
# - Local-only integrity (radius constrained)
# - Safe fallback dataset (no external dependency required)
# - Ready for future API expansion (FAA / Overpass / NOAA)
# ============================================================

from typing import List, Dict
import math

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

MAX_RADIUS_KM = 150  # hard cutoff for "local-only" integrity


# ------------------------------------------------------------
# HELPER: HAVERSINE DISTANCE
# ------------------------------------------------------------

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# ------------------------------------------------------------
# FALLBACK DATASET (LOCAL, DETERMINISTIC)
# ------------------------------------------------------------
# NOTE: Expand this over time or replace with live resolvers

FALLBACK_FACILITIES = [
    {
        "type": "AIRPORT",
        "name": "Rogue Valley International Airport",
        "icao": "KMFR",
        "lat": 42.3742,
        "lon": -122.8735,
        "contact": {
            "phone": "+1-541-776-7222",
            "email": "operations@mfrairport.org",
            "website": "https://flymfr.com",
            "address": "1000 Terminal Loop Pkwy, Medford, OR 97504",
            "poc": "Operations Duty Manager",
            "department": "Airport Operations",
        },
    },
    {
        "type": "ATC",
        "name": "Medford Air Traffic Control Tower",
        "icao": "KMFR",
        "lat": 42.3742,
        "lon": -122.8735,
        "contact": {
            "phone": "+1-541-842-2060",
            "email": "9-ANM-MFR-Tower@faa.gov",
            "address": "Medford Airport Control Tower, Medford, OR 97504",
            "poc": "Tower Supervisor",
            "department": "FAA Tower Operations",
        },
    },
    {
        "type": "WEATHER_RADAR",
        "name": "KMAX NEXRAD Radar Site",
        "lat": 42.0811,
        "lon": -122.7175,
        "contact": {
            "phone": "+1-541-776-4303",
            "email": "medford.weather@noaa.gov",
            "website": "https://www.weather.gov/mfr",
            "address": "4003 Cirrus Dr, Medford, OR 97504",
            "poc": "Duty Meteorologist",
            "department": "NWS Medford Office",
        },
    },
]


# ------------------------------------------------------------
# CORE RESOLVER
# ------------------------------------------------------------

def resolve_facilities(lat: float, lon: float) -> List[Dict]:
    """
    Resolve nearest facilities based on input coordinates.

    Args:
        lat (float): latitude
        lon (float): longitude

    Returns:
        List[Dict]: sorted facility list (nearest first)
    """

    results = []

    for facility in FALLBACK_FACILITIES:
        dist = haversine_km(lat, lon, facility["lat"], facility["lon"])

        if dist <= MAX_RADIUS_KM:
            enriched = dict(facility)  # shallow copy
            enriched["distance_km"] = round(dist, 2)
            results.append(enriched)

    # deterministic sort (nearest first)
    results.sort(key=lambda x: x["distance_km"])

    return results


# ------------------------------------------------------------
# FUTURE HOOKS (PLACEHOLDERS)
# ------------------------------------------------------------

def fetch_overpass_facilities(lat: float, lon: float) -> List[Dict]:
    """
    Future: integrate OpenStreetMap Overpass API
    """
    return []


def fetch_faa_facilities(lat: float, lon: float) -> List[Dict]:
    """
    Future: integrate FAA datasets
    """
    return []


def fetch_noaa_radar(lat: float, lon: float) -> List[Dict]:
    """
    Future: integrate NOAA/NEXRAD live endpoints
    """
    return []


# ------------------------------------------------------------
# UNIFIED ENTRY POINT (EXPANDABLE)
# ------------------------------------------------------------

def resolve_all_facilities(lat: float, lon: float) -> List[Dict]:
    """
    Master resolver combining all sources (fallback + future APIs)
    """

    facilities = []

    # 1. fallback baseline (always present)
    facilities.extend(resolve_facilities(lat, lon))

    # 2. future sources (disabled until implemented)
    facilities.extend(fetch_overpass_facilities(lat, lon))
    facilities.extend(fetch_faa_facilities(lat, lon))
    facilities.extend(fetch_noaa_radar(lat, lon))

    # remove duplicates (basic)
    unique = {}
    for f in facilities:
        key = f.get("name")
        if key not in unique:
            unique[key] = f

    final = list(unique.values())

    # final sort
    final.sort(key=lambda x: x.get("distance_km", 9999))

    return final


# ------------------------------------------------------------
# QUICK TEST (LOCAL DEBUG)
# ------------------------------------------------------------

if __name__ == "__main__":
    # Medford test coords
    test_lat = 42.3265
    test_lon = -122.8756

    facilities = resolve_all_facilities(test_lat, test_lon)

    for f in facilities:
        print(f"{f['name']} ({f['type']}) - {f['distance_km']} km")