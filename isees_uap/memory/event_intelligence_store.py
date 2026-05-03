# ============================================================
# event_intelligence_store.py — PERSISTENT EVENT MEMORY (V2 FIXED)
# ============================================================

import json
import os
from datetime import datetime, UTC
from typing import Dict

STORE_PATH = "isees_uap/memory/event_intelligence.json"


# ------------------------------------------------------------
# LOAD / SAVE
# ------------------------------------------------------------

def load_store() -> Dict:
    if not os.path.exists(STORE_PATH):
        return {"locations": {}}

    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"locations": {}}


def save_store(store: Dict) -> None:
    os.makedirs(os.path.dirname(STORE_PATH), exist_ok=True)

    try:
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=2)
    except Exception:
        pass


# ------------------------------------------------------------
# UTIL
# ------------------------------------------------------------

def _location_key(lat: float, lon: float) -> str:
    """
    Normalize location to prevent fragmentation
    """
    lat_r = round(lat, 3)
    lon_r = round(lon, 3)
    return f"{lat_r},{lon_r}"


def _extract_lat_lon(event: Dict):
    """
    Extract lat/lon from ANY known structure
    """

    # 1. direct
    if "lat" in event and "lon" in event:
        return event.get("lat"), event.get("lon")

    # 2. event_center (your main pipeline)
    if "event_center" in event:
        center = event.get("event_center", {})
        return center.get("lat"), center.get("lon")

    # 3. geo_context.center (report-level)
    geo = event.get("geo_context", {})
    if "center" in geo:
        center = geo.get("center", {})
        return center.get("lat"), center.get("lon")

    return None, None


# ------------------------------------------------------------
# UPDATE MEMORY
# ------------------------------------------------------------

def update_from_event(event: Dict) -> None:
    """
    Update persistent memory from a new event
    """

    lat, lon = _extract_lat_lon(event)

    if lat is None or lon is None:
        return  # safe exit

    store = load_store()

    key = _location_key(lat, lon)

    now = datetime.now(UTC).isoformat()

    locations = store.setdefault("locations", {})

    if key not in locations:
        locations[key] = {
            "total_events": 0,
            "first_seen": now,
            "last_seen": now,
            "event_types": {},
        }

    loc = locations[key]

    # update counts
    loc["total_events"] += 1
    loc["last_seen"] = now

    # event type tracking (safe)
    event_type = event.get("event", {}).get("type", "unknown")
    loc["event_types"][event_type] = loc["event_types"].get(event_type, 0) + 1

    save_store(store)


# ------------------------------------------------------------
# QUERY MEMORY
# ------------------------------------------------------------

def get_location_intelligence(lat: float, lon: float) -> Dict:
    """
    Retrieve intelligence for a location
    """

    store = load_store()

    key = _location_key(lat, lon)

    locations = store.get("locations", {})

    if key not in locations:
        return {
            "known": False,
            "total_events": 0,
            "recurrence_score": 0.0,
        }

    loc = locations[key]

    total_events = loc.get("total_events", 0)

    # deterministic recurrence curve
    recurrence_score = min(1.0, total_events * 0.1)

    return {
        "known": True,
        "total_events": total_events,
        "recurrence_score": round(recurrence_score, 3),
        "last_seen": loc.get("last_seen"),
    }