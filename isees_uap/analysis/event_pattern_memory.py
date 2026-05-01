# ============================================================
# event_pattern_memory.py — EVENT-LEVEL PATTERN MEMORY (V1)
# ============================================================

import os
import json
from datetime import datetime, UTC
from typing import Dict, List
from math import radians, sin, cos, sqrt, atan2


# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MEMORY_FILE = os.path.join(BASE_DIR, "memory", "event_memory.json")

# spatial tolerance (event centers)
MATCH_RADIUS_KM = 8.0

# temporal tolerance (event midpoint similarity)
MATCH_TIME_WINDOW_SEC = 48 * 3600  # 48 hours


# ------------------------------------------------------------
# UTIL
# ------------------------------------------------------------

def _now():
    return datetime.now(UTC).isoformat()


def _parse_time(ts: str):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _haversine_km(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return 9999

    R = 6371.0

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


# ------------------------------------------------------------
# STORAGE
# ------------------------------------------------------------

def _load_memory() -> List[Dict]:
    if not os.path.exists(MEMORY_FILE):
        return []

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []


def _save_memory(memory: List[Dict]):
    os.makedirs(os.path.dirname(MEMORY_FILE), exist_ok=True)

    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2)


# ------------------------------------------------------------
# MATCH LOGIC
# ------------------------------------------------------------

def _event_signature(event: Dict):
    center = event.get("event_center", {})
    lat = center.get("lat")
    lon = center.get("lon")

    midpoint = _parse_time(event.get("inferred_event_time"))

    return lat, lon, midpoint


def _match_event(event: Dict, memory_entry: Dict) -> bool:
    lat1, lon1, t1 = _event_signature(event)

    lat2 = memory_entry["lat"]
    lon2 = memory_entry["lon"]
    t2 = _parse_time(memory_entry["midpoint"])

    dist = _haversine_km(lat1, lon1, lat2, lon2)
    time_delta = abs((t1 - t2).total_seconds())

    if dist <= MATCH_RADIUS_KM and time_delta <= MATCH_TIME_WINDOW_SEC:
        return True

    return False


# ------------------------------------------------------------
# CORE
# ------------------------------------------------------------

def update_event_pattern_memory(event: Dict) -> Dict:
    """
    Persistent event-level memory
    """

    lat, lon, midpoint = _event_signature(event)

    if lat is None or lon is None:
        return {
            "event_repeat_count": 0,
            "event_pattern_type": "unknown",
            "first_seen": None,
            "last_seen": None
        }

    memory = _load_memory()

    match = None

    for entry in memory:
        if _match_event(event, entry):
            match = entry
            break

    now = _now()

    if match:
        match["repeat_count"] += 1
        match["last_seen"] = now
    else:
        match = {
            "lat": lat,
            "lon": lon,
            "midpoint": midpoint.isoformat(),
            "repeat_count": 1,
            "first_seen": now,
            "last_seen": now
        }
        memory.append(match)

    _save_memory(memory)

    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    rc = match["repeat_count"]

    if rc >= 5:
        pattern_type = "persistent_event"
    elif rc >= 3:
        pattern_type = "recurring_event"
    elif rc >= 2:
        pattern_type = "repeat_event"
    else:
        pattern_type = "single_event"

    return {
        "event_repeat_count": rc,
        "event_pattern_type": pattern_type,
        "first_seen": match["first_seen"],
        "last_seen": match["last_seen"]
    }


# ------------------------------------------------------------
# APPLY TO ALL EVENTS
# ------------------------------------------------------------

def apply_event_pattern_memory(events: List[Dict]) -> List[Dict]:

    results = []

    for e in events:
        pattern = update_event_pattern_memory(e)

        e["event_pattern"] = pattern

        results.append(e)

    return results