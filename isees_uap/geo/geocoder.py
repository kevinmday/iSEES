# ============================================================
# geo/geocoder.py — Deterministic Geocoder (iSEES Phase 2)
# ============================================================

from typing import Tuple, Optional
import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

HEADERS = {
    "User-Agent": "iSEES-UAP/1.0 (deterministic-engine)"
}

def geocode_location(location: str) -> Optional[Tuple[float, float]]:
    """
    Resolve a location string to (lat, lon)

    Deterministic behavior:
    - Always returns top result only
    - No fuzzy branching
    - Returns None on failure
    """

    if not location or not location.strip():
        return None

    try:
        params = {
            "q": location,
            "format": "json",
            "limit": 1
        }

        response = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=HEADERS,
            timeout=5
        )

        if response.status_code != 200:
            return None

        data = response.json()

        if not data:
            return None

        lat = float(data[0]["lat"])
        lon = float(data[0]["lon"])

        return (lat, lon)

    except Exception:
        return None